import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot } from 'lucide-react';
import { getAi, MODELS } from '../lib/gemini';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = getAi();
      if (!ai) {
        setMessages(prev => [...prev, { role: 'bot', text: 'Aura Intelligence is currently offline. Please configure the VITE_GEMINI_API_KEY to enable me.' }]);
        setLoading(false);
        return;
      }
      const chat = ai.chats.create({
        model: MODELS.FLASH,
        config: {
            systemInstruction: "You are Aura AI, the high-end digital concierge for the Aura Library. Your tone is sophisticated, intellectual, and helpful. You know about tech, philosophy, and library sciences."
        }
      });
      
      // We'll mimic multi-turn by passing history conceptually or just sending current prompt for simplicity
      // Real multi-turn uses ai.chats.create
      const response = await chat.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'bot', text: response.text }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: 'I apologize, but I am experiencing some technical interference. How else may I assist you?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-96 h-[500px] glass rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-neon-purple/10 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-purple text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display">Aura Intelligence</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active Concierge</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <Sparkles className="w-8 h-8 text-neon-purple/40" />
                  <p className="text-sm text-zinc-500 max-w-[200px]">
                    How may I facilitate your intellectual journey today?
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-neon-purple text-white shadow-lg'
                        : 'bg-white/5 border border-white/10 text-zinc-300'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-black/40 border-t border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enquire something..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 outline-none focus:border-neon-purple/50 transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-purple hover:text-neon-purple/80 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-neon-purple text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center relative group"
      >
        <div className="absolute inset-0 rounded-full bg-neon-purple animate-ping opacity-20" />
        <MessageSquare className="w-7 h-7" />
      </motion.button>
    </div>
  );
}
