export const CREATE_TABLES_SQL = `
PRAGMA foreign_keys = ON;
 
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
 
CREATE TABLE IF NOT EXISTS subcategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
 
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
 
CREATE TABLE IF NOT EXISTS lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
 
CREATE TABLE IF NOT EXISTS list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_checked INTEGER NOT NULL DEFAULT 0,
  UNIQUE(list_id, product_id)
);
 
CREATE TABLE IF NOT EXISTS list_category_state (
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_collapsed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (list_id, category_id)
);
 
CREATE TABLE IF NOT EXISTS list_subcategory_state (
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  is_collapsed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (list_id, subcategory_id)
);
`;
//Seed inicial, comienza con datos por defecto para no estar vacio
export const SEED_SQL = `
INSERT INTO categories (name, color, sort_order) VALUES
  ('Aseo', '#C9B458', 0),
  ('Comestibles', '#B5524A', 1),
  ('Bebestibles', '#4A5FB5', 2);
 
INSERT INTO subcategories (category_id, name, sort_order) VALUES
  ((SELECT id FROM categories WHERE name = 'Aseo'), 'Limpieza', 0),
  ((SELECT id FROM categories WHERE name = 'Aseo'), 'Personal', 1),
  ((SELECT id FROM categories WHERE name = 'Comestibles'), 'Carnes', 0),
  ((SELECT id FROM categories WHERE name = 'Comestibles'), 'Pastas', 1);
 
INSERT INTO products (subcategory_id, name, sort_order) VALUES
  ((SELECT id FROM subcategories WHERE name = 'Limpieza'), 'Detergente en polvo', 0),
  ((SELECT id FROM subcategories WHERE name = 'Limpieza'), 'Lavalozas', 1),
  ((SELECT id FROM subcategories WHERE name = 'Personal'), 'Jabón', 0),
  ((SELECT id FROM subcategories WHERE name = 'Personal'), 'Pasta de dientes', 1),
  ((SELECT id FROM subcategories WHERE name = 'Carnes'), 'Carne molida', 0),
  ((SELECT id FROM subcategories WHERE name = 'Pastas'), 'Tallarines', 0);
`;
 