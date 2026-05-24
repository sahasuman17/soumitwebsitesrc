import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  googleAccessToken: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const ADMIN_WHITELIST = ['sxvoix.storage@gmail.com'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(
    () => sessionStorage.getItem('gat')
  );

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u ? ADMIN_WHITELIST.includes(u.email || '') : false);
      if (!u) {
        setGoogleAccessToken(null);
        sessionStorage.removeItem('gat');
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      const { accessToken } = await signInWithGoogle();
      if (accessToken) {
        setGoogleAccessToken(accessToken);
        sessionStorage.setItem('gat', accessToken);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
      setGoogleAccessToken(null);
      sessionStorage.removeItem('gat');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, googleAccessToken, signIn, logout: logoutUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
