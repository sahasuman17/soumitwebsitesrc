import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Author } from '../types';
import { Upload, FileText, CheckCircle2, Loader2, Plus, Users, BookPlus, Sparkles, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAi, MODELS } from '../lib/gemini';

async function uploadPdfToDrive(file: File, accessToken: string): Promise<string> {
  const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID as string | undefined;

  const metadata: Record<string, unknown> = { name: file.name };
  if (folderId) metadata.parents = [folderId];

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form }
  );
  if (!uploadRes.ok) throw new Error(await uploadRes.text());
  const { id } = await uploadRes.json();

  // Make publicly readable
  await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return `https://drive.google.com/file/d/${id}/view?usp=sharing`;
}

export default function Admin() {
  const { user, isAdmin, googleAccessToken, signIn } = useAuth();
  const navigate = useNavigate();

  const [authors, setAuthors] = useState<Author[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'author'>('book');

  // Book form
  const [bookTitle, setBookTitle] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookCategory, setBookCategory] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  // Author form
  const [authorName, setAuthorName] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [authorPhoto, setAuthorPhoto] = useState('');

  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  useEffect(() => {
    const q = query(collection(db, 'authors'), orderBy('name', 'asc'));
    getDocs(q).then(snap =>
      setAuthors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Author)))
    );
  }, [uploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setPdfFile(files[0]),
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  } as any);

  const suggestGenres = async () => {
    if (!bookTitle || !bookDesc) { alert('Enter title and description first'); return; }
    const ai = getAi();
    if (!ai) { alert('Gemini API key missing'); return; }
    setSuggesting(true);
    try {
      const resp = await ai.models.generateContent({
        model: MODELS.FLASH,
        config: { responseMimeType: 'application/json' },
        contents: `Analyze the book "${bookTitle}" with description "${bookDesc}". Return JSON: { "genres": ["Genre1", "Genre2", "Genre3"] }`,
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

  const handleUploadBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !selectedAuthorId) {
      alert('Please select a PDF and an author');
      return;
    }
    if (!googleAccessToken) {
      alert('Google Drive access token expired. Please sign out and sign in again.');
      await signIn();
      return;
    }
    setUploading(true);
    try {
      const pdfUrl = await uploadPdfToDrive(pdfFile, googleAccessToken);
      const finalCoverUrl = coverUrl || `https://picsum.photos/seed/${encodeURIComponent(bookTitle)}/600/900`;
      const author = authors.find(a => a.id === selectedAuthorId);

      await addDoc(collection(db, 'books'), {
        title: bookTitle,
        description: bookDesc,
        category: bookCategory,
        genres,
        averageRating: 0,
        reviewsCount: 0,
        authorId: selectedAuthorId,
        authorName: author?.name ?? 'Unknown',
        pdfUrl,
        coverUrl: finalCoverUrl,
        createdAt: serverTimestamp(),
      });

      setBookTitle(''); setBookDesc(''); setBookCategory('');
      setGenres([]); setPdfFile(null); setCoverUrl(''); setSelectedAuthorId('');
      alert('Book published successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.message ?? 'Upload failed');
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
        photoUrl: authorPhoto || null,
      });
      setAuthorName(''); setAuthorBio(''); setAuthorPhoto('');
      alert('Author created!');
    } catch (err) {
      console.error(err);
      alert('Error creating author');
    } finally {
      setUploading(false);
    }
  };

  const seedTestData = async () => {
    setUploading(true);
    try {
      const ai = getAi();
      if (!ai) { alert('Gemini API key missing'); setUploading(false); return; }

      const booksToSeed = [
        { title: 'The Future of AI: Obsidian Horizons', author: 'Dr. Elara Vance', category: 'Technology', genres: ['AI', 'Future', 'Ethics'] },
        { title: 'Fundamental Principles of High-Energy Physics', author: 'Prof. Julian Thorne', category: 'Science', genres: ['Physics', 'Quantum', 'Theory'] },
        { title: 'The History of Art: From Caves to Canvas', author: 'Amara Night', category: 'Arts', genres: ['Art', 'History', 'Culture'] },
      ];

      for (const b of booksToSeed) {
        const resp = await ai.models.generateContent({
          model: MODELS.FLASH,
          config: { responseMimeType: 'application/json' },
          contents: `Generate a 'bio' for author ${b.author} and a 'summary' for "${b.title}". Return JSON: { "bio": "...", "summary": "..." }`,
        });
        const data = JSON.parse(resp.text);
        const authorRef = await addDoc(collection(db, 'authors'), {
          name: b.author,
          bio: data.bio,
          photoUrl: `https://picsum.photos/seed/${b.author.replace(/ /g, '')}/400/400`,
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
          createdAt: serverTimestamp(),
        });
      }
      alert('Vault initialized with 3 test volumes.');
    } catch (err) {
      console.error(err);
      alert('Initialization failed.');
    } finally {
      setUploading(false);
    }
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto min-h-screen">
      <header className="mb-12">
        <h1 className="text-3xl font-bold font-display tracking-tight mb-2">Internal Controls</h1>
        <p className="text-zinc-500 text-sm">Curate and manage the Libra digital repository.</p>
      </header>

      <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
        {(['book', 'author'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
              activeTab === tab ? 'bg-neon-purple text-white shadow-lg' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab === 'book' ? <BookPlus className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span className="text-sm font-bold uppercase tracking-widest">
              {tab === 'book' ? 'New Book' : 'New Author'}
            </span>
          </button>
        ))}
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
                  required value={bookTitle} onChange={e => setBookTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="The Art of Obsidian"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Author</label>
                <select
                  required value={selectedAuthorId} onChange={e => setSelectedAuthorId(e.target.value)}
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
                  required value={bookCategory} onChange={e => setBookCategory(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="Design / Philosophy"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cover Image URL <span className="text-zinc-600 normal-case font-normal">(optional)</span></label>
                <input
                  value={coverUrl} onChange={e => setCoverUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="https://... (auto-generated if blank)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
              <textarea
                required value={bookDesc} onChange={e => setBookDesc(e.target.value)} rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                placeholder="A brief summary of the book..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Genres & Tags</label>
                <button
                  type="button" onClick={suggestGenres} disabled={suggesting}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-neon-purple hover:text-white transition-colors disabled:opacity-50"
                >
                  {suggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Suggest
                </button>
              </div>
              <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-white/10 rounded-xl min-h-[50px]">
                <AnimatePresence>
                  {genres.map(tag => (
                    <motion.span
                      key={tag}
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded text-xs font-medium"
                    >
                      {tag}
                      <button type="button" onClick={() => setGenres(prev => prev.filter(t => t !== tag))}>
                        <CloseIcon className="w-3 h-3 hover:text-white" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
                <input
                  onKeyDown={addTag} placeholder="Type tag and press Enter..."
                  className="flex-1 bg-transparent outline-none text-xs min-w-[150px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">PDF File</label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
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
                      <Upload className="w-10 h-10 text-zinc-600" />
                      <p className="text-sm text-zinc-400">Drag & drop PDF, or click to select</p>
                      <p className="text-xs text-zinc-600">Uploaded to Google Drive</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={uploading}
              className="w-full py-4 rounded-2xl bg-neon-purple text-white font-bold uppercase tracking-widest shadow-lg shadow-neon-purple/20 hover:shadow-neon-purple/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {uploading ? 'Uploading to Drive...' : 'Publish to Libra'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateAuthor} className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Display Name</label>
                <input
                  required value={authorName} onChange={e => setAuthorName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="Leonardo da Vinci"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Photo URL <span className="text-zinc-600 normal-case font-normal">(optional)</span></label>
                <input
                  value={authorPhoto} onChange={e => setAuthorPhoto(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Author Bio</label>
              <textarea
                required value={authorBio} onChange={e => setAuthorBio(e.target.value)} rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-purple/50"
                placeholder="A visionary who explored the intersection of..."
              />
            </div>
            <button
              disabled={uploading}
              className="w-full py-4 rounded-2xl bg-neon-purple text-white font-bold uppercase tracking-widest shadow-lg shadow-neon-purple/20 hover:shadow-neon-purple/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {uploading ? 'Saving...' : 'Register Author'}
            </button>
          </form>
        )}
      </motion.div>

      <div className="mt-12 p-8 glass rounded-3xl border-dashed border-white/5 text-center">
        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-600 mb-4">Database Custodian</h2>
        <p className="text-xs text-zinc-500 mb-8 max-w-sm mx-auto">
          Populate the repository with initial test data using Obsidian AI.
        </p>
        <button
          onClick={seedTestData} disabled={uploading}
          className="px-8 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-zinc-400 hover:text-white disabled:opacity-50"
        >
          {uploading ? 'Generating...' : 'Initialize Test Data'}
        </button>
      </div>
    </div>
  );
}
