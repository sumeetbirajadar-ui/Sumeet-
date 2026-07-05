import React, { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, Upload, KeyRound, Bell, Info, CheckCircle2, Lock } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { exportBackup, importBackup, nowISO } from '../../db';
import { sha256 } from '../../utils/hash';
import { PageHeader, Card } from '../../components/ui/Layout';
import { Field, Input } from '../../components/ui/Field';
import { GoldDivider } from '../../components/sketches/Sketches';

export const SettingsView: React.FC<{ onLock?: () => void }> = ({ onLock }) => {
  const { settings, update } = useSettings();
  const [newPasscode, setNewPasscode] = useState('');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    const json = await exportBackup();
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const filename = `sumeets-tracker-backup-${todayStamp()}.json`;
      await Filesystem.writeFile({ path: filename, data: json, directory: Directory.Documents, encoding: 'utf8' as any });
      setStatus(`Saved to Documents/${filename}`);
    } else {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `sumeets-tracker-backup-${todayStamp()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('Backup downloaded.');
    }
    update({ lastBackupAt: nowISO() });
  };

  const doImport = async (file: File) => {
    const text = await file.text();
    await importBackup(text);
    setStatus('Backup imported. Reload the app to see all data.');
  };

  const changePasscode = async () => {
    if (newPasscode.length < 4) { setStatus('Passcode must be at least 4 characters.'); return; }
    update({ passcodeHash: await sha256(newPasscode) });
    setNewPasscode('');
    setStatus('Passcode updated.');
  };

  return (
    <div className="max-w-2xl mx-auto pb-28">
      <PageHeader eyebrow="Settings" title="Settings & Backup" subtitle="Your safety net for years of data." />

      {status && (
        <div className="bg-gold-pale text-navy text-sm font-medium rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />{status}
        </div>
      )}

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Backup & Restore</h3>
      <Card className="mb-6 space-y-3">
        <p className="text-xs text-navy-light/60">
          This is your real safety net — export regularly, especially before switching phones or reinstalling.
          {settings.lastBackupAt && <span className="block mt-1">Last backup: {new Date(settings.lastBackupAt).toLocaleString()}</span>}
        </p>
        <div className="flex gap-3">
          <button onClick={doExport} className="btn-gold flex-1 flex items-center justify-center gap-2 text-sm"><Download className="w-4 h-4" />Export Backup</button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-outline flex-1 flex items-center justify-center gap-2 text-sm"><Upload className="w-4 h-4" />Import Backup</button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </div>
      </Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Notifications</h3>
      <Card className="mb-6 space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-navy flex items-center gap-2"><Bell className="w-4 h-4 text-gold" />Evening review reminder</span>
          <input type="checkbox" checked={settings.notifyEveningReview} onChange={(e) => update({ notifyEveningReview: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-navy flex items-center gap-2"><Bell className="w-4 h-4 text-gold" />Investment/insurance due-date reminders</span>
          <input type="checkbox" checked={settings.notifyDueDates} onChange={(e) => update({ notifyDueDates: e.target.checked })} />
        </label>
        <p className="text-[11px] text-navy-light/50">On Android, also disable battery optimisation for this app (Settings → Apps → Sumeet's Tracker → Battery) so reminders survive Doze.</p>
      </Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Security</h3>
      <Card className="mb-6 space-y-4">
        <Field label="Set a new passcode" hint="There's no fixed username/password — whatever you set here (or on first launch) is your passcode.">
          <div className="flex gap-2">
            <Input type="password" value={newPasscode} onChange={(e) => setNewPasscode(e.target.value)} placeholder="New passcode" className="flex-1" />
            <button onClick={changePasscode} className="icon-chip hover:bg-gold hover:text-cream transition-colors"><KeyRound className="w-4 h-4" /></button>
          </div>
        </Field>
        {onLock && (
          <div className="pt-2 border-t border-gold-soft">
            <button onClick={onLock} className="btn-outline w-full flex items-center justify-center gap-2 text-sm"><Lock className="w-4 h-4" />Lock App</button>
            <p className="text-[11px] text-navy-light/50 mt-2">
              This only re-locks the passcode screen — nothing you've entered is deleted. All your habits,
              expenses, syllabus progress etc. stay saved on this device and are exactly as you left them
              next time you unlock.
            </p>
          </div>
        )}
      </Card>

      <GoldDivider className="my-6" />
      <Card className="flex items-start gap-3">
        <Info className="w-4 h-4 text-navy-light/40 shrink-0 mt-0.5" />
        <p className="text-xs text-navy-light/50 leading-relaxed">
          Sumeet's Tracker 2.0 stores everything on this device (SQLite on Android, IndexedDB in this browser preview).
          Nothing is sent to a server — this app is fully offline by design.
        </p>
      </Card>
    </div>
  );
};

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}
