import React from 'react';
import { motion } from 'framer-motion';
import { Author } from '../types';
import { User } from 'lucide-react';

interface AuthorCardProps {
  author: Author;
  index: number;
}

export default function AuthorCard({ author, index }: AuthorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="glass-card p-6 flex flex-col gap-4 group"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-neon-purple/50 transition-colors">
          <img
            src={author.photoUrl || `https://picsum.photos/seed/${author.id}/150/150`}
            alt={author.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-lg font-bold font-display group-hover:text-neon-purple transition-colors">
            {author.name}
          </h3>
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Author</span>
        </div>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 italic">
        "{author.bio}"
      </p>
    </motion.div>
  );
}
