import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ChevronRight } from 'lucide-react';
import { sha256 } from '../utils/hash';
import { SketchLotus } from './sketches/Sketches';

export const Login: React.FC<{
  hasPasscode: boolean;
  onSetPasscode: (hash: string) => void;
  onUnlock: () => void;
  checkPasscode: (hash: string) => boolean;
}> = ({ hasPasscode, onSetPasscode, onUnlock, checkPasscode }) => {
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');

  const handleFirstRun = async () => {
    if (stage === 'enter') {
      if (value.length < 4) { setError('Use at least 4 digits'); return; }
      setStage('confirm'); setError('');
      return;
    }
    if (confirm !== value) { setError('Passcodes don\'t match'); setConfirm(''); return; }
    onSetPasscode(await sha256(value));
  };

  const handleUnlock = async () => {
    const hash = await sha256(value);
    if (checkPasscode(hash)) onUnlock();
    else { setError('Incorrect passcode'); setValue(''); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy relative overflow-hidden px-4">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #D4AF37 0, transparent 40%), radial-gradient(circle at 80% 80%, #D4AF37 0, transparent 40%)' }} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
        <div className="bg-cream rounded-[2.5rem] p-8 shadow-2xl border border-gold-soft/30 text-center">
          <SketchLotus size={56} className="mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-navy mb-1">Sumeet's Tracker</h1>
          <p className="text-xs text-navy-light/60 mb-8">{hasPasscode ? 'Enter your passcode' : (stage === 'enter' ? 'Set a passcode to protect your data' : 'Confirm your passcode')}</p>

          <div className="relative mb-4">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-light/40" />
            <input
              type="password" inputMode="numeric" autoFocus
              value={hasPasscode ? value : (stage === 'enter' ? value : confirm)}
              onChange={(e) => (hasPasscode ? setValue(e.target.value) : stage === 'enter' ? setValue(e.target.value) : setConfirm(e.target.value))}
              onKeyDown={(e) => { if (e.key === 'Enter') (hasPasscode ? handleUnlock() : handleFirstRun()); }}
              className="input-field !pl-11 text-center tracking-[0.3em] text-lg"
              placeholder="••••"
            />
          </div>
          {error && <p className="text-amber-flag text-xs font-bold mb-4">{error}</p>}
          <button onClick={hasPasscode ? handleUnlock : handleFirstRun} className="btn-gold w-full flex items-center justify-center gap-2">
            {hasPasscode ? 'Unlock' : stage === 'enter' ? 'Continue' : 'Confirm & Start'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
