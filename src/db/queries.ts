import { getDatabase } from './database';

export type ProductRow = {
  id: number;
  name: string;
  quantity: number;
  is_checked: boolean;
};

export type SubcategoryNode = {
  id: number;
  name: string;
  is_checked: boolean;
  is_collapsed: boolean;
  products: ProductRow[];
};

export type CategoryNode = {
  id: number;
  name: string;
  color: string;
  is_checked: boolean;
  is_collapsed: boolean;
  subcategories: SubcategoryNode[];
};

export type ListRow = { id: number; name: string };

//Listas

export async function getLists(): Promise<ListRow[]> {
  const db = getDatabase();
  return db.getAllAsync<ListRow>('SELECT id, name FROM lists ORDER BY created_at ASC');
}

export async function getListById(listId: number): Promise<ListRow | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<ListRow>('SELECT id, name FROM lists WHERE id = ?', [listId]);
  return row ?? null;
}

export async function createList(name: string): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync('INSERT INTO lists (name) VALUES (?)', [name]);
  return result.lastInsertRowId;
}

export async function renameList(listId: number, name: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE lists SET name = ? WHERE id = ?', [name, listId]);
}

export async function deleteList(listId: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM lists WHERE id = ?', [listId]);
}

//Arbol de listas

export async function getListTree(listId: number): Promise<CategoryNode[]> {
  const db = getDatabase();

  const rows = await db.getAllAsync<{
    category_id: number;
    category_name: string;
    category_color: string;
    subcategory_id: number;
    subcategory_name: string;
    product_id: number;
    product_name: string;
    quantity: number;
    is_checked: number;
  }>(
    `SELECT
       c.id as category_id, c.name as category_name, c.color as category_color,
       sc.id as subcategory_id, sc.name as subcategory_name,
       p.id as product_id, p.name as product_name,
       li.quantity as quantity, li.is_checked as is_checked
     FROM list_items li
     JOIN products p ON p.id = li.product_id
     JOIN subcategories sc ON sc.id = p.subcategory_id
     JOIN categories c ON c.id = sc.category_id
     WHERE li.list_id = ?
     ORDER BY c.sort_order, sc.sort_order, p.sort_order`,
    [listId]
  );

  const collapsedCats = await db.getAllAsync<{ category_id: number; is_collapsed: number }>(
    'SELECT category_id, is_collapsed FROM list_category_state WHERE list_id = ?',
    [listId]
  );
  const collapsedSubs = await db.getAllAsync<{ subcategory_id: number; is_collapsed: number }>(
    'SELECT subcategory_id, is_collapsed FROM list_subcategory_state WHERE list_id = ?',
    [listId]
  );
  const collapsedCatMap = new Map(collapsedCats.map((r) => [r.category_id, !!r.is_collapsed]));
  const collapsedSubMap = new Map(collapsedSubs.map((r) => [r.subcategory_id, !!r.is_collapsed]));

  const categoryMap = new Map<number, CategoryNode>();

  for (const row of rows) {
    if (!categoryMap.has(row.category_id)) {
      categoryMap.set(row.category_id, {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        is_checked: false,
        is_collapsed: collapsedCatMap.get(row.category_id) ?? false,
        subcategories: [],
      });
    }
    const category = categoryMap.get(row.category_id)!;

    let subcategory = category.subcategories.find((s) => s.id === row.subcategory_id);
    if (!subcategory) {
      subcategory = {
        id: row.subcategory_id,
        name: row.subcategory_name,
        is_checked: false,
        is_collapsed: collapsedSubMap.get(row.subcategory_id) ?? false,
        products: [],
      };
      category.subcategories.push(subcategory);
    }

    subcategory.products.push({
      id: row.product_id,
      name: row.product_name,
      quantity: row.quantity,
      is_checked: !!row.is_checked,
    });
  }

  const categories = Array.from(categoryMap.values());
  for (const category of categories) {
    for (const sub of category.subcategories) {
      sub.is_checked = sub.products.every((p) => p.is_checked);
      if (!collapsedSubMap.has(sub.id)) sub.is_collapsed = sub.is_checked;
    }
    category.is_checked = category.subcategories.every((s) => s.is_checked);
    if (!collapsedCatMap.has(category.id)) category.is_collapsed = category.is_checked;
  }

  return categories;
}

