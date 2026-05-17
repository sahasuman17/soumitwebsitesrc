import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Book, ReadingProgress } from '../types';
import BookCard from '../components/BookCard';
import PDFViewer from '../components/PDFViewer';
import { Search, Bookmark, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Library() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [readingProgress, setReadingProgress] = useState<Record<string, number>>({});
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const bStrings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
      setBooks(bStrings);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setBookmarkedIds([]);
      setReadingProgress({});
      return;
    }
    
    // Bookmarks
    const bq = query(collection(db, `users/${user.uid}/bookmarks`));
    const unsubBookmarks = onSnapshot(bq, (snapshot) => {
      setBookmarkedIds(snapshot.docs.map(doc => doc.id));
    });

    // Progress
    const pq = query(collection(db, `users/${user.uid}/progress`));
    const unsubProgress = onSnapshot(pq, (snapshot) => {
      const progresses: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        progresses[doc.id] = (doc.data() as ReadingProgress).percent;
      });
      setReadingProgress(progresses);
    });

    return () => {
      unsubBookmarks();
      unsubProgress();
    };
  }, [user]);

  const ongoingBooks = books
    .filter(b => readingProgress[b.id] > 0 && readingProgress[b.id] < 100)
    .sort((a, b) => (readingProgress[b.id] || 0) - (readingProgress[a.id] || 0))
    .slice(0, 4);

  const genres = ['All', ...(user ? ['Bookmarks'] : []), ...new Set(books.flatMap(b => [b.category, ...(b.genres || [])]).filter(Boolean))].slice(0, 10);

  const handleBookClick = (book: Book) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/library' }, message: 'Please sign in to read this book.' } });
    } else {
      setSelectedBook(book);
    }
  };

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedGenre === 'Bookmarks') {
      return matchesSearch && bookmarkedIds.includes(b.id);
    }

    const matchesGenre = selectedGenre === 'All' || 
      b.category === selectedGenre || 
      (b.genres && b.genres.includes(selectedGenre));
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto min-h-screen">
      <header className="mb-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight">The Library</h1>
            <p className="text-zinc-500 font-medium max-w-lg text-sm md:text-base">
              Explore our curated collection of technical wisdom and creative masterpieces, powered by SXVOIX-grade intelligence.
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search titles, authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/20 transition-all outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Genre Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                selectedGenre === genre 
                  ? 'bg-neon-purple text-white border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                  : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/10 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </header>

      {user && ongoingBooks.length > 0 && selectedGenre === 'All' && !searchTerm && (
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6 text-neon-purple">
            <History className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-[0.3em]">Continue Reading</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ongoingBooks.map((book, i) => (
              <BookCard
                key={`ongoing-${book.id}`}
                book={book}
                index={i}
                progress={readingProgress[book.id]}
                onClick={() => handleBookClick(book)}
              />
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book, i) => (
            <BookCard
              key={book.id}
              book={book}
              index={i}
              progress={readingProgress[book.id]}
              onClick={() => handleBookClick(book)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-4">
          <div className="p-4 rounded-full bg-white/5">
            {selectedGenre === 'Bookmarks' ? (
              <Bookmark className="w-12 h-12 opacity-20" />
            ) : (
              <Search className="w-12 h-12 opacity-20" />
            )}
          </div>
          <p className="text-lg font-medium text-center px-6">
            {selectedGenre === 'Bookmarks' 
              ? "Your personal vault is currently empty. Save some books to see them here!"
              : "No results found for your search."}
          </p>
          {selectedGenre === 'Bookmarks' && (
            <button
                onClick={() => setSelectedGenre('All')}
                className="text-xs font-bold uppercase tracking-widest text-neon-purple hover:text-white transition-colors"
            >
                Browse the Repository
            </button>
          )}
        </div>
      )}

      <PDFViewer
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}
