import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Author } from '../types';
import { NavLink } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, Loader2, Plus, Users, BookPlus, Sparkles, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAi, MODELS } from '../lib/gemini';

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'author'>('book');

  // New Book State
  const [bookTitle, setBookTitle] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookCategory, setBookCategory] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  // New Author State
  const [authorName, setAuthorName] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [authorPhoto, setAuthorPhoto] = useState('');

  useEffect(() => {
    const fetchAuthors = async () => {
      const q = query(collection(db, 'authors'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      setAuthors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author)));
    };
    fetchAuthors();
  }, [uploading]);

  const onDrop = (acceptedFiles: File[]) => {
    setPdfFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  } as any);

  const suggestGenres = async () => {
    if (!bookTitle || !bookDesc) {
      alert('Please provide title and description first');
      return;
    }
    const ai = getAi();
    if (!ai) {
      alert('AI features are currently unavailable. Please check your VITE_GEMINI_API_KEY.');
      return;
    }
    setSuggesting(true);
    try {
      const resp = await ai.models.generateContent({
        model: MODELS.FLASH,
        config: { responseMimeType: "application/json" },
        contents: `Analyze the book "${bookTitle}" with description "${bookDesc}". 
        Return a JSON object with a key "genres" containing an array of exactly 3 relevant genre strings (e.g. "Science Fiction", "Technology", "Philosophy").`
      });
      const data = JSON.parse(resp.text);
      if (data.genres) setGenres(prev => Array.from(new Set([...prev, ...data.genres])));
    } catch (err) {
      console.error(err);
    } finally {
      setSuggesting(false);
    }
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      e.preventDefault();
      setGenres(prev => [...new Set([...prev, e.currentTarget.value])]);
      e.currentTarget.value = '';
    }
  };

  const removeTag = (tag: string) => {
    setGenres(prev => prev.filter(t => t !== tag));
  };

  const generatePlaceholderCover = (title: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      const gradient = ctx.createLinearGradient(0, 0, 600, 900);
      gradient.addColorStop(0, '#09090b');
      gradient.addColorStop(1, '#16161d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 900);

      // Accents
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 450);
      ctx.lineTo(600, 450);
      ctx.stroke();

      // Branding
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Libra', 300, 100);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      
      const words = title.split(' ');
      let lines = [];
      let currentLine = '';
      for (const word of words) {
        if ((currentLine + word).length > 15) {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }
      lines.push(currentLine.trim());

      const startY = 450 - (lines.length * 25);
      lines.forEach((line, i) => {
        ctx.fillText(line, 300, startY + i * 50);
      });

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const seedTestData = async () => {
    setUploading(true);
    try {
      const ai = getAi();
      if (!ai) {
        alert('AI features are currently unavailable.');
        setUploading(false);
        return;
      }
      const booksToSeed = [
        { title: "The Future of AI: Obsidian Horizons", author: "Dr. Elara Vance", category: "Technology", genres: ["AI", "Future", "Ethics"] },
        { title: "Fundamental Principles of High-Energy Physics", author: "Prof. Julian Thorne", category: "Science", genres: ["Physics", "Quantum", "Theory"] },
        { title: "The History of Art: From Caves to Canvas", author: "Amara Night", category: "Arts", genres: ["Art", "History", "Culture"] }
      ];

      for (const b of booksToSeed) {
        const resp = await ai.models.generateContent({
            model: MODELS.FLASH,
            config: { responseMimeType: "application/json" },
            contents: `Generate a sophisticated 'bio' for author ${b.author} and a 'summary' for the book "${b.title}". Return JSON: { "bio": "...", "summary": "..." }`
        });
        const data = JSON.parse(resp.text);

        const authorRef = await addDoc(collection(db, 'authors'), {
            name: b.author,
            bio: data.bio,
            photoUrl: `https://picsum.photos/seed/${b.author.replace(/ /g, '')}/400/400`
        });

        await addDoc(collection(db, 'books'), {
            title: b.title,
            description: data.summary,
            category: b.category,
            genres: b.genres,
            averageRating: 4.5 + Math.random() * 0.5,
            reviewsCount: Math.floor(Math.random() * 50) + 10,
            authorId: authorRef.id,
            authorName: b.author,
            pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            coverUrl: `https://picsum.photos/seed/${b.title.replace(/ /g, '')}/600/900`,
            createdAt: serverTimestamp()
        });
      }
      alert('Vault initialized with 3 high-caliber volumes.');
    } catch (err) {
      console.error(err);
      alert('Initialization failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      await addDoc(collection(db, 'authors'), {
        name: authorName,
        bio: authorBio,
        photoUrl: authorPhoto || null
      });
      setAuthorName('');
      setAuthorBio('');
      setAuthorPhoto('');
      alert('Author created!');
    } catch (err) {
      console.error(err);
      alert('Error creating author');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !selectedAuthorId) {
        alert('Please select a PDF file and an Author');
        return;
    }

    setUploading(true);
    try {
      // 1. Upload PDF
      const storageRef = ref(storage, `books/${Date.now()}_${pdfFile.name}`);
      const uploadResult = await uploadBytes(storageRef, pdfFile);
      const pdfUrl = await getDownloadURL(uploadResult.ref);

      // 2. Handle Cover
      let finalCoverUrl = coverUrl;
      if (!finalCoverUrl) {
          const placeholderBlob = await generatePlaceholderCover(bookTitle);
          const coverRef = ref(storage, `covers/${Date.now()}_cover.jpg`);
          const coverUploadResult = await uploadBytes(coverRef, placeholderBlob);
          finalCoverUrl = await getDownloadURL(coverUploadResult.ref);
      }

      // 3. Save to Firestore
      const author = authors.find(a => a.id === selectedAuthorId);
      await addDoc(collection(db, 'books'), {
        title: bookTitle,
        description: bookDesc,
        category: bookCategory,
        genres,
        averageRating: 0,
        reviewsCount: 0,
        authorId: selectedAuthorId,
        authorName: author?.name || 'Unknown',
        pdfUrl,
        coverUrl: finalCoverUrl || null,
        createdAt: serverTimestamp()
      });

      // Reset
      setBookTitle('');
      setBookDesc('');
      setBookCategory('');
      setGenres([]);
      setPdfFile(null);
      setCoverUrl('');
      alert('Book uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!user || !isAdmin) {
    useEffect(() => {
      if (!isAdmin) navigate('/');
    }, [isAdmin, navigate]);
    
    return (
        <div className="pt-32 px-6 text-center text-zinc-500">
            Access Restricted. Elevated privileges required.
        </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto min-h-screen">
      <header className="mb-12">
        <h1 className="text-3xl font-bold font-display tracking-tight mb-2">Internal Controls</h1>
        <p className="text-zinc-500 text-sm">Curate and manage the Libra digital repository.</p>
      </header>

      <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab('book')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'book' ? 'bg-neon-purple text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
        >
          <BookPlus className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-widest">New Book</span>
        </button>
        <button
          onClick={() => setActiveTab('author')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === 'author' ? 'bg-neon-purple text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-widest">New Author</span>
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-3xl"
      >
        {activeTab === 'book' ? (
          <form onSubmit={handleUploadBook} className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Title</label>
                <input
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="The Art of Obsidian"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Author</label>
                <select
                  required
                  value={selectedAuthorId}
                  onChange={(e) => setSelectedAuthorId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50 appearance-none text-zinc-300"
                >
                  <option value="">Select Author</option>
                  {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                <input
                  required
                  value={bookCategory}
                  onChange={(e) => setBookCategory(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="Design / Philosophy"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cover Image URL</label>
                <input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
              <textarea
                required
                value={bookDesc}
                onChange={(e) => setBookDesc(e.target.value)}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                placeholder="A brief summary of the book..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Genres & Tags</label>
                <button
                  type="button"
                  onClick={suggestGenres}
                  disabled={suggesting}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-neon-purple hover:text-white transition-colors disabled:opacity-50"
                >
                  {suggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Induct
                </button>
              </div>
              <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-white/10 rounded-xl min-h-[50px]">
                <AnimatePresence>
                  {genres.map(tag => (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded text-xs font-medium"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-white cursor-pointer"><CloseIcon className="w-3 h-3" /></button>
                    </motion.span>
                  ))}
                </AnimatePresence>
                <input
                  onKeyDown={addTag}
                  placeholder="Type tag and press Enter..."
                  className="flex-1 bg-transparent outline-none text-xs min-w-[150px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">PDF Content</label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all cursor-pointer ${
                  isDragActive ? 'border-neon-purple bg-neon-purple/5' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  {pdfFile ? (
                    <>
                      <FileText className="w-10 h-10 text-neon-purple" />
                      <div>
                        <p className="text-sm font-bold truncate max-w-[200px]">{pdfFile.name}</p>
                        <p className="text-xs text-zinc-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 md:w-10 md:h-10 text-zinc-600" />
                      <p className="text-xs md:text-sm text-zinc-400">Drag & drop PDF, or click to select</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={uploading}
              className="w-full py-4 rounded-2xl bg-neon-purple text-white font-bold uppercase tracking-widest shadow-lg shadow-neon-purple/20 hover:shadow-neon-purple/40 transition-all flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {uploading ? 'Processing Repository...' : 'Publish to Libra'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateAuthor} className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Display Name</label>
                <input
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="Leonardo da Vinci"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Photo URL</label>
                <input
                  value={authorPhoto}
                  onChange={(e) => setAuthorPhoto(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Author Bio</label>
              <textarea
                required
                value={authorBio}
                onChange={(e) => setAuthorBio(e.target.value)}
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                placeholder="A visionary who explored the intersection of..."
              />
            </div>

            <button
              disabled={uploading}
              className="w-full py-4 rounded-2xl bg-neon-purple text-white font-bold uppercase tracking-widest shadow-lg shadow-neon-purple/20 hover:shadow-neon-purple/40 transition-all flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {uploading ? 'Saving Visionary...' : 'Register Author'}
            </button>
          </form>
        )}
      </motion.div>

      <div className="mt-12 p-8 glass rounded-3xl border-dashed border-white/5 text-center">
        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-600 mb-4">Database Custodian</h2>
        <p className="text-xs text-zinc-500 mb-8 max-w-sm mx-auto">
            Populate the repository with initial high-caliber test data using Obsidian AI.
        </p>
        <button
          onClick={seedTestData}
          disabled={uploading}
          className="px-8 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-zinc-400 hover:text-white disabled:opacity-50"
        >
          {uploading ? 'Generating Seeds...' : 'Initialize Test Data'}
        </button>
      </div>
    </div>
  );
}
