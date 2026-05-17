import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakDisplayProps {
  days: number;
}

export default function StreakDisplay({ days }: StreakDisplayProps) {
  if (days <= 0) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 group hover:bg-orange-500/20 transition-all cursor-default"
      title="Daily Burn Streak"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
      </motion.div>
      <span className="text-xs font-black text-orange-500 uppercase tracking-tighter">
        {days} Day{days !== 1 ? 's' : ''}
      </span>
    </motion.div>
  );
}
