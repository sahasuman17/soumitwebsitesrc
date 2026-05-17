import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, Zap, Flame, Loader2, Search } from 'lucide-react';
import { UserStats } from '../../types';
import { getLeaderboard, getPrestigeData } from '../../services/gamificationService';

export default function GlobalHallOfFame() {
  const [entries, setEntries] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setEntries(data);
      } catch (error) {
        console.error('Leaderboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Retrieving Hall of Fame Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Table-like header */}
      <div className="grid grid-cols-12 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 border-b border-white/5 pb-4">
        <span className="col-span-1">Pos</span>
        <span className="col-span-6">Scholar</span>
        <span className="col-span-2 text-center">Streak</span>
        <span className="col-span-3 text-right">Intellect (XP)</span>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const { rank, title } = getPrestigeData(entry.xp);
          const isTop3 = index < 3;
          
          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`grid grid-cols-12 items-center px-6 py-4 rounded-xl border transition-all group cursor-default ${
                isTop3 
                ? 'bg-neon-purple/5 border-neon-purple/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]' 
                : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              {/* Position */}
              <div className="col-span-1 flex items-center gap-2">
                {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                {index === 1 && <Medal className="w-4 h-4 text-zinc-300" />}
                {index === 2 && <Medal className="w-4 h-4 text-orange-400" />}
                {index >= 3 && <span className="text-sm font-mono text-zinc-700 font-bold">#{index + 1}</span>}
              </div>

              {/* Scholar */}
              <div className="col-span-6 flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={entry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userId}`} 
                    alt="" 
                    className={`w-10 h-10 rounded-lg border ${isTop3 ? 'border-neon-purple' : 'border-zinc-800'}`}
                  />
                  {isTop3 && (
                    <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-neon-purple">
                      <Zap className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white group-hover:text-neon-purple transition-colors">
                    {entry.displayName || 'Anonymous'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                      {rank.name}
                    </span>
                    <span className="text-[9px] text-zinc-600 italic">
                      • {title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div className="col-span-2 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <Flame className={`w-3 h-3 ${entry.currentStreak > 0 ? 'text-orange-500 fill-orange-500' : 'text-zinc-800'}`} />
                  <span className="text-sm font-mono font-bold text-zinc-300">
                    {entry.currentStreak}
                  </span>
                </div>
                {entry.currentStreak >= 7 && (
                  <span className="text-[8px] font-bold text-orange-500/60 uppercase tracking-tighter animate-pulse">
                    Multiplier Active
                  </span>
                )}
              </div>

              {/* XP */}
              <div className="col-span-3 text-right">
                <span className="text-lg font-mono font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  {entry.xp.toLocaleString()}
                </span>
              </div>
            </motion.div>
          );
        })}

        {entries.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm italic font-mono uppercase tracking-widest">
            The halls are currently empty. Be the first to emerge.
          </div>
        )}
      </div>
    </div>
  );
}
