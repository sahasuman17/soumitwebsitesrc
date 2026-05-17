import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Sparkles } from 'lucide-react';

export default function Login() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";
  const message = (location.state as any)?.message;

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="pt-20 min-h-screen flex items-center justify-center px-6">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/10 blur-[120px] rounded-full opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md p-8 glass-card border-neon-purple/20 text-center space-y-8"
      >
        <div className="space-y-4">
          <div className="w-16 h-16 bg-neon-purple/20 rounded-2xl flex items-center justify-center mx-auto border border-neon-purple/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Sparkles className="w-8 h-8 text-neon-purple" />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Access the <span className="neon-text">Vault</span></h1>
          <p className="text-zinc-500 text-sm italic">
            {message || "Sign in to access our elite repository of digital wisdom and high-caliber insights."}
          </p>
        </div>

        <button
          onClick={signIn}
          className="w-full py-4 rounded-xl bg-neon-purple text-white font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <LogIn className="w-5 h-5" />
          Authenticate with Google
        </button>

        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">
          Obsidian-grade security enabled
        </p>
      </motion.div>
    </div>
  );
}