//Mutaciones

export async function toggleProductChecked(
  listId: number,
  productId: number,
  checked: boolean
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE list_items SET is_checked = ? WHERE list_id = ? AND product_id = ?',
    [checked ? 1 : 0, listId, productId]
  );
}

export async function setSubcategoryChecked(
  listId: number,
  subcategoryId: number,
  checked: boolean
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE list_items SET is_checked = ?
     WHERE list_id = ? AND product_id IN (
       SELECT id FROM products WHERE subcategory_id = ?
     )`,
    [checked ? 1 : 0, listId, subcategoryId]
  );
}

export async function setCategoryChecked(
  listId: number,
  categoryId: number,
  checked: boolean
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE list_items SET is_checked = ?
     WHERE list_id = ? AND product_id IN (
       SELECT p.id FROM products p
       JOIN subcategories sc ON sc.id = p.subcategory_id
       WHERE sc.category_id = ?
     )`,
    [checked ? 1 : 0, listId, categoryId]
  );
}

export async function setCategoryCollapsed(
  listId: number,
  categoryId: number,
  collapsed: boolean
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO list_category_state (list_id, category_id, is_collapsed)
     VALUES (?, ?, ?)
     ON CONFLICT(list_id, category_id) DO UPDATE SET is_collapsed = excluded.is_collapsed`,
    [listId, categoryId, collapsed ? 1 : 0]
  );
}

export async function setSubcategoryCollapsed(
  listId: number,
  subcategoryId: number,
  collapsed: boolean
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO list_subcategory_state (list_id, subcategory_id, is_collapsed)
     VALUES (?, ?, ?)
     ON CONFLICT(list_id, subcategory_id) DO UPDATE SET is_collapsed = excluded.is_collapsed`,
    [listId, subcategoryId, collapsed ? 1 : 0]
  );
}

//Catalogo

export type CatalogProduct = { id: number; name: string; in_list: boolean };
export type CatalogSubcategory = { id: number; name: string; products: CatalogProduct[] };
export type CatalogCategory = {
  id: number;
  name: string;
  color: string;
  subcategories: CatalogSubcategory[];
};

export async function getCatalogTree(listId?: number): Promise<CatalogCategory[]> {
  const db = getDatabase();

  const rows = await db.getAllAsync<{
    category_id: number;
    category_name: string;
    category_color: string;
    subcategory_id: number;
    subcategory_name: string;
    product_id: number;
    product_name: string;
    in_list: number;
  }>(
    `SELECT
       c.id as category_id, c.name as category_name, c.color as category_color,
       sc.id as subcategory_id, sc.name as subcategory_name,
       p.id as product_id, p.name as product_name,
       ${listId ? `(SELECT COUNT(*) FROM list_items li WHERE li.list_id = ? AND li.product_id = p.id)` : '0'} as in_list
     FROM categories c
     JOIN subcategories sc ON sc.category_id = c.id
     JOIN products p ON p.subcategory_id = sc.id
     ORDER BY c.sort_order, sc.sort_order, p.sort_order`,
    listId ? [listId] : []
  );

  const categoryMap = new Map<number, CatalogCategory>();
  for (const row of rows) {
    if (!categoryMap.has(row.category_id)) {
      categoryMap.set(row.category_id, {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        subcategories: [],
      });
    }
    const category = categoryMap.get(row.category_id)!;
    let sub = category.subcategories.find((s) => s.id === row.subcategory_id);
    if (!sub) {
      sub = { id: row.subcategory_id, name: row.subcategory_name, products: [] };
      category.subcategories.push(sub);
    }
    sub.products.push({
      id: row.product_id,
      name: row.product_name,
      in_list: !!row.in_list,
    });
  }
  return Array.from(categoryMap.values());
}

export async function getListsContainingProduct(
  productId: number,
  excludeListId?: number
): Promise<ListRow[]> {
  const db = getDatabase();
  return db.getAllAsync<ListRow>(
    `SELECT l.id, l.name FROM lists l
     JOIN list_items li ON li.list_id = l.id
     WHERE li.product_id = ? ${excludeListId ? 'AND l.id != ?' : ''}`,
    excludeListId ? [productId, excludeListId] : [productId]
  );
}

