import React from 'react';
import { motion } from 'framer-motion';
import { UserStats } from '../../types';
import { getPrestigeData } from '../../services/gamificationService';
import { BADGES } from '../../services/challengeService';
import { Zap, Flame, Award, Shield, User, Medal, BookOpen, BarChart3, Clock, Trophy } from 'lucide-react';

interface ScholarProfileProps {
  stats: UserStats;
}

export default function ScholarProfile({ stats }: ScholarProfileProps) {
  const { rank, title, progress } = getPrestigeData(stats.xp);
  const Icon = rank.icon;

  const userBadges = BADGES.filter(b => stats.badges?.includes(b.id));

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const avgSessionMins = stats.sessionsCount > 0 ? formatDuration(stats.totalFocusTime / stats.sessionsCount) : '0m';
  
  // Find top book by XP
  let topBookXp = 0;
  let topBookId = '';
  if (stats.xpPerBook) {
    Object.entries(stats.xpPerBook).forEach(([id, xp]) => {
      if (xp > topBookXp) {
        topBookXp = xp;
        topBookId = id;
      }
    });
  }

  return (
    <div className="glass rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-purple/10 blur-[100px] rounded-full group-hover:bg-neon-purple/20 transition-colors" />
      
      <div className="relative flex flex-col md:flex-row gap-8 items-center">
        {/* Avatar Section */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-neon-purple p-1 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
              {stats.photoURL ? (
                <img src={stats.photoURL} alt={stats.displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-zinc-700" />
              )}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-neon-purple p-2 rounded-lg shadow-lg">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col mb-1">
            <h2 className="text-2xl font-bold font-display tracking-tight text-white capitalize">
              {stats.displayName}
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-purple">
                {rank.name}
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest italic">
                {title}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-6 mt-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-1">XP Total</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-neon-purple" />
                <span className="text-lg font-mono font-bold text-white leading-none">
                  {stats.xp.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-white/5" />
            <div className="flex flex-col items-center md:items-start">
              <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Research Streak</span>
              <div className="flex items-center gap-1.5 text-orange-500">
                <Flame className="w-3 h-3 fill-orange-500" />
                <span className="text-lg font-mono font-bold leading-none">
                  {stats.currentStreak} Days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="hidden lg:flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/5 min-w-[120px]">
           <Shield className="w-6 h-6 text-neon-purple/40 mb-2" />
           <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Status</span>
           <span className="text-xs font-bold text-white mt-1">
             Active Scholar
           </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Prestige Progress</span>
          <span className="text-xs font-mono font-bold text-neon-purple">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-neon-purple to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          />
        </div>
        <div className="flex justify-between items-start pt-1">
          <span className="text-[8px] text-zinc-600 font-medium font-mono">
            {rank.minXp.toLocaleString()} XP
          </span>
          <span className="text-[8px] text-zinc-600 font-medium font-mono">
            {rank.maxXp === Infinity ? '∞' : rank.maxXp.toLocaleString()} XP
          </span>
        </div>
      </div>
      
      {/* Detailed Stats Grid */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-white/5 border border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-500">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Top Genre</span>
          </div>
          <div className="text-sm font-bold text-white capitalize">{stats.mostReadGenre || 'N/A'}</div>
        </div>
        
        <div className="space-y-1 border-l border-white/5 pl-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Trophy className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Best Streak</span>
          </div>
          <div className="text-sm font-bold text-white">{stats.longestStreak || '1'} Days</div>
        </div>

        <div className="space-y-1 border-l border-white/5 pl-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Avg Session</span>
          </div>
          <div className="text-sm font-bold text-white">{avgSessionMins}</div>
        </div>

        <div className="space-y-1 border-l border-white/5 pl-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <BookOpen className="w-3.5 h-3.5 text-neon-purple" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Top Focus</span>
          </div>
          <div className="text-xs font-bold text-white truncate max-w-[100px]">
            {topBookXp > 0 ? `+${topBookXp} XP` : 'none'}
          </div>
        </div>
      </div>

      {/* Badges Section */}
      {userBadges.length > 0 && (
        <div className="mt-8 pt-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-neon-purple" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Earned Accolades</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-600">{userBadges.length} Active</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {userBadges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group/badge relative"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl hover:bg-neon-purple/20 hover:border-neon-purple/50 transition-all cursor-help shadow-lg group-hover/badge:scale-110">
                  {badge.icon}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-center opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none min-w-[120px] z-50">
                  <div className="text-[10px] font-bold text-white mb-0.5">{badge.name}</div>
                  <div className="text-[8px] text-zinc-500 leading-tight">{badge.description}</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
