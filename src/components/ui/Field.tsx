import React from 'react';

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block mb-4">
    <span className="text-xs font-bold uppercase tracking-wider text-navy-light/60 mb-1.5 block">{label}</span>
    {children}
    {hint && <span className="text-[11px] text-navy-light/50 mt-1 block">{hint}</span>}
  </label>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`input-field ${props.className ?? ''}`} />
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={`input-field resize-none ${props.className ?? ''}`} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={`input-field ${props.className ?? ''}`} />
);
