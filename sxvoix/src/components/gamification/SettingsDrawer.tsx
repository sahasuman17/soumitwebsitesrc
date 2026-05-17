import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Palette, Bot, Shield, LogOut, 
  Moon, Sun, Coffee, EyeOff, RefreshCw, 
  Download, Trash2, Edit2, CheckCircle2,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../context/GamificationContext';
import { getPrestigeData } from '../../services/gamificationService';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { user, logout } = useAuth();
  const { stats, updateProfile, updatePrefs } = useGamification();
  const [displayName, setDisplayName] = useState(stats?.displayName || '');
  const [subject, setSubject] = useState(stats?.subject || '');
  const [photoURL, setPhotoURL] = useState(stats?.photoURL || '');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const prestige = stats ? getPrestigeData(stats.xp) : null;

  useEffect(() => {
    if (stats) {
      setDisplayName(stats.displayName);
      setSubject(stats.subject || '');
      setPhotoURL(stats.photoURL || '');
    }
  }, [stats]);

  // Theme Sync
  useEffect(() => {
    const savedTheme = localStorage.getItem('sxvoix-theme') || stats?.preferences?.theme || 'midnight';
    applyTheme(savedTheme as any);
  }, [stats?.preferences?.theme]);

  const applyTheme = (theme: 'midnight' | 'parchment' | 'daylight') => {
    document.body.classList.remove('theme-parchment', 'theme-daylight');
    if (theme === 'parchment') document.body.classList.add('theme-parchment');
    if (theme === 'daylight') document.body.classList.add('theme-daylight');
    localStorage.setItem('sxvoix-theme', theme);
  };

  const handleUpdateTheme = async (theme: 'midnight' | 'parchment' | 'daylight') => {
    applyTheme(theme);
    if (stats?.preferences) {
      await updatePrefs({ ...stats.preferences, theme });
    } else {
      await updatePrefs({
        theme,
        aiAssistant: true,
        focusMode: false,
        syncProgress: true
      });
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    await updateProfile({ displayName, subject, photoURL });
    setIsSaving(false);
    setIsEditingAvatar(false);
  };

  const handleTogglePreference = async (key: 'aiAssistant' | 'focusMode' | 'syncProgress') => {
    if (!stats?.preferences) return;
    const newPrefs = { ...stats.preferences, [key]: !stats.preferences[key] };
    await updatePrefs(newPrefs);
  };

  const exportData = () => {
    const data = JSON.stringify({ stats, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sxvoix-reading-data-${user?.uid}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[110] w-full max-w-md glass bg-black/40 backdrop-blur-2xl border-l border-white/10 overflow-y-auto"
          >
            <div className="p-6 md:p-8 space-y-10">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-display tracking-tight">Command Center</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Profile Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-zinc-500">
                  <User className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Profile & Identity</span>
                </div>

                <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-white/5 border border-white/5">
                  <div className="relative group">
                    <img 
                      src={photoURL || 'https://picsum.photos/seed/user/200'} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full border-2 border-neon-purple shadow-[0_0_20px_rgba(168,85,247,0.3)] object-cover"
                    />
                    <button 
                      onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  {isEditingAvatar && (
                    <div className="w-full space-y-2">
                       <input
                        type="text"
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        placeholder="Avatar URL"
                        className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-sm focus:border-neon-purple outline-none"
                      />
                    </div>
                  )}

                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Scholar Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-sm focus:border-neon-purple outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Field of Research</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Theoretical Physics"
                        className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-sm focus:border-neon-purple outline-none"
                      />
                    </div>
                    
                    {prestige && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-neon-purple/10 border border-neon-purple/20">
                        <prestige.rank.icon className="w-5 h-5 text-neon-purple" />
                        <div>
                          <div className="text-[10px] font-bold text-neon-purple uppercase tracking-tighter">Academic Rank</div>
                          <div className="text-sm font-bold text-white">{prestige.title}</div>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isSaving}
                      className="w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                      {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Synchronize Identity
                    </button>
                  </div>
                </div>
              </section>

              {/* Theme Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Palette className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Atmosphere</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'midnight', label: 'Obsidian', icon: Moon, color: 'bg-zinc-900' },
                    { id: 'parchment', label: 'Parchment', icon: Coffee, color: 'bg-[#f4ecd8]' },
                    { id: 'daylight', label: 'Daylight', icon: Sun, color: 'bg-white' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleUpdateTheme(t.id as any)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                        (stats?.preferences?.theme || 'midnight') === t.id 
                          ? 'bg-neon-purple/10 border-neon-purple text-neon-purple' 
                          : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center border border-black/10`}>
                        <t.icon className={`w-4 h-4 ${t.id === 'midnight' ? 'text-white' : 'text-zinc-800'}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-tighter">{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* AI & Preferences */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Bot className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">App Preferences</span>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'aiAssistant', label: 'AI Scholarly Assistant', icon: Bot, desc: 'Auto-summarize books on entry' },
                    { id: 'focusMode', label: 'Hyper-Focus Mode', icon: EyeOff, desc: 'Hide UI during reading' },
                    { id: 'syncProgress', label: 'Temporal Sync', icon: BookMarked, desc: 'Sync progress across devices' }
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <pref.icon className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white leading-none">{pref.label}</div>
                          <div className="text-[10px] text-zinc-500 mt-1">{pref.desc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTogglePreference(pref.id as any)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          stats?.preferences?.[pref.id as keyof typeof stats.preferences] ? 'bg-neon-purple' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${
                          stats?.preferences?.[pref.id as keyof typeof stats.preferences] ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Security & Data */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Security & Data</span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Authenticated Email</div>
                    <div className="text-sm font-medium text-white opacity-80">{user?.email}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={exportData}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-white hover:bg-white/10 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-bold uppercase text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Stats
                    </button>
                  </div>
                </div>
              </section>

              {/* Footer / Sign Out */}
              <div className="pt-6 border-t border-white/10">
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-500 font-bold uppercase text-sm tracking-[0.2em] hover:bg-red-500/20 transition-all border border-red-500/20"
                >
                  <LogOut className="w-5 h-5" />
                  Terminate Session
                </button>
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="w-full max-w-sm glass p-8 rounded-[2rem] border border-red-500/30 text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-display">Irreversible Action</h3>
                    <p className="text-sm text-zinc-400">
                      Are you sure you want to purge your academic statistics? This will reset your XP, level, and earned trophies permanently.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full py-3 rounded-xl bg-red-500 text-white font-bold uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    >
                      Confirm Purge
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full py-3 rounded-xl bg-white/5 text-zinc-400 font-bold uppercase text-xs tracking-widest hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
