import { DataStore, TABLES } from './types';

/**
 * IndexedDB-backed store. This is the default adapter used in the browser
 * dev preview and as a fallback. IndexedDB gives a much larger quota and
 * better durability than localStorage, but on native Android it is still a
 * WebView-managed store the OS can reclaim under storage pressure — that is
 * why the native build swaps to `sqliteStore.ts` (real on-disk SQLite) via
 * `getStore()` in `db/index.ts`. Regardless of adapter, use Settings > Export
 * Backup regularly as the real safety net for years of data.
 */
const DB_NAME = 'sumeet_tracker_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const table of TABLES) {
        if (!db.objectStoreNames.contains(table)) {
          db.createObjectStore(table, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(table: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(table, mode);
    const store = transaction.objectStore(table);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const indexedDbStore: DataStore = {
  async getAll<T>(table: string): Promise<T[]> {
    return tx<T[]>(table, 'readonly', (s) => s.getAll() as unknown as IDBRequest<T[]>);
  },
  async getById<T>(table: string, id: string): Promise<T | undefined> {
    return tx<T | undefined>(table, 'readonly', (s) => s.get(id) as unknown as IDBRequest<T | undefined>);
  },
  async put<T extends { id: string }>(table: string, item: T): Promise<void> {
    await tx(table, 'readwrite', (s) => s.put(item));
  },
  async bulkPut<T extends { id: string }>(table: string, items: T[]): Promise<void> {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);
      items.forEach((item) => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
  async remove(table: string, id: string): Promise<void> {
    await tx(table, 'readwrite', (s) => s.delete(id));
  },
  async exportAll(): Promise<Record<string, any[]>> {
    const out: Record<string, any[]> = {};
    for (const table of TABLES) {
      out[table] = await indexedDbStore.getAll(table);
    }
    return out;
  },
  async importAll(data: Record<string, any[]>): Promise<void> {
    for (const table of TABLES) {
      const rows = data[table];
      if (Array.isArray(rows) && rows.length) {
        await indexedDbStore.bulkPut(table, rows);
      }
    }
  },
};
