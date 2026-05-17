import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Award, CheckCircle2, Loader2, BookOpen, Brain, Clock, ChevronRight, X } from 'lucide-react';
import { useGamification } from '../../context/GamificationContext';
import { useAuth } from '../../context/AuthContext';
import { BADGES, generateBookQuiz, getRandomUserBook } from '../../services/challengeService';
import { Book } from '../../types';

export default function DailyChallengeCard() {
  const { challenge, challengeProgress, claimReward, reportChallengeProgress } = useGamification();
  const { user } = useAuth();
  
  const [showQuiz, setShowQuiz] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);

  if (!challenge || !challengeProgress) return null;

  const progressPercent = Math.min(100, (challengeProgress.currentValue / challenge.target) * 100);
  const badge = BADGES.find(b => b.id === challenge.badgeId);

  const startQuiz = async () => {
    if (!user) return;
    setLoadingQuiz(true);
    try {
      const book = await getRandomUserBook(user.uid);
      if (!book) {
        alert("Add a book to your vault first to unlock comprehension quizzes!");
        return;
      }
      const data = await generateBookQuiz(book);
      setQuizData(data);
      setShowQuiz(true);
    } catch (err) {
      console.error('Quiz error:', err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswer = (index: number) => {
    const newAnswers = [...answers, index];
    setAnswers(newAnswers);
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const correctCount = newAnswers.filter((a, i) => a === quizData.questions[i].correctIndex).length;
      if (correctCount === quizData.questions.length) {
        reportChallengeProgress(1); // Increment quiz challenge
      }
      setQuizComplete(true);
    }
  };

  return (
    <div className="glass rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <Target className="w-24 h-24 text-neon-purple" />
      </div>

      <div className="relative space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-neon-purple/20 border border-neon-purple/30">
            {challenge.type === 'FOCUS' && <Clock className="w-5 h-5 text-neon-purple" />}
            {challenge.type === 'QUIZ' && <Brain className="w-5 h-5 text-neon-purple" />}
            {challenge.type === 'EXPLORE' && <BookOpen className="w-5 h-5 text-neon-purple" />}
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-white italic">
              Daily <span className="text-neon-purple not-italic">Scholar Quest</span>
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Challenge Active</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-bold text-white leading-tight">{challenge.title}</h4>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
            {challenge.task}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Progress</span>
            <span className="text-xs font-mono font-bold text-neon-purple">
              {challengeProgress.currentValue} / {challenge.target}
            </span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={`h-full bg-gradient-to-r from-neon-purple to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-neon-purple" />
            <span className="text-sm font-mono font-bold text-white">+{challenge.rewardXp} XP</span>
          </div>
          {badge && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <span className="text-lg">{badge.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{badge.name}</span>
            </div>
          )}
        </div>

        <div className="pt-4">
          {challengeProgress.claimed ? (
            <div className="flex items-center gap-2 text-green-500 font-bold uppercase text-[10px] tracking-widest">
              <CheckCircle2 className="w-4 h-4" />
              Challenge Accomplished
            </div>
          ) : challengeProgress.completed ? (
            <button
              onClick={claimReward}
              className="w-full py-4 rounded-xl bg-neon-purple text-white font-bold uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all animate-pulse"
            >
              Claim Rewards
            </button>
          ) : (
            <>
              {challenge.type === 'QUIZ' ? (
                <button
                  onClick={startQuiz}
                  disabled={loadingQuiz}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl glass border-neon-purple/20 text-neon-purple font-bold uppercase tracking-[0.2em] text-xs hover:bg-neon-purple/10 transition-all"
                >
                  {loadingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Begin Comprehension Test
                </button>
              ) : (
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 italic">
                  Complete the task above to unlock rewards
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && quizData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-xl glass rounded-[2.5rem] p-10 border border-neon-purple/20 relative"
            >
              <button 
                onClick={() => setShowQuiz(false)}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {!quizComplete ? (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-neon-purple uppercase tracking-[0.4em]">
                      Question {currentQuestion + 1} of {quizData.questions.length}
                    </span>
                    <h3 className="text-xl font-bold text-white italic">
                      {quizData.questions[currentQuestion].question}
                    </h3>
                  </div>

                  <div className="grid gap-3">
                    {quizData.questions[currentQuestion].options.map((opt: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className="w-full p-5 text-left rounded-2xl bg-white/5 border border-white/5 hover:border-neon-purple/50 hover:bg-neon-purple/5 transition-all text-sm font-medium text-zinc-300 hover:text-white"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6 py-8">
                  <div className="w-20 h-20 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto border border-neon-purple/30">
                    <CheckCircle2 className="w-10 h-10 text-neon-purple" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Quiz Evaluated</h3>
                  <p className="text-zinc-400">
                    {answers.filter((a, i) => a === quizData.questions[i].correctIndex).length === quizData.questions.length
                      ? "Flawless Performance. The challenge progress has been updated."
                      : "Knowledge gap detected. Review the material and try again to complete the quest."}
                  </p>
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="px-10 py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-xs"
                  >
                    Return to Library
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
