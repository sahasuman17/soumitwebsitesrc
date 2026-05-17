import { Book, PenTool, Compass, GraduationCap, Crown } from 'lucide-react';

export const PRESTIGE_RANKS = [
  {
    name: 'Initiate',
    minXp: 0,
    maxXp: 1000,
    icon: GraduationCap,
    titles: ['The Novice', 'The Apprentice', 'The Scholar-in-Waiting'],
  },
  {
    name: 'Academic',
    minXp: 1001,
    maxXp: 5000,
    icon: Book,
    titles: ['The Researcher', 'The Analyst', 'The Bibliophile'],
  },
  {
    name: 'Sage',
    minXp: 5001,
    maxXp: 15000,
    icon: Compass,
    titles: ['The Polymath', 'The Intellectual', 'The Mastermind'],
  },
  {
    name: 'Luminary',
    minXp: 15001,
    maxXp: 30000,
    icon: PenTool,
    titles: ['The Visionary', 'The Philosopher', 'The Grand Dean'],
  },
  {
    name: 'The Oracle',
    minXp: 30001,
    maxXp: Infinity,
    icon: Crown,
    titles: ['The Eternal Librarian'],
  },
];
