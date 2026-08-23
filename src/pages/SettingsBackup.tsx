import React, { useRef, useState } from 'react';
import { Download, Upload, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import { downloadBackup, restoreBackup } from '../lib/backup';
import { getOrCreateStudentId } from '../lib/studentIdentity';

export default function SettingsBackup() {
  const studentId = getOrCreateStudentId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function handleExport() {
    downloadBackup(studentId);
    setStatus({ type: 'success', message: 'Backup downloaded.' });
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = restoreBackup(studentId, String(reader.result));
      if (result.success) {
        setStatus({ type: 'success', message: `Restored ${result.keysRestored} data file(s). Reload the app to see everything.` });
      } else {
        setStatus({ type: 'error', message: result.error || 'Could not restore this backup.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2 flex items-center justify-center gap-2">
          <SettingsIcon className="w-7 h-7 text-gold-500" /> Settings &amp; Backup
        </h1>
        <p className="text-ink-500 text-sm">Everything lives in this browser only — back it up before clearing your browser data or switching devices.</p>
      </header>

      <div className="space-y-4">
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-sage-600" />
            <h3 className="font-bold text-ink-800">Your Data, Your Device</h3>
          </div>
          <p className="text-sm text-ink-500">
            Your syllabus progress, habits, focus sessions, mock tests, error log, targets, goals, journal and resources are all stored only in this
            browser. There's no account or server copy yet — a backup file is the only way to move your progress to a new phone or browser, or recover
            it after clearing site data.
          </p>
        </div>

        <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold py-3.5 rounded-2xl">
          <Download className="w-4 h-4" /> Download Backup (JSON)
        </button>

        <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 border-2 border-ink-200 hover:border-sage-300 text-ink-700 font-bold py-3.5 rounded-2xl">
          <Upload className="w-4 h-4" /> Restore from Backup
        </button>
        <input ref={fileRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />

        {status && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${status.type === 'success' ? 'bg-sage-50 text-sage-700' : 'bg-clay-50 text-clay-700'}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
