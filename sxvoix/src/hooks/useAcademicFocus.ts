import { useEffect, useRef, useState } from 'react';
import { useGamification } from '../context/GamificationContext';
import { Book } from '../types';

/**
 * useAcademicFocus hook tracks active reading sessions.
 * Award: 10 XP per 5 minutes of focused activity.
 * Syncs with Firebase every 5 minutes.
 */
export function useAcademicFocus(book?: Book | null) {
  const { earnAcademicXp, reportChallengeProgress, reportSession, challenge } = useGamification();
  const [focusTimeSeconds, setFocusTimeSeconds] = useState(0);
  const bufferedXpRef = useRef(0);
  const bufferedMinutesRef = useRef(0);
  const bufferedSecondsTotalRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    const heartbeat = setInterval(() => {
      // Check if document has focus (Active Reading)
      if (document.hasFocus()) {
        setFocusTimeSeconds(prev => prev + 30);
        bufferedSecondsTotalRef.current += 30;
      }
    }, 30000); // 30s heartbeat

    return () => clearInterval(heartbeat);
  }, []);

  useEffect(() => {
    const checkAward = () => {
      // Every 5 minutes (300 seconds) of focus = 10 XP
      if (focusTimeSeconds >= 300) {
        bufferedXpRef.current += 10;
        bufferedMinutesRef.current += 5;
        setFocusTimeSeconds(prev => prev - 300);
      }

      // Sync buffered XP and session stats to Firebase
      const now = Date.now();
      if (now - lastUpdateRef.current >= 300000 && (bufferedXpRef.current > 0 || bufferedMinutesRef.current > 0)) {
        if (bufferedXpRef.current > 0) {
          earnAcademicXp(bufferedXpRef.current, book?.id, book?.genres);
        }
        if (bufferedMinutesRef.current > 0 && challenge?.type === 'FOCUS') {
          reportChallengeProgress(bufferedMinutesRef.current);
        }
        if (bufferedSecondsTotalRef.current >= 60) {
          reportSession(bufferedSecondsTotalRef.current);
          bufferedSecondsTotalRef.current = 0;
        }
        bufferedXpRef.current = 0;
        bufferedMinutesRef.current = 0;
        lastUpdateRef.current = now;
      }
    };

    checkAward();
  }, [focusTimeSeconds, earnAcademicXp, reportChallengeProgress, reportSession, challenge, book]);

  return {
    isFocused: document.hasFocus(),
    focusTimeSeconds,
    totalBufferedXp: bufferedXpRef.current
  };
}
