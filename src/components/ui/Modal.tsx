import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }> = ({
  open, onClose, title, children, wide,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className={`bg-cream rounded-t-[2rem] sm:rounded-[2rem] w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[88vh] overflow-y-auto shadow-2xl border border-gold-soft`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-cream flex items-center justify-between px-6 py-4 border-b border-gold-soft z-10">
            <h2 className="font-bold text-lg font-display text-navy">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-ivory-dark text-navy-light">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
