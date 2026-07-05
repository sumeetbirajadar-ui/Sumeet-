import { useCallback, useEffect, useState } from 'react';
import { TableName, getAll, put, remove as removeRow } from '../db';

/** Loads a whole table into state and gives back save/remove helpers that
 * keep state and storage in sync. Every module's CRUD screen is built on
 * this one hook instead of re-deriving load/save/delete boilerplate. */
export function useCollection<T extends { id: string }>(table: TableName) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await getAll<T>(table);
    setItems(rows);
    setLoading(false);
  }, [table]);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (item: T) => {
    await put(table, item);
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx === -1) return [...prev, item];
      const copy = [...prev];
      copy[idx] = item;
      return copy;
    });
  }, [table]);

  const remove = useCallback(async (id: string) => {
    await removeRow(table, id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, [table]);

  return { items, loading, save, remove, refresh, setItems };
}
