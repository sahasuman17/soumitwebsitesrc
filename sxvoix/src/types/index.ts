import { Timestamp } from 'firebase/firestore';

export interface Author {
  id: string;
  name: string;
  bio: string;
  photoUrl?: string;
}

export interface Book {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  pdfUrl: string;
  coverUrl?: string;
  description: string;
  category: string;
  genres: string[];
  averageRating?: number;
  reviewsCount?: number;
  createdAt: Timestamp;
}

export interface Rating {
  id: string;
  score: number;
  userId: string;
  timestamp: Timestamp;
}

export interface AdminUser {
  uid: string;
  role: 'admin';
}

export interface Bookmark {
  bookId: string;
  userId: string;
  timestamp: Timestamp;
}

export interface ReadingProgress {
  bookId: string;
  userId: string;
  percent: number;
  lastRead: Timestamp;
}

export interface UserStats {
  userId: string;
  displayName: string;
  photoURL?: string;
  xp: number;
  currentStreak: number;
  longestStreak: number; // Added
  totalFocusTime: number; // Added (seconds)
  sessionsCount: number; // Added
  mostReadGenre: string; // Added
  xpPerBook: Record<string, number>; // Added
  xpPerGenre: Record<string, number>; // Added
  subject?: string; // Added
  preferences?: {
    theme: 'midnight' | 'parchment' | 'daylight';
    aiAssistant: boolean;
    focusMode: boolean;
    syncProgress: boolean;
  }; // Added
  lastLogin: Timestamp;
  updatedAt: Timestamp;
  badges?: string[];
}

export type ChallengeType = 'FOCUS' | 'QUIZ' | 'EXPLORE';

export interface DailyChallenge {
  id: string; // Date string e.g., 2026-04-19
  type: ChallengeType;
  title: string;
  description: string;
  task: string;
  target: number;
  rewardXp: number;
  badgeId?: string;
  bookId?: string; // Optional, for quiz-based challenges
}

export interface UserChallengeProgress {
  userId: string;
  date: string;
  currentValue: number;
  completed: boolean;
  claimed: boolean;
  lastUpdated: Timestamp;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'CHALLENGE' | 'MILESTONE' | 'SPECIAL';
}

export interface LeaderboardEntry extends UserStats {
  rank: number;
}
