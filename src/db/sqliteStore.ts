import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { DataStore, TABLES } from './types';

/**
 * Native Android storage adapter — real on-disk SQLite via
 * @capacitor-community/sqlite. This is what the app actually uses once built
 * with Capacitor and run on-device (see db/index.ts, which picks this over
 * IndexedDB automatically when Capacitor.isNativePlatform() is true).
 *
 * Each logical "table" is a real SQLite table with a generic
 * (id TEXT PRIMARY KEY, data TEXT, updatedAt TEXT) shape holding the record
 * as JSON. This avoids hand-writing/maintaining ~18 rigid column schemas for
 * a single-user app, while still giving SQLite's crash-safe, quota-generous,
 * filesystem-backed durability that the doc calls out as the #1 reliability
 * requirement (years of irreplaceable daily data).
 */
const DB_NAME = 'sumeet_tracker';
let sqliteConn: SQLiteConnection | null = null;
let dbConn: SQLiteDBConnection | null = null;
let ready: Promise<SQLiteDBConnection> | null = null;

async function getConnection(): Promise<SQLiteDBConnection> {
  if (ready) return ready;
  ready = (async () => {
    sqliteConn = new SQLiteConnection(CapacitorSQLite);
    const isConn = (await sqliteConn.isConnection(DB_NAME, false)).result;
    dbConn = isConn
      ? await sqliteConn.retrieveConnection(DB_NAME, false)
      : await sqliteConn.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    await dbConn.open();
    const createStatements = TABLES
      .map((t) => `CREATE TABLE IF NOT EXISTS ${t} (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, updatedAt TEXT);`)
      .join('\n');
    await dbConn.execute(createStatements);
    return dbConn;
  })();
  return ready;
}

export const sqliteStore: DataStore = {
  async getAll<T>(table: string): Promise<T[]> {
    const conn = await getConnection();
    const res = await conn.query(`SELECT data FROM ${table};`);
    return (res.values ?? []).map((row: any) => JSON.parse(row.data)) as T[];
  },
  async getById<T>(table: string, id: string): Promise<T | undefined> {
    const conn = await getConnection();
    const res = await conn.query(`SELECT data FROM ${table} WHERE id = ?;`, [id]);
    const row = res.values?.[0];
    return row ? (JSON.parse(row.data) as T) : undefined;
  },
  async put<T extends { id: string }>(table: string, item: T): Promise<void> {
    const conn = await getConnection();
    await conn.run(
      `INSERT INTO ${table} (id, data, updatedAt) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updatedAt = excluded.updatedAt;`,
      [item.id, JSON.stringify(item), new Date().toISOString()],
    );
  },
  async bulkPut<T extends { id: string }>(table: string, items: T[]): Promise<void> {
    const conn = await getConnection();
    await conn.executeSet(
      items.map((item) => ({
        statement: `INSERT INTO ${table} (id, data, updatedAt) VALUES (?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updatedAt = excluded.updatedAt;`,
        values: [item.id, JSON.stringify(item), new Date().toISOString()],
      })),
    );
  },
  async remove(table: string, id: string): Promise<void> {
    const conn = await getConnection();
    await conn.run(`DELETE FROM ${table} WHERE id = ?;`, [id]);
  },
  async exportAll(): Promise<Record<string, any[]>> {
    const out: Record<string, any[]> = {};
    for (const table of TABLES) out[table] = await sqliteStore.getAll(table);
    return out;
  },
  async importAll(data: Record<string, any[]>): Promise<void> {
    for (const table of TABLES) {
      const rows = data[table];
      if (Array.isArray(rows) && rows.length) await sqliteStore.bulkPut(table, rows);
    }
  },
};
