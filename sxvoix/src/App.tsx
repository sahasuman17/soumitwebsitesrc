import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GamificationProvider } from './context/GamificationContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Library from './pages/Library';
import Authors from './pages/Authors';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Leaderboard from './pages/Leaderboard';
import Chatbot from './components/Chatbot';
import { useGamification } from './context/GamificationContext';

function ThemeManager() {
  const { stats } = useGamification();

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('sxvoix-theme') || stats?.preferences?.theme || 'midnight';
    document.body.classList.remove('theme-parchment', 'theme-daylight');
    if (savedTheme === 'parchment') document.body.classList.add('theme-parchment');
    if (savedTheme === 'daylight') document.body.classList.add('theme-daylight');
  }, [stats?.preferences?.theme]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <ThemeManager />
        <BrowserRouter>
          <div className="min-h-screen bg-obsidian text-zinc-100 flex flex-col">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library />} />
              <Route path="/authors" element={<Authors />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="py-12 px-6 border-t border-white/5 bg-black/40">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="text-xl font-bold font-display tracking-tight text-white">
                  SXVOIX <span className="text-neon-purple font-black">.</span>
                </div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                  © 2026 SXVOIX Digital Repository. All rights reserved.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <a href="#" className="hover:text-neon-purple transition-colors">Twitter</a>
                <a href="#" className="hover:text-neon-purple transition-colors">GitHub</a>
                <a href="#" className="hover:text-neon-purple transition-colors">Discord</a>
                <a href="#" className="hover:text-neon-purple transition-colors">Privacy</a>
              </div>
            </div>
          </footer>

          <Chatbot />
        </div>
      </BrowserRouter>
      </GamificationProvider>
    </AuthProvider>
  );
}
