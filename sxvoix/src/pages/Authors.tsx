import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { Author } from '../types';
import AuthorCard from '../components/AuthorCard';
import { Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Authors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const highlightedId = searchParams.get('id');

  useEffect(() => {
    const q = query(collection(db, 'authors'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const aStrings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author));
      setAuthors(aStrings);
      setLoading(false);
    });
  }, []);

  const filteredAuthors = authors.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">The Visionaries</h1>
            <p className="text-zinc-500 font-medium max-w-lg">
                Meet the minds behind the masterpieces. The authors who shape the future of knowledge.
            </p>
        </div>

        <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
                type="text"
                placeholder="Search authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/20 transition-all outline-none text-sm"
            />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            ))}
        </div>
      ) : filteredAuthors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuthors.map((author, i) => (
            <div key={author.id} className={highlightedId === author.id ? 'ring-2 ring-neon-purple rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)]' : ''}>
                <AuthorCard author={author} index={i} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-zinc-600 italic">No authors found.</div>
      )}

      {/* Aesthetic CTA */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mt-20 p-8 md:p-12 glass rounded-[2rem] text-center space-y-4 border border-neon-purple/20"
      >
        <div className="inline-flex p-3 rounded-full bg-neon-purple/10 text-neon-purple mb-4">
            <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-display px-4">Are you a creator?</h2>
        <p className="text-zinc-400 max-w-md mx-auto text-sm">
            Join the exclusive Libra network of authors and share your wisdom with a high-end audience.
        </p>
        <button className="px-8 py-3 rounded-xl bg-neon-purple text-white font-bold hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all uppercase tracking-widest text-sm">
            Apply as Author
        </button>
      </motion.div>
    </div>
  );
}
