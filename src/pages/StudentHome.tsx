import React from 'react';
import { Megaphone, GraduationCap, Compass } from 'lucide-react';
import { listPublished } from '../lib/announcements';

export default function StudentHome({ onNavigate }: { onNavigate: (view: 'predictor' | 'career') => void }) {
  const announcements = listPublished();

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight uppercase font-display mb-2">Welcome</h1>
        <p className="text-stone-500 text-sm">Everything for your KCET prep and college decision, in one place.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('predictor')}
          className="bg-white border-2 border-stone-200 rounded-3xl p-6 text-left hover:border-amber-300 hover:shadow-md transition-all"
        >
          <GraduationCap className="w-8 h-8 text-amber-500 mb-3" />
          <h3 className="font-bold text-lg text-stone-800 mb-1">College Predictor</h3>
          <p className="text-sm text-stone-500">Enter your KCET rank and see which colleges you're likely to get.</p>
        </button>
        <button
          onClick={() => onNavigate('career')}
          className="bg-white border-2 border-stone-200 rounded-3xl p-6 text-left hover:border-amber-300 hover:shadow-md transition-all"
        >
          <Compass className="w-8 h-8 text-amber-500 mb-3" />
          <h3 className="font-bold text-lg text-stone-800 mb-1">Career Guidance</h3>
          <p className="text-sm text-stone-500">Explore 132 entrance exams across Engineering, Medical and more.</p>
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-stone-400" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-stone-500">Announcements</h2>
        </div>
        <div className="space-y-3">
          {announcements.length === 0 && (
            <p className="text-stone-400 text-sm italic">No announcements yet. Check back soon.</p>
          )}
          {announcements.map((a) => (
            <div key={a.id} className="bg-white border-2 border-stone-200 rounded-2xl p-4">
              <h4 className="font-bold text-stone-800 mb-1">{a.title}</h4>
              {a.body && <p className="text-sm text-stone-500 whitespace-pre-wrap">{a.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