export async function addProductToList(listId: number, productId: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO list_items (list_id, product_id, quantity, is_checked)
     VALUES (?, ?, 1, 0)
     ON CONFLICT(list_id, product_id) DO NOTHING`,
    [listId, productId]
  );
}

export async function removeProductFromList(listId: number, productId: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM list_items WHERE list_id = ? AND product_id = ?', [
    listId,
    productId,
  ]);
}

export async function updateListItemQuantity(
  listId: number,
  productId: number,
  quantity: number
): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE list_items SET quantity = ? WHERE list_id = ? AND product_id = ?',
    [Math.max(1, quantity), listId, productId]
  );
}

//CRUD Catalogo

export type CategoryOption = { id: number; name: string; color: string };
export type SubcategoryOption = { id: number; name: string };
export type DuplicateProduct = { id: number; name: string; categoryName: string; subcategoryName: string };

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const db = getDatabase();
  return db.getAllAsync<CategoryOption>(
    'SELECT id, name, color FROM categories ORDER BY sort_order, name'
  );
}

export async function getSubcategoryOptions(categoryId: number): Promise<SubcategoryOption[]> {
  const db = getDatabase();
  return db.getAllAsync<SubcategoryOption>(
    'SELECT id, name FROM subcategories WHERE category_id = ? ORDER BY sort_order, name',
    [categoryId]
  );
}

export async function findProductByName(name: string): Promise<DuplicateProduct | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<DuplicateProduct>(
    `SELECT p.id, p.name, c.name as categoryName, sc.name as subcategoryName
     FROM products p
     JOIN subcategories sc ON sc.id = p.subcategory_id
     JOIN categories c ON c.id = sc.category_id
     WHERE UPPER(TRIM(p.name)) = UPPER(TRIM(?))
     LIMIT 1`,
    [name]
  );
  return row ?? null;
}

export async function createCategory(name: string, color: string): Promise<number> {
  const db = getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) as m FROM categories'
  );
  const result = await db.runAsync('INSERT INTO categories (name, color, sort_order) VALUES (?, ?, ?)', [
    name,
    color,
    (maxOrder?.m ?? -1) + 1,
  ]);
  return result.lastInsertRowId;
}

export async function createSubcategory(categoryId: number, name: string): Promise<number> {
  const db = getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) as m FROM subcategories WHERE category_id = ?',
    [categoryId]
  );
  const result = await db.runAsync(
    'INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)',
    [categoryId, name, (maxOrder?.m ?? -1) + 1]
  );
  return result.lastInsertRowId;
}

export async function createProduct(subcategoryId: number, name: string): Promise<number> {
  const db = getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) as m FROM products WHERE subcategory_id = ?',
    [subcategoryId]
  );
  const result = await db.runAsync(
    'INSERT INTO products (subcategory_id, name, sort_order) VALUES (?, ?, ?)',
    [subcategoryId, name, (maxOrder?.m ?? -1) + 1]
  );
  return result.lastInsertRowId;
}

//CRUD Catalogo: Renombrar

export async function renameCategory(id: number, name: string, color: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE categories SET name = ?, color = ? WHERE id = ?', [name, color, id]);
}

export async function renameSubcategory(id: number, name: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE subcategories SET name = ? WHERE id = ?', [name, id]);
}

export async function renameProduct(id: number, name: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE products SET name = ? WHERE id = ?', [name, id]);
}

//CRUD Catalogo: Eliminar, con informacion del impacto de cascada

export type CategoryImpact = { subcategoryCount: number; productCount: number; listNames: string[] };
export type SubcategoryImpact = { productCount: number; listNames: string[] };

export async function getCategoryImpact(categoryId: number): Promise<CategoryImpact> {
  const db = getDatabase();
  const subRow = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM subcategories WHERE category_id = ?',
    [categoryId]
  );
  const prodRow = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM products p
     JOIN subcategories sc ON sc.id = p.subcategory_id
     WHERE sc.category_id = ?`,
    [categoryId]
  );
  const lists = await db.getAllAsync<{ name: string }>(
    `SELECT DISTINCT l.name FROM lists l
     JOIN list_items li ON li.list_id = l.id
     JOIN products p ON p.id = li.product_id
     JOIN subcategories sc ON sc.id = p.subcategory_id
     WHERE sc.category_id = ?`,
    [categoryId]
  );
  return {
    subcategoryCount: subRow?.c ?? 0,
    productCount: prodRow?.c ?? 0,
    listNames: lists.map((l) => l.name),
  };
}

