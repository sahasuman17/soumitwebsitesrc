import { doc, getDoc, setDoc, serverTimestamp, Timestamp, updateDoc, increment, collectionGroup, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserStats } from '../types';
import confetti from 'canvas-confetti';
import { PRESTIGE_RANKS } from '../constants/gamification';

const XP_MAP = {
  OPEN_BOOK: 10,
  GENERATE_SUMMARY: 50,
  DEEP_WORK_5MIN: 10,
};

export const triggerCelebration = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // golden academic confetti
    confetti({ 
      ...defaults, 
      particleCount, 
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#A855F7', '#D8B4FE', '#ffffff']
    });
    confetti({ 
      ...defaults, 
      particleCount, 
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#A855F7', '#D8B4FE', '#ffffff']
    });
  }, 250);
};

export const getPrestigeData = (xp: number) => {
  const rank = PRESTIGE_RANKS.find((r, i) => {
    const nextRank = PRESTIGE_RANKS[i + 1];
    return xp >= r.minXp && (!nextRank || xp < nextRank.minXp);
  }) || PRESTIGE_RANKS[0];

  const range = (rank.maxXp === Infinity ? 50000 : rank.maxXp) - rank.minXp;
  const currentXpInRange = xp - rank.minXp;
  const progress = Math.min(100, (currentXpInRange / range) * 100);

  // Sub-Title Logic: Change every 20%
  const titleIndex = Math.min(
    rank.titles.length - 1,
    Math.floor((progress / 100) * rank.titles.length)
  );
  const title = rank.titles[titleIndex];

  return { rank, title, progress };
};

export async function checkAndUpdateStreak(userId: string, displayName?: string, photoURL?: string): Promise<UserStats | null> {
  const statsRef = doc(db, `users/${userId}/stats/main`);
  const statsSnap = await getDoc(statsRef);
  const now = new Date();
  
  if (!statsSnap.exists()) {
    const initialStats: UserStats = {
      userId,
      displayName: displayName || 'Scholar',
      photoURL: photoURL || '',
      xp: 0,
      currentStreak: 1,
      longestStreak: 1,
      totalFocusTime: 0,
      sessionsCount: 0,
      mostReadGenre: 'None',
      xpPerBook: {},
      xpPerGenre: {},
      lastLogin: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    await setDoc(statsRef, { ...initialStats, updatedAt: serverTimestamp(), lastLogin: serverTimestamp() });
    return initialStats;
  }

  const data = statsSnap.data() as UserStats;
  const lastLogin = data.lastLogin.toDate();
  
  const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let newStreak = data.currentStreak;
  let longestStreak = data.longestStreak || 0;
  let shouldUpdate = false;

  if (diffDays === 1) {
    newStreak += 1;
    if (newStreak > longestStreak) longestStreak = newStreak;
    shouldUpdate = true;
    if (newStreak % 7 === 0) triggerCelebration();
  } else if (diffDays > 1) {
    newStreak = 1;
    shouldUpdate = true;
  }

  const updatePayload: any = {
    updatedAt: serverTimestamp(),
  };

  if (shouldUpdate) {
    updatePayload.currentStreak = newStreak;
    updatePayload.longestStreak = longestStreak;
    updatePayload.lastLogin = serverTimestamp();
  }

  // Sync profile info if changed
  if (displayName && displayName !== data.displayName) updatePayload.displayName = displayName;
  if (photoURL && photoURL !== data.photoURL) updatePayload.photoURL = photoURL;

  if (Object.keys(updatePayload).length > 1) { // More than just updatedAt
    await updateDoc(statsRef, updatePayload);
  }

  return { ...data, ...updatePayload, lastLogin: shouldUpdate ? Timestamp.fromDate(now) : data.lastLogin };
}

export async function addAcademicXp(userId: string, amount: number, bookId?: string, genres?: string[]): Promise<void> {
  const statsRef = doc(db, `users/${userId}/stats/main`);
  const statsSnap = await getDoc(statsRef);
  
  if (!statsSnap.exists()) return;

  const oldData = statsSnap.data() as UserStats;
  const oldPrestige = getPrestigeData(oldData.xp);
  const newData = {
    ...oldData,
    xp: oldData.xp + amount
  };
  const newPrestige = getPrestigeData(newData.xp);

  if (newPrestige.rank.name !== oldPrestige.rank.name) {
    triggerCelebration();
  }

  const updatePayload: any = {
    xp: increment(amount),
    updatedAt: serverTimestamp(),
  };

  if (bookId) {
    const xpPerBook = { ...(oldData.xpPerBook || {}) };
    xpPerBook[bookId] = (xpPerBook[bookId] || 0) + amount;
    updatePayload.xpPerBook = xpPerBook;
  }

  if (genres && genres.length > 0) {
    const xpPerGenre = { ...(oldData.xpPerGenre || {}) };
    genres.forEach(g => {
      xpPerGenre[g] = (xpPerGenre[g] || 0) + amount;
    });
    
    // Recalculate mostReadGenre
    let topGenre = oldData.mostReadGenre || 'None';
    let max = 0;
    Object.entries(xpPerGenre).forEach(([g, val]) => {
      if (val > max) {
        max = val;
        topGenre = g;
      }
    });

    updatePayload.xpPerGenre = xpPerGenre;
    updatePayload.mostReadGenre = topGenre;
  }

  await updateDoc(statsRef, updatePayload);
}

export async function updateProfileInfo(userId: string, data: { displayName?: string, photoURL?: string, subject?: string }): Promise<void> {
  const statsRef = doc(db, `users/${userId}/stats/main`);
  await updateDoc(statsRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function updateUserPreferences(userId: string, preferences: UserStats['preferences']): Promise<void> {
  const statsRef = doc(db, `users/${userId}/stats/main`);
  await updateDoc(statsRef, {
    preferences,
    updatedAt: serverTimestamp()
  });
}

export async function reportDeepWorkSession(userId: string, durationSeconds: number): Promise<void> {
  const statsRef = doc(db, `users/${userId}/stats/main`);
  await updateDoc(statsRef, {
    totalFocusTime: increment(durationSeconds),
    sessionsCount: increment(1),
    updatedAt: serverTimestamp()
  });
}

export async function getLeaderboard(limitCount: number = 20): Promise<UserStats[]> {
  const usersRef = collectionGroup(db, 'stats');
  // Note: collectionGroup requires an index if used with orderBy.
  // Alternatively, we use a top-level collection if we restructure, 
  // but for now, let's assume we query the users collection's subcollections if possible
  // or use a dedicated leaderboard collection.
  // Actually, standard practice for leaderboards is a top-level collection.
  
  // Re-reading logic: users/${userId}/stats/main
  // Querying cross-user subcollections effectively requires collectionGroup('stats')
  const q = query(
    collectionGroup(db, 'stats'),
    where('xp', '>', 0),
    orderBy('xp', 'desc'),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserStats);
}
