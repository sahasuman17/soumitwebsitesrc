import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserStats } from '../../types';
import { getPrestigeData } from '../../services/gamificationService';
import { ShieldCheck, Zap, Star } from 'lucide-react';

interface LevelProgressProps {
  stats: UserStats;
}

export default function LevelProgress({ stats }: LevelProgressProps) {
  const { rank, title, progress } = getPrestigeData(stats.xp);
  const Icon = rank.icon;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[240px]">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-2 text-neon-purple">
          <div className="p-1 rounded bg-neon-purple/20">
            <Icon className="w-3 h-3" />
          </div>
          <div className="flex flex-col">
            <span className="text-white/90 leading-none mb-0.5">{rank.name}</span>
            <span className="text-[8px] text-zinc-500 font-mono italic">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-zinc-400 font-mono">
          <Zap className="w-2.5 h-2.5 text-neon-purple" />
          <span>{stats.xp.toLocaleString()}</span>
        </div>
      </div>

      <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="absolute inset-y-0 left-0 bg-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]"
        />
      </div>

      {rank.maxXp !== Infinity && (
        <div className="flex justify-between items-center px-0.5">
          <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-tighter">
            Rank Progress
          </span>
          <span className="text-[8px] text-zinc-500 font-medium">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}
