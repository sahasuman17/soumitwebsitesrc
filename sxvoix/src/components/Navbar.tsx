import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Book as BookIcon, Users, User, LayoutDashboard, LogOut, LogIn, ShieldCheck, Trophy, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import SettingsDrawer from './gamification/SettingsDrawer';

export default function Navbar() {
  const { user, signIn, logout, isAdmin } = useAuth();
  const { stats } = useGamification();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/library', label: 'Library', icon: BookIcon },
    { to: '/authors', label: 'Authors', icon: Users },
    { to: '/leaderboard', label: 'Elite', icon: Trophy },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-4 glass bg-black/40 backdrop-blur-xl border-b border-white/5">
        <NavLink to="/" className="flex items-center gap-2 group shrink-0">
          <div className="p-2 rounded-lg bg-neon-purple/20 group-hover:bg-neon-purple/30 transition-colors">
            <BookIcon className="w-6 h-6 text-neon-purple" />
          </div>
          <span className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            SXVOIX
          </span>
        </NavLink>

        <div className="flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 md:gap-8 px-2 md:px-0">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative px-1 md:px-3 py-1 flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-neon-purple' : 'text-zinc-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 md:hidden" />
                  <span className="hidden md:inline">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] bg-neon-purple shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 md:gap-6">
              {isAdmin && (
                <NavLink to="/admin" className="flex items-center text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors" title="Admin">
                  <ShieldCheck className="w-4 h-4 md:hidden text-neon-purple animate-pulse" />
                  <span className="hidden sm:inline">Admin</span>
                </NavLink>
              )}
              <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-white/10">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white leading-none capitalize">{stats?.displayName || user.displayName || 'Sophist'}</span>
                  <span className="text-[8px] text-zinc-500 tracking-tighter uppercase">{isAdmin ? 'Custodian' : 'Member'}</span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="relative group ring-2 ring-transparent hover:ring-neon-purple rounded-full p-0.5 transition-all"
                >
                  <img src={stats?.photoURL || user.photoURL || ''} alt="" className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-white/10" />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Settings className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-neon-purple text-white hover:bg-neon-purple/90 transition-all font-medium text-sm shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </nav>

      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
