import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Users, ShieldCheck, ArrowRight, Star, Trophy, Target } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import ScholarProfile from '../components/gamification/ScholarProfile';
import DailyChallengeCard from '../components/gamification/DailyChallengeCard';
import GlobalHallOfFame from '../components/gamification/GlobalHallOfFame';

export default function Home() {
  const { user } = useAuth();
  const { stats } = useGamification();
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      const q = query(collection(db, 'books'), limit(4));
      const snap = await getDocs(q);
      setFeaturedBooks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
    };
    fetchFeatured();
  }, []);

  const features = [
    { icon: BookOpen, title: 'Obsidian Library', desc: 'A meticulously curated collection of high-end digital books.' },
    { icon: Sparkles, title: 'SXVOIX Intelligence', desc: 'AI-powered insights and summaries for every volume.' },
    { icon: Users, title: 'Elite Authors', desc: 'Direct access to the minds of industry-leading visionaries.' },
    { icon: ShieldCheck, title: 'Secured Content', desc: 'Enterprise-grade protection for your digital intellectual property.' },
  ];

  return (
    <div className="pt-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-neon-purple/20 blur-[120px] rounded-full opacity-40" />
          <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full opacity-20" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 space-y-8 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-neon-purple/20 text-neon-purple text-xs font-bold uppercase tracking-[0.2em] mb-4">
            <Sparkles className="w-3 h-3" />
            Empowering the modern intellect
          </div>
          
          <h1 className="text-4xl md:text-8xl font-bold font-display tracking-tight leading-[1.05] break-words">
            The Future of <span className="neon-text">Knowledge</span> <br />
            Is Here.
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Welcome to SXVOIX. A startup-grade, immersive library ecosystem designed for those who demand excellence in every pixel and every page.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <NavLink
              to="/library"
              className="group flex items-center gap-3 px-10 py-4 bg-neon-purple text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_10px_40px_rgba(168,85,247,0.6)] transition-all hover:scale-105 active:scale-95"
            >
              Enter Library
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </NavLink>
            <NavLink
              to="/authors"
              className="px-10 py-4 glass text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
            >
              Meet Authors
            </NavLink>
          </div>
        </motion.div>

        {/* Floating elements hint */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-12 z-10 text-zinc-600 text-[10px] uppercase tracking-[0.4em]"
        >
          
        </motion.div>
      </section>

      {/* Dashboard Section for Logged In Users */}
      {user && stats && (
        <section className="py-12 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <ScholarProfile stats={stats} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <DailyChallengeCard />
            </motion.div>
          </div>
        </section>
      )}

      {/* Bento Features Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 group"
            >
              <div className="p-3 rounded-xl bg-neon-purple/10 text-neon-purple mb-6 w-fit group-hover:bg-neon-purple group-hover:text-white transition-all">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visual Accent */}
      <section className="relative py-32 flex flex-col items-center">
        <div className="absolute inset-0 bg-neon-purple/5 -skew-y-3 transform origin-left" />
        <div className="relative z-10 text-center space-y-4 px-6 mb-16">
          <h2 className="text-4xl font-bold font-display tracking-tight">Diverse Discovery</h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Explore a range of genres and high-caliber insights from our premium collection.
          </p>
        </div>

        <div className="relative z-10 w-full max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass p-4 rounded-3xl space-y-4 hover:border-neon-purple/50 transition-colors"
            >
              <div className="aspect-[3/4] rounded-2xl overflow-hidden">
                <img 
                  src={book.coverUrl || `https://picsum.photos/seed/${book.id}/200/300`} 
                  alt={book.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-neon-purple">{book.category}</span>
                  {book.averageRating && (
                    <div className="flex items-center gap-0.5 text-yellow-500/80 text-[10px] font-bold">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {book.averageRating.toFixed(1)}
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-sm truncate">{book.title}</h4>
                <p className="text-[10px] text-zinc-500 font-medium">by {book.authorName}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-neon-purple uppercase tracking-[0.3em] mb-2">
            <Trophy className="w-3 h-3" />
            The High Tier
          </div>
          <h2 className="text-4xl font-bold font-display tracking-tight text-white italic">
            Global <span className="text-neon-purple not-italic">Hall of Fame</span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed px-4">
            Join the ranks of elite scholars. Your intellectual exploration and focus are recognized globally within the SXVOIX ecosystem.
          </p>
        </div>
        
        <div className="glass rounded-[2.5rem] p-8 md:p-12 border border-white/5 relative overflow-hidden">
          <GlobalHallOfFame />
          
          <div className="mt-12 text-center">
            <NavLink 
              to="/leaderboard"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-neon-purple/20 text-neon-purple font-bold text-xs uppercase tracking-widest border border-neon-purple/30 hover:bg-neon-purple hover:text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.1)]"
            >
              View Full Leaderboard
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
      </section>

      <div className="relative z-10 text-center pb-24">
        <p className="text-zinc-500 max-w-2xl mx-auto italic px-6">
          "SXVOIX represents the intersection of luxury design and digital utility. We don't just host books; we curate experiences."
        </p>
      </div>
    </div>
  );
}
