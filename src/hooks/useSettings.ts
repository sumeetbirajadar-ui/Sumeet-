import { useCallback, useEffect, useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import { getById, put } from '../db';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await getById<AppSettings>('settings', 'app-settings');
    setSettings(s ?? DEFAULT_SETTINGS);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      put('settings', next);
      return next;
    });
  }, []);

  return { settings, loading, update, refresh };
}
