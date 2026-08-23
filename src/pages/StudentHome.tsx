import React from 'react';
import { Megaphone, GraduationCap, Compass, Video, ClipboardCheck, Sparkles, MessageSquareText, BookOpenCheck, Flame } from 'lucide-react';
import { listPublished } from '../lib/announcements';
import { latestActivityAt } from '../lib/lms';
import { getLmsLastSeen, getOrCreateStudentId } from '../lib/studentIdentity';
import { examProgressSummary } from '../lib/syllabusTracker';

type Dest = 'predictor' | 'career' | 'lms' | 'counselling' | 'assistant' | 'tracker' | 'habitsFocus';

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

export default function StudentHome({ onNavigate }: { onNavigate: (view: Dest) => void }) {
  const announcements = listPublished();
  const hasLmsUpdates = latestActivityAt() > getLmsLastSeen();
  const syllabusPct = examProgressSummary(getOrCreateStudentId())[0]?.avgCompletionPct ?? 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div className="relative overflow-hidden bg-ink-900 rounded-[32px] px-8 py-10 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold-400/20" />
        <div className="absolute bottom-0 right-16 w-16 h-16 rounded-full bg-sage-400/20" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-gold-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" /> KCET · NEET · JEE
          </span>
          <h1 className="text-3xl font-bold tracking-tight font-display mb-2">Welcome back</h1>
          <p className="text-ink-200 text-sm max-w-sm">Everything for your prep and college decision, in one place.</p>
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
