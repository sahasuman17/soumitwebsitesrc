import React from 'react';
import { motion } from 'framer-motion';
import { Book as BookType } from '../types';
import { NavLink } from 'react-router-dom';
import { ExternalLink, BookOpen, Star } from 'lucide-react';

interface BookCardProps {
  book: BookType;
  onClick: () => void;
  index: number;
  progress?: number;
  key?: string | number;
}

export default function BookCard({ book, onClick, index, progress }: BookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="group relative h-96 overflow-hidden glass-card cursor-pointer"
      onClick={onClick}
    >
      {/* Progress Bar (at top) */}
      {progress !== undefined && progress > 0 && (
        <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.8)]"
          />
        </div>
      )}

      {/* Cover Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={book.coverUrl || `https://picsum.photos/seed/${book.id}/400/600`}
          alt={book.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 p-6 flex flex-col justify-end gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
            {book.category}
          </span>
          {book.genres?.slice(0, 1).map(g => (
            <span key={g} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-white/5 text-zinc-400 border border-white/10">
              {g}
            </span>
          ))}
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold font-display leading-tight group-hover:text-neon-purple transition-colors">
            {book.title}
          </h3>
          <div className="flex items-center justify-between">
            <NavLink
              to={`/authors?id=${book.authorId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              by {book.authorName}
            </NavLink>
            
            {book.averageRating !== undefined && book.averageRating > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-500/80">
                <Star className="w-3 h-3 fill-current" />
                {book.averageRating.toFixed(1)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon-purple">
            <BookOpen className="w-4 h-4" />
            Read Now
          </button>
          <ExternalLink className="w-4 h-4 text-zinc-500" />
        </div>
      </div>
    </motion.div>
  );
}
