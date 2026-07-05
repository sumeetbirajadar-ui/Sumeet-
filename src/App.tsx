import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Home, CheckSquare, Wallet, BookOpen, Grid3x3, ShieldCheck, Target as TargetIcon,
  Heart, Compass, Youtube as YoutubeIcon, Sparkles, Settings2, X,
} from 'lucide-react';
import { useSettings } from './hooks/useSettings';
import { seedIfEmpty } from './db/seedDefaults';
import { Login } from './components/Login';
import { Modal } from './components/ui/Modal';
import { HomeDashboard } from './modules/home/HomeDashboard';
import { HabitsView } from './modules/habits/HabitsView';
import { BudgetView } from './modules/budget/BudgetView';
import { SyllabusView } from './modules/syllabus/SyllabusView';
import { InvestmentsView } from './modules/investments/InvestmentsView';
import { TargetsView } from './modules/targets/TargetsView';
import { GratitudeView } from './modules/gratitude/GratitudeView';
import { BucketListView } from './modules/bucketlist/BucketListView';
import { YouTubeView } from './modules/youtube/YouTubeView';
import { GroomingView } from './modules/grooming/GroomingView';
import { SettingsView } from './modules/settings/SettingsView';

type Tab = 'home' | 'habits' | 'budget' | 'syllabus' | 'investments' | 'targets' | 'gratitude' | 'bucketlist' | 'youtube' | 'grooming' | 'settings';

const PRIMARY_TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
];

const MORE_TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'investments', label: 'Investments', icon: ShieldCheck },
  { id: 'targets', label: 'Targets', icon: TargetIcon },
  { id: 'gratitude', label: 'Gratitude', icon: Heart },
  { id: 'bucketlist', label: 'Bucket List', icon: Compass },
  { id: 'youtube', label: 'YouTube', icon: YoutubeIcon },
  { id: 'grooming', label: 'Grooming', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

const VIEWS: Record<Tab, React.ComponentType<any>> = {
  home: HomeDashboard, habits: HabitsView, budget: BudgetView, syllabus: SyllabusView,
  investments: InvestmentsView, targets: TargetsView, gratitude: GratitudeView,
  bucketlist: BucketListView, youtube: YouTubeView, grooming: GroomingView, settings: SettingsView,
};

export default function App() {
  const { settings, update, loading } = useSettings();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('unlocked') === 'true');
  const [tab, setTab] = useState<Tab>('home');
  const [moreOpen, setMoreOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    seedIfEmpty().then(() => setSeeded(true));
  }, []);

  if (loading || !seeded) {
    return <div className="min-h-screen flex items-center justify-center bg-ivory text-navy-light/50 text-sm">Loading…</div>;
  }

  if (!unlocked) {
    return (
      <Login
        hasPasscode={!!settings.passcodeHash}
        checkPasscode={(hash) => hash === settings.passcodeHash}
        onSetPasscode={(hash) => { update({ passcodeHash: hash, onboarded: true }); sessionStorage.setItem('unlocked', 'true'); setUnlocked(true); }}
        onUnlock={() => { sessionStorage.setItem('unlocked', 'true'); setUnlocked(true); }}
      />
    );
  }

  const ActiveView = VIEWS[tab];
  const navigate = (t: string) => setTab(t as Tab);

  return (
    <div className="min-h-screen pb-28 px-4 pt-6">
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
          <ActiveView onNavigate={navigate} />
        </motion.div>
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur-md border-t border-gold-soft z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto flex items-center justify-around py-2">
          {PRIMARY_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${tab === id ? 'text-gold' : 'text-navy-light/50'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          ))}
          <button onClick={() => setMoreOpen(true)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${MORE_TABS.some((m) => m.id === tab) ? 'text-gold' : 'text-navy-light/50'}`}>
            <Grid3x3 className="w-5 h-5" />
            <span className="text-[10px] font-bold">More</span>
          </button>
        </div>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="grid grid-cols-3 gap-3">
          {MORE_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setMoreOpen(false); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${tab === id ? 'border-gold bg-gold-pale' : 'border-transparent bg-ivory-dark'}`}
            >
              <Icon className="w-6 h-6 text-navy" />
              <span className="text-xs font-bold text-navy text-center">{label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
