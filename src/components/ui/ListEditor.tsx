import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

/** Generic "add a line, list them, remove them" editor used across many
 * modules (gratitude items, wins/challenges, learning objectives, misc
 * notes...) so each module doesn't reinvent the same three lines of JSX. */
export const ListEditor: React.FC<{
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  bullet?: string;
}> = ({ items, onChange, placeholder = 'Add an item…', bullet = '•' }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="text-gold shrink-0">{bullet}</span>
          <span className="flex-1 text-sm text-navy">{item}</span>
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="opacity-0 group-hover:opacity-100 text-navy-light/40 hover:text-amber-flag transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="input-field text-sm flex-1"
        />
        <button onClick={add} className="icon-chip hover:bg-gold hover:text-cream transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
