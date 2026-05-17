import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Sparkles, Loader2, Star, ShieldAlert, Bookmark, BookmarkCheck, LayoutPanelTop } from 'lucide-react';
import { Book, ReadingProgress } from '../types';
import { getAi, MODELS } from '../lib/gemini';
import { doc, setDoc, getDoc, runTransaction, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import { useAcademicFocus } from '../hooks/useAcademicFocus';

interface PDFViewerProps {
  book: Book | null;
  onClose: () => void;
}

export default function PDFViewer({ book, onClose }: PDFViewerProps) {
  const { user } = useAuth();
  const { earnActionXp, reportChallengeProgress, challenge, stats } = useGamification();
  const { isFocused } = useAcademicFocus(book);
  const preferences = stats?.preferences;
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingBookmark, setLoadingBookmark] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    if (!book || !user) return;
    const fetchData = async () => {
      // Fetch Rating
      const ratingDoc = await getDoc(doc(db, `books/${book.id}/ratings`, user.uid));
      if (ratingDoc.exists()) {
        setUserRating(ratingDoc.data().score);
      } else {
        setUserRating(0);
      }

      // Fetch Bookmark
      const bookmarkDoc = await getDoc(doc(db, `users/${user.uid}/bookmarks`, book.id));
      setIsBookmarked(bookmarkDoc.exists());

      // Fetch Progress
      const progressDoc = await getDoc(doc(db, `users/${user.uid}/progress`, book.id));
      if (progressDoc.exists()) {
        setProgress(progressDoc.data().percent);
      } else {
        setProgress(0);
      }
    };
    fetchData();
    setAiSummary(null);
    if (book && user) {
      earnActionXp('OPEN_BOOK', book.id, book.genres);
      if (preferences?.aiAssistant) {
        analyzeBook();
      }
    }
  }, [book, user, preferences?.aiAssistant]);

  const handleSaveProgress = async (val: number) => {
    if (!book || !user) return;
    if (preferences && !preferences.syncProgress) return;
    setSavingProgress(true);
    setProgress(val);
    try {
      await setDoc(doc(db, `users/${user.uid}/progress`, book.id), {
        bookId: book.id,
        userId: user.uid,
        percent: val,
        lastRead: serverTimestamp()
      });
    } catch (err) {
      console.error('Progress save failed:', err);
    } finally {
      setSavingProgress(false);
    }
  };

  if (!book) return null;

  const toggleBookmark = async () => {
    if (!user) return;
    setLoadingBookmark(true);
    try {
      const bookmarkRef = doc(db, `users/${user.uid}/bookmarks`, book.id);
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
      } else {
        await setDoc(bookmarkRef, {
          bookId: book.id,
          userId: user.uid,
          timestamp: serverTimestamp()
        });
        setIsBookmarked(true);
        if (challenge?.type === 'EXPLORE') {
          reportChallengeProgress(1);
        }
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    } finally {
      setLoadingBookmark(false);
    }
  };

  const handleRate = async (score: number) => {
    if (!user) {
      alert('Please sign in to rate books.');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const bookRef = doc(db, 'books', book.id);
        const ratingRef = doc(db, `books/${book.id}/ratings`, user.uid);
        
        const bookDoc = await transaction.get(bookRef);
        const prevRatingDoc = await transaction.get(ratingRef);
        
        if (!bookDoc.exists()) throw new Error("Book does not exist!");

        const bData = bookDoc.data();
        let totalScore = (bData.averageRating || 0) * (bData.reviewsCount || 0);
        let count = bData.reviewsCount || 0;

        if (prevRatingDoc.exists()) {
          totalScore = totalScore - prevRatingDoc.data().score + score;
        } else {
          totalScore += score;
          count += 1;
        }

        const newAvg = totalScore / count;

        transaction.update(bookRef, {
          averageRating: newAvg,
          reviewsCount: count
        });

        transaction.set(ratingRef, {
          score,
          userId: user.uid,
          timestamp: serverTimestamp()
        });
      });
      setUserRating(score);
    } catch (error) {
      console.error('Rating failed:', error);
    }
  };

  const analyzeBook = async () => {
    const ai = getAi();
    if (!ai) {
      setAiSummary('AI Assistant is currently unavailable.');
      return;
    }
    setLoadingAi(true);
    try {
      const response = await ai.models.generateContent({
        model: MODELS.FLASH,
        contents: `Provide a high-end, sophisticated summary and key insights for the book titled "${book.title}" by ${book.authorName}. 
        Description: ${book.description}.
        Format the output with aesthetic bullet points and a 'vibe' analysis.`
      });
      setAiSummary(response.text);
      earnActionXp('GENERATE_SUMMARY', book?.id, book?.genres);
    } catch (error) {
      console.error('AI Analysis failed:', error);
      setAiSummary('Failed to generate insights. Please try again later.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleDownload = () => {
    window.open(book.pdfUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className={`relative w-full max-w-6xl h-full max-h-[90vh] glass rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(168,85,247,0.2)] ${
            preferences?.focusMode ? 'md:max-w-4xl' : ''
          }`}
        >
          {/* Header/Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[110] p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Left: Metadata & AI */}
          {!preferences?.focusMode && (
            <div className="w-full md:w-1/3 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto border-r border-white/5 bg-black/20">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl md:text-3xl font-bold font-display leading-tight">{book.title}</h2>
                    <p className="text-neon-purple font-medium text-sm">by {book.authorName}</p>
                  </div>
                  {user && (
                    <button
                      onClick={toggleBookmark}
                      disabled={loadingBookmark}
                      className={`shrink-0 p-3 rounded-xl border transition-all ${
                        isBookmarked 
                          ? 'bg-neon-purple/20 border-neon-purple text-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                          : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:border-white/20'
                      }`}
                      title={isBookmarked ? "Remove from Vault" : "Save to Vault"}
                    >
                      {loadingBookmark ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isBookmarked ? (
                        <BookmarkCheck className="w-5 h-5" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
                
                {/* Star Rating UI */}
                <div className="flex flex-col gap-2 pt-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Your Rating</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => handleRate(s)}
                        className="transition-transform active:scale-90"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            s <= (hoverRating || userRating)
                              ? 'fill-neon-purple text-neon-purple filter drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]'
                              : 'text-zinc-800'
                          }`}
                        />
                      </button>
                    ))}
                    {book.averageRating !== undefined && book.averageRating > 0 && (
                      <span className="ml-2 text-xs font-bold text-zinc-400">
                        ({book.averageRating.toFixed(1)} avg)
                      </span>
                    )}
                  </div>
                </div>

                {/* Reading Progress Selector */}
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutPanelTop className="w-3.5 h-3.5 text-neon-purple" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Progress</span>
                    </div>
                    <span className="text-xs font-mono text-neon-purple">{Math.round(progress)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    onMouseUp={(e) => handleSaveProgress(parseInt((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => handleSaveProgress(parseInt((e.target as HTMLInputElement).value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-neon-purple"
                  />
                  <div className="flex justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">
                    <span>Start</span>
                    <span>{savingProgress ? 'Syncing...' : 'Completed'}</span>
                  </div>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed">{book.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {book.genres?.map(g => (
                      <span key={g} className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-zinc-400 border border-white/10 uppercase font-bold tracking-widest">
                          {g}
                      </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4">
                {user ? (
                  <>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-bold uppercase tracking-widest"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    
                    <button
                      onClick={analyzeBook}
                      disabled={loadingAi}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all text-sm font-bold uppercase tracking-widest"
                    >
                      {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {aiSummary ? 'Regenerate Insights' : 'AI Analysis'}
                    </button>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                      Encrypted Content
                  </div>
                )}
              </div>

              {aiSummary && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-6 p-6 rounded-2xl bg-neon-purple/5 border border-neon-purple/20 space-y-3"
                >
                  <div className="flex items-center gap-2 text-neon-purple">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">SXVOIX Intelligence</span>
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {aiSummary}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Right: PDF Webview */}
          <div className="flex-1 bg-zinc-900/50 flex items-center justify-center">
            {user ? (
              <iframe
                src={`${book.pdfUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title={book.title}
              />
            ) : (
                <div className="text-center space-y-4 p-8">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                        <ShieldAlert className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-400 font-medium">Authentication required to access the vault.</p>
                </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
