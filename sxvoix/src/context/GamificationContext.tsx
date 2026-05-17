import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { UserStats, DailyChallenge, UserChallengeProgress } from '../types';
import { checkAndUpdateStreak, addAcademicXp, reportDeepWorkSession, updateProfileInfo, updateUserPreferences } from '../services/gamificationService';
import { getDailyChallenge, getUserChallengeProgress, updateChallengeProgress, claimChallengeReward } from '../services/challengeService';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface GamificationContextType {
  stats: UserStats | null;
  challenge: DailyChallenge | null;
  challengeProgress: UserChallengeProgress | null;
  earnAcademicXp: (amount: number, bookId?: string, genres?: string[]) => Promise<void>;
  earnActionXp: (action: 'OPEN_BOOK' | 'GENERATE_SUMMARY', bookId?: string, genres?: string[]) => Promise<void>;
  reportChallengeProgress: (amount: number) => Promise<void>;
  reportSession: (durationSeconds: number) => Promise<void>;
  updateProfile: (data: { displayName?: string, photoURL?: string, subject?: string }) => Promise<void>;
  updatePrefs: (prefs: UserStats['preferences']) => Promise<void>;
  claimReward: () => Promise<void>;
  loading: boolean;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<UserChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setChallenge(null);
      setChallengeProgress(null);
      setLoading(false);
      return;
    }

    const initData = async () => {
      try {
        const [currentStats, currentChallenge, currentProgress] = await Promise.all([
          checkAndUpdateStreak(user.uid, user.displayName || undefined, user.photoURL || undefined),
          getDailyChallenge(user.uid),
          getUserChallengeProgress(user.uid)
        ]);
        setStats(currentStats);
        setChallenge(currentChallenge);
        setChallengeProgress(currentProgress);
      } catch (err) {
        console.error('Gamification init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();

    // Listen for real-time updates
    const statsUnsub = onSnapshot(doc(db, `users/${user.uid}/stats/main`), (doc) => {
      if (doc.exists()) {
        setStats(doc.data() as UserStats);
      }
    });

    const challengeUnsub = onSnapshot(doc(db, `users/${user.uid}/challenges/${new Date().toISOString().split('T')[0]}`), (doc) => {
      if (doc.exists()) {
        setChallengeProgress(doc.data() as UserChallengeProgress);
      }
    });

    return () => {
      statsUnsub();
      challengeUnsub();
    };
  }, [user]);

  const earnAcademicXp = async (amount: number, bookId?: string, genres?: string[]) => {
    if (!user) return;
    await addAcademicXp(user.uid, amount, bookId, genres);
  };

  const earnActionXp = async (action: 'OPEN_BOOK' | 'GENERATE_SUMMARY', bookId?: string, genres?: string[]) => {
    const amounts = { OPEN_BOOK: 10, GENERATE_SUMMARY: 50 };
    if (!user) return;
    await addAcademicXp(user.uid, amounts[action], bookId, genres);

    // Check if challenge is EXPLORE and increment
    if (action === 'OPEN_BOOK' && challenge?.type === 'EXPLORE') {
      await updateChallengeProgress(user.uid, 1);
    }
  };

  const reportChallengeProgress = async (amount: number) => {
    if (!user) return;
    await updateChallengeProgress(user.uid, amount);
  };

  const reportSession = async (durationSeconds: number) => {
    if (!user) return;
    await reportDeepWorkSession(user.uid, durationSeconds);
  };

  const updateProfile = async (data: { displayName?: string, photoURL?: string, subject?: string }) => {
    if (!user) return;
    await updateProfileInfo(user.uid, data);
  };

  const updatePrefs = async (prefs: UserStats['preferences']) => {
    if (!user) return;
    await updateUserPreferences(user.uid, prefs);
  };

  const claimReward = async () => {
    if (!user) return;
    await claimChallengeReward(user.uid);
  };

  return (
    <GamificationContext.Provider value={{ 
      stats, 
      challenge, 
      challengeProgress, 
      earnAcademicXp, 
      earnActionXp, 
      reportChallengeProgress,
      reportSession,
      updateProfile,
      updatePrefs,
      claimReward,
      loading 
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
