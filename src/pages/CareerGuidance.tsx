import React from 'react';
import { Compass } from 'lucide-react';

export default function CareerGuidance() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 h-full flex flex-col">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight uppercase font-display mb-2 flex items-center justify-center gap-2">
          <Compass className="w-7 h-7 text-amber-500" /> Career Guidance
        </h1>
        <p className="text-stone-500 text-sm">
          132 entrance exams across 11 fields — Engineering, Medical Sciences, Basic Sciences, Commerce, Design, Law
          and more.
        </p>
      </header>
      <div className="flex-1 bg-white rounded-3xl border-2 border-stone-200 shadow-sm overflow-hidden" style={{ minHeight: '75vh' }}>
        <iframe
          src="/career/index.html"
          title="Career Guidance"
          className="w-full h-full border-0"
          style={{ minHeight: '75vh' }}
        />
      </div>
    </div>
  );
}
