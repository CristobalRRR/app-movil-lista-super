import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SEED_SQL } from './schema';

const DB_NAME = 'lista_super.db';
let dbInstance: SQLite.SQLiteDatabase | null = null;

const MIGRATIONS: string[] = [
  'ALTER TABLE list_items ADD COLUMN sort_order INTEGER',
  'ALTER TABLE list_category_state ADD COLUMN sort_order INTEGER',
  'ALTER TABLE list_subcategory_state ADD COLUMN sort_order INTEGER',
];

async function runMigrations(db: SQLite.SQLiteDatabase) {
  for (const statement of MIGRATIONS) {
    try {
      await db.execAsync(statement);
    } catch {
    }
  }
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(CREATE_TABLES_SQL);
  await runMigrations(db);
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (row?.count === 0) {
    await db.execAsync(SEED_SQL);
  }
  dbInstance = db;
  return db;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error(
      'Database not initialized yet — call initDatabase() first (see App.tsx).'
    );
  }
  return dbInstance;
}