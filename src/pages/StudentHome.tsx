import React, { useEffect, useState } from 'react';
import { Megaphone, GraduationCap, Compass, Video, ClipboardCheck, Sparkles, MessageSquareText, BookOpenCheck, Flame, Target, Flag, HeartHandshake, FileBarChart, Settings as SettingsIcon, CalendarClock } from 'lucide-react';
import { Announcement, subscribePublished } from '../lib/announcements';
import { latestActivityAt, subscribeClasses, subscribeContent, LiveClass, ContentItem } from '../lib/lms';
import { getLmsLastSeen, getOrCreateStudentId } from '../lib/studentIdentity';
import { examProgressSummary, getDueRevisions } from '../lib/syllabusTracker';
import { prepScore } from '../lib/prepScore';
import { getQuoteOfDay } from '../lib/quotes';

type Dest = 'predictor' | 'career' | 'lms' | 'counselling' | 'assistant' | 'tracker' | 'habitsFocus' | 'performance' | 'targetsGoals' | 'wellbeingCare' | 'reports' | 'settingsBackup';

function FeatureCard({
  onClick,
  icon,
  badgeClass,
  title,
  description,
  dot,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  badgeClass: string;
  title: string;
  description: string;
  dot?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative bg-white border-2 border-ink-100 rounded-3xl p-6 text-left hover:border-gold-300 hover:-translate-y-0.5 hover:shadow-lg transition-all"
    >
      {dot && <span className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-rose-500" />}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${badgeClass}`}>{icon}</div>
      <h3 className="font-bold text-lg text-ink-900 mb-1">{title}</h3>
      <p className="text-sm text-ink-500">{description}</p>
    </button>
  );
}

const PrepScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const r = 30;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="var(--color-gold-400)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-bold text-white font-display text-sm">{score}</div>
    </div>
  );
};

export default function StudentHome({ onNavigate }: { onNavigate: (view: Dest) => void }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  useEffect(() => subscribePublished(setAnnouncements), []);
  const [lmsClasses, setLmsClasses] = useState<LiveClass[]>([]);
  const [lmsContent, setLmsContent] = useState<ContentItem[]>([]);
  useEffect(() => subscribeClasses(setLmsClasses), []);
  useEffect(() => subscribeContent(setLmsContent), []);
  const hasLmsUpdates = latestActivityAt(lmsClasses, lmsContent) > getLmsLastSeen();
  const studentId = getOrCreateStudentId();
  const syllabusPct = examProgressSummary(studentId)[0]?.avgCompletionPct ?? 0;
  const score = prepScore(studentId);
  const dueRevisionCount = getDueRevisions(studentId).length;
  const quote = getQuoteOfDay();

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div className="relative overflow-hidden bg-ink-900 rounded-[32px] px-8 py-10 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold-400/20" />
        <div className="absolute bottom-0 right-16 w-16 h-16 rounded-full bg-sage-400/20" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <img src="/branding/science-monk-logo.png" alt="Science Monk Academy" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-gold-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" /> KCET · NEET · JEE
              </span>
            </div>
            <button onClick={() => onNavigate('reports')} className="flex items-center gap-2 text-left">
              <PrepScoreRing score={score} />
              <span className="text-[10px] uppercase tracking-widest text-ink-300 hidden sm:block">Prep<br />Score</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight font-display mb-2">Welcome back</h1>
          <p className="text-ink-200 text-sm max-w-sm mb-4">Everything for your prep and college decision, in one place.</p>
          <p className="text-sm text-gold-200 italic max-w-md">"{quote.text}" <span className="text-ink-300 not-italic">— {quote.author}</span></p>
          {dueRevisionCount > 0 && (
            <button onClick={() => onNavigate('tracker')} className="mt-4 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-gold-200 text-xs font-bold px-3 py-1.5 rounded-full">
              <CalendarClock className="w-3.5 h-3.5" /> {dueRevisionCount} revision{dueRevisionCount > 1 ? 's' : ''} due today
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FeatureCard
          onClick={() => onNavigate('tracker')}
          icon={<BookOpenCheck className="w-6 h-6 text-sage-600" />}
          badgeClass="bg-sage-50"
          title="Syllabus Tracker"
          description={`${syllabusPct}% complete — one chapter tracked once, counts toward KCET, NEET and JEE.`}
        />
        <FeatureCard
          onClick={() => onNavigate('lms')}
          icon={<Video className="w-6 h-6 text-gold-600" />}
          badgeClass="bg-gold-50"
          title="Learning Hub"
          description="Live classes, notes, videos, PYQs and your doubts thread."
          dot={hasLmsUpdates}
        />
        <FeatureCard
          onClick={() => onNavigate('habitsFocus')}
          icon={<Flame className="w-6 h-6 text-clay-500" />}
          badgeClass="bg-clay-50"
          title="Habits & Focus"
          description="Build daily discipline with identity habits and a multi-mode focus timer."
        />
        <FeatureCard
          onClick={() => onNavigate('performance')}
          icon={<Target className="w-6 h-6 text-gold-600" />}
          badgeClass="bg-gold-50"
          title="Performance"
          description="Log mock tests and mistakes — see your trend and weakest chapters."
        />
        <FeatureCard
          onClick={() => onNavigate('targetsGoals')}
          icon={<Flag className="w-6 h-6 text-sage-600" />}
          badgeClass="bg-sage-50"
          title="Targets & Goals"
          description="Set weekly and monthly targets, and keep your dream board in view."
        />
        <FeatureCard
          onClick={() => onNavigate('wellbeingCare')}
          icon={<HeartHandshake className="w-6 h-6 text-clay-500" />}
          badgeClass="bg-clay-50"
          title="Wellbeing & Care"
          description="A quiet daily check-in, and the basics that keep you able to study."
        />
        <FeatureCard
          onClick={() => onNavigate('assistant')}
          icon={<MessageSquareText className="w-6 h-6 text-sage-600" />}
          badgeClass="bg-sage-50"
          title="Ask the AI Assistant"
          description="Doubt-solving and counselling help, grounded in current search results."
        />
        <FeatureCard
          onClick={() => onNavigate('predictor')}
          icon={<GraduationCap className="w-6 h-6 text-clay-500" />}
          badgeClass="bg-clay-50"
          title="College Predictor"
          description="Enter your KCET rank and see which colleges you're likely to get."
        />
        <FeatureCard
          onClick={() => onNavigate('career')}
          icon={<Compass className="w-6 h-6 text-ink-600" />}
          badgeClass="bg-ink-100"
          title="Career Guidance"
          description="Explore 132 entrance exams across Engineering, Medical and more."
        />
        <FeatureCard
          onClick={() => onNavigate('counselling')}
          icon={<ClipboardCheck className="w-6 h-6 text-gold-600" />}
          badgeClass="bg-gold-50"
          title="Counselling Companion"
          description="Documents, dates, and your seat-allotment history."
        />
        <FeatureCard
          onClick={() => onNavigate('reports')}
          icon={<FileBarChart className="w-6 h-6 text-sage-600" />}
          badgeClass="bg-sage-50"
          title="Reports"
          description="A printable weekly or monthly summary of your Prep Score and progress."
        />
        <FeatureCard
          onClick={() => onNavigate('settingsBackup')}
          icon={<SettingsIcon className="w-6 h-6 text-ink-600" />}
          badgeClass="bg-ink-100"
          title="Settings & Backup"
          description="Export or restore all your tracker data as a JSON file."
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-ink-500" />
          </div>
          <h2 className="font-bold text-sm uppercase tracking-wider text-ink-500">Announcements</h2>
        </div>
        <div className="space-y-3">
          {announcements.length === 0 && (
            <p className="text-ink-400 text-sm italic">No announcements yet. Check back soon.</p>
          )}
          {announcements.map((a) => (
            <div key={a.id} className="bg-white border-2 border-ink-100 rounded-3xl p-4">
              <h4 className="font-bold text-ink-800 mb-1">{a.title}</h4>
              {a.body && <p className="text-sm text-ink-500 whitespace-pre-wrap">{a.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