export async function getSubcategoryImpact(subcategoryId: number): Promise<SubcategoryImpact> {
  const db = getDatabase();
  const prodRow = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM products WHERE subcategory_id = ?',
    [subcategoryId]
  );
  const lists = await db.getAllAsync<{ name: string }>(
    `SELECT DISTINCT l.name FROM lists l
     JOIN list_items li ON li.list_id = l.id
     JOIN products p ON p.id = li.product_id
     WHERE p.subcategory_id = ?`,
    [subcategoryId]
  );
  return { productCount: prodRow?.c ?? 0, listNames: lists.map((l) => l.name) };
}

export async function deleteCategory(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function deleteSubcategory(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM subcategories WHERE id = ?', [id]);
}

export async function deleteProduct(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
}

//Configuraciones

export async function getSetting(key: string): Promise<string | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

//Backup/Restaura toda la DB
export type BackupData = {
  version: 1;
  exportedAt: string;
  categories: any[];
  subcategories: any[];
  products: any[];
  lists: any[];
  list_items: any[];
  list_category_state: any[];
  list_subcategory_state: any[];
};

export async function exportAllData(): Promise<BackupData> {
  const db = getDatabase();
  const [categories, subcategories, products, lists, list_items, list_category_state, list_subcategory_state] =
    await Promise.all([
      db.getAllAsync('SELECT * FROM categories'),
      db.getAllAsync('SELECT * FROM subcategories'),
      db.getAllAsync('SELECT * FROM products'),
      db.getAllAsync('SELECT * FROM lists'),
      db.getAllAsync('SELECT * FROM list_items'),
      db.getAllAsync('SELECT * FROM list_category_state'),
      db.getAllAsync('SELECT * FROM list_subcategory_state'),
    ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    subcategories,
    products,
    lists,
    list_items,
    list_category_state,
    list_subcategory_state,
  };
}

export async function importAllData(data: BackupData): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM list_subcategory_state;
      DELETE FROM list_category_state;
      DELETE FROM list_items;
      DELETE FROM lists;
      DELETE FROM products;
      DELETE FROM subcategories;
      DELETE FROM categories;
    `);

    for (const c of data.categories) {
      await db.runAsync('INSERT INTO categories (id, name, color, sort_order) VALUES (?, ?, ?, ?)', [
        c.id, c.name, c.color, c.sort_order,
      ]);
    }
    for (const sc of data.subcategories) {
      await db.runAsync(
        'INSERT INTO subcategories (id, category_id, name, sort_order) VALUES (?, ?, ?, ?)',
        [sc.id, sc.category_id, sc.name, sc.sort_order]
      );
    }
    for (const p of data.products) {
      await db.runAsync(
        'INSERT INTO products (id, subcategory_id, name, sort_order) VALUES (?, ?, ?, ?)',
        [p.id, p.subcategory_id, p.name, p.sort_order]
      );
    }
    for (const l of data.lists) {
      await db.runAsync('INSERT INTO lists (id, name, created_at) VALUES (?, ?, ?)', [
        l.id, l.name, l.created_at,
      ]);
    }
    for (const li of data.list_items) {
      await db.runAsync(
        'INSERT INTO list_items (id, list_id, product_id, quantity, is_checked) VALUES (?, ?, ?, ?, ?)',
        [li.id, li.list_id, li.product_id, li.quantity, li.is_checked]
      );
    }
    for (const cs of data.list_category_state) {
      await db.runAsync(
        'INSERT INTO list_category_state (list_id, category_id, is_collapsed) VALUES (?, ?, ?)',
        [cs.list_id, cs.category_id, cs.is_collapsed]
      );
    }
    for (const ss of data.list_subcategory_state) {
      await db.runAsync(
        'INSERT INTO list_subcategory_state (list_id, subcategory_id, is_collapsed) VALUES (?, ?, ?)',
        [ss.list_id, ss.subcategory_id, ss.is_collapsed]
      );
    }
  });
}