import { doc, getDoc, setDoc, serverTimestamp, Timestamp, updateDoc, increment, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DailyChallenge, UserChallengeProgress, UserStats, Badge, Book } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { addAcademicXp, triggerCelebration } from './gamificationService';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const BADGES: Badge[] = [
  { id: 'focus_master', name: 'Focus Master', description: 'Complete a 30-minute deep work session', icon: '🎯', category: 'CHALLENGE' },
  { id: 'scholar_quiz', name: 'Knowledge Seeker', description: 'Pass a book comprehension quiz', icon: '🧠', category: 'CHALLENGE' },
  { id: 'explorer_vault', name: 'Vault Explorer', description: 'Add a new book to your library', icon: '🏛️', category: 'CHALLENGE' },
  { id: 'streak_vanguard', name: 'Streak Vanguard', description: 'Maintain a 14-day research streak', icon: '⚔️', category: 'MILESTONE' },
];

export async function getDailyChallenge(userId: string): Promise<DailyChallenge> {
  const today = new Date().toISOString().split('T')[0];
  const challengeRef = doc(db, 'challenges', today);
  const challengeSnap = await getDoc(challengeRef);

  if (challengeSnap.exists()) {
    return challengeSnap.data() as DailyChallenge;
  }

  // Generate a new challenge if none exists for today
  // We'll use a simple rotation or random selection for now
  const types: any[] = ['FOCUS', 'QUIZ', 'EXPLORE'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  let challenge: DailyChallenge;

  switch (type) {
    case 'FOCUS':
      challenge = {
        id: today,
        type: 'FOCUS',
        title: 'Deep Focused Session',
        description: 'Engage in uninterrupted research.',
        task: 'Accumulate 30 minutes of Focused Reading time.',
        target: 30,
        rewardXp: 200,
        badgeId: 'focus_master'
      };
      break;
    case 'QUIZ':
      challenge = {
        id: today,
        type: 'QUIZ',
        title: 'Comprehension Test',
        description: 'Prove your understanding of the materials.',
        task: 'Pass a 3-question quiz for any book in your vault.',
        target: 1,
        rewardXp: 300,
        badgeId: 'scholar_quiz'
      };
      break;
    case 'EXPLORE':
    default:
      challenge = {
        id: today,
        type: 'EXPLORE',
        title: 'Vault Expansion',
        description: 'Broaden your intellectual horizons.',
        task: 'Add at least 1 new book to your personal vault from the library.',
        target: 1,
        rewardXp: 150,
        badgeId: 'explorer_vault'
      };
      break;
  }

  // Store it globally so all users see the same one today
  // Note: In a real app, this would be a cloud function or CRON, 
  // but for the demo, first user login generates it.
  try {
    await setDoc(challengeRef, challenge);
  } catch (err) {
    console.error('Failed to set global challenge:', err);
  }
  
  return challenge;
}

export async function getUserChallengeProgress(userId: string): Promise<UserChallengeProgress | null> {
  const today = new Date().toISOString().split('T')[0];
  const progressRef = doc(db, `users/${userId}/challenges`, today);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    return progressSnap.data() as UserChallengeProgress;
  }

  const initialProgress: UserChallengeProgress = {
    userId,
    date: today,
    currentValue: 0,
    completed: false,
    claimed: false,
    lastUpdated: Timestamp.now()
  };

  await setDoc(progressRef, initialProgress);
  return initialProgress;
}

export async function updateChallengeProgress(userId: string, amount: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const progressRef = doc(db, `users/${userId}/challenges`, today);
  const challenge = await getDailyChallenge(userId);
  const progressSnap = await getDoc(progressRef);
  
  if (!progressSnap.exists()) return;
  const progress = progressSnap.data() as UserChallengeProgress;

  if (progress.completed) return;

  const newValue = progress.currentValue + amount;
  const isCompleted = newValue >= challenge.target;

  await updateDoc(progressRef, {
    currentValue: newValue,
    completed: isCompleted,
    lastUpdated: serverTimestamp()
  });

  if (isCompleted) {
    // We don't auto-award here so user can "Claim" it for better UX
    // but we can award XP immediately if preferred. Let's make it manual claim for the "Aha!" moment.
  }
}

export async function claimChallengeReward(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const progressRef = doc(db, `users/${userId}/challenges`, today);
  const statsRef = doc(db, `users/${userId}/stats/main`);
  
  const challenge = await getDailyChallenge(userId);
  const progressSnap = await getDoc(progressRef);
  
  if (!progressSnap.exists()) return;
  const progress = progressSnap.data() as UserChallengeProgress;

  if (progress.completed && !progress.claimed) {
    await updateDoc(progressRef, { claimed: true });
    await addAcademicXp(userId, challenge.rewardXp);
    
    if (challenge.badgeId) {
      const statsSnap = await getDoc(statsRef);
      const currentBadges = (statsSnap.data()?.badges || []) as string[];
      if (!currentBadges.includes(challenge.badgeId)) {
        await updateDoc(statsRef, {
          badges: [...currentBadges, challenge.badgeId]
        });
      }
    }
    
    triggerCelebration();
  }
}

export async function getRandomUserBook(userId: string): Promise<Book | null> {
  const bookmarksRef = collection(db, `users/${userId}/bookmarks`);
  const snap = await getDocs(query(bookmarksRef, limit(10)));
  
  if (snap.empty) return null;
  
  const bookIds = snap.docs.map(doc => doc.id);
  const randomId = bookIds[Math.floor(Math.random() * bookIds.length)];
  
  const bookRef = doc(db, 'books', randomId);
  const bookSnap = await getDoc(bookRef);
  
  return bookSnap.exists() ? { id: bookSnap.id, ...bookSnap.data() } as Book : null;
}

export async function generateBookQuiz(book: Book) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an academic examiner for SXVOIX Elite. Generate a 3-question multiple choice quiz for the book "${book.title}" by ${book.authorName}. 
    Context: ${book.description}
    Return in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.NUMBER }
              },
              required: ["question", "options", "correctIndex"]
            }
          }
        },
        required: ["questions"]
      }
    }
  });

  return JSON.parse(response.text);
}
