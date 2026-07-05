import React from 'react';
import {
  Sun, Moon, BookOpen, Wind, GlassWater, Briefcase, CheckSquare, Bath, User, Heart,
  FileText, UserCircle, Smile, Droplets, Phone, Ban, Sparkles, Dumbbell, Coffee,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun, Moon, BookOpen, Wind, GlassWater, Briefcase, CheckSquare, Bath, User, Heart,
  FileText, UserCircle, Smile, Droplets, Phone, Ban, Sparkles, Dumbbell, Coffee,
};

export const HabitIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-5 h-5' }) => {
  const Comp = ICON_MAP[name] ?? Sparkles;
  return <Comp className={className} />;
};

export const HABIT_ICON_NAMES = Object.keys(ICON_MAP);
