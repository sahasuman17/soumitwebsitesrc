import React from 'react';
import { motion } from 'framer-motion';
import GlobalHallOfFame from '../components/gamification/GlobalHallOfFame';
import { Trophy, Star, Shield, ArrowLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Leaderboard() {
  return (
    <div className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <NavLink 
            to="/" 
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-neon-purple transition-colors mb-6"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Library
          </NavLink>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/20 border border-neon-purple/30 text-[10px] font-bold text-neon-purple uppercase tracking-[0.2em]">
              <Trophy className="w-3 h-3" />
              Global Hall of Fame
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight text-white italic">
              SXVOIX <span className="text-neon-purple text-5xl md:text-6xl not-italic">Elite</span>
            </h1>
            <p className="text-zinc-500 max-w-lg leading-relaxed text-sm">
              The highest tier of digital scholars. Recognition is earned through consistency, focus, and deep intellectual exploration.
            </p>
          </motion.div>
        </div>

        <div className="flex gap-4">
          <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center min-w-[120px]">
            <Star className="w-5 h-5 text-neon-purple mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tier Avg</span>
            <span className="text-xl font-mono font-bold text-white mt-1">Sage</span>
          </div>
          <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center min-w-[120px]">
            <Shield className="w-5 h-5 text-neon-purple mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active</span>
            <span className="text-xl font-mono font-bold text-white mt-1">2.4k</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-[2rem] border border-white/5 p-8 md:p-12 relative overflow-hidden">
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
        />
        
        <GlobalHallOfFame />
      </div>

      <div className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-700">
        Rankings updated in real-time based on intellectual contributions
      </div>
    </div>
  );
}
