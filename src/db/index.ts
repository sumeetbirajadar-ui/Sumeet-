import { Capacitor } from '@capacitor/core';
import { DataStore, TableName, uid, nowISO, todayISO } from './types';
import { indexedDbStore } from './indexedDbStore';

export { uid, nowISO, todayISO };
export type { TableName };

/**
 * Picks the real on-disk SQLite adapter on native Android, IndexedDB in the
 * browser (dev preview / this session). Lazily imported so the SQLite plugin
 * code (and its native-only calls) never loads inside a plain browser tab.
 */
let storePromise: Promise<DataStore> | null = null;

export function getStore(): Promise<DataStore> {
  if (storePromise) return storePromise;
  storePromise = (async () => {
    if (Capacitor.isNativePlatform()) {
      const { sqliteStore } = await import('./sqliteStore');
      return sqliteStore;
    }
    return indexedDbStore;
  })();
  return storePromise;
}

export async function getAll<T>(table: TableName): Promise<T[]> {
  const store = await getStore();
  return store.getAll<T>(table);
}

export async function getById<T>(table: TableName, id: string): Promise<T | undefined> {
  const store = await getStore();
  return store.getById<T>(table, id);
}

export async function put<T extends { id: string }>(table: TableName, item: T): Promise<T> {
  const store = await getStore();
  await store.put(table, item);
  return item;
}

export async function bulkPut<T extends { id: string }>(table: TableName, items: T[]): Promise<void> {
  const store = await getStore();
  await store.bulkPut(table, items);
}

export async function remove(table: TableName, id: string): Promise<void> {
  const store = await getStore();
  await store.remove(table, id);
}

export async function exportBackup(): Promise<string> {
  const store = await getStore();
  const data = await store.exportAll();
  return JSON.stringify({ exportedAt: nowISO(), app: "Sumeet's Tracker 2.0", data }, null, 2);
}

export async function importBackup(json: string): Promise<void> {
  const parsed = JSON.parse(json);
  const data = parsed.data ?? parsed;
  const store = await getStore();
  await store.importAll(data);
}
