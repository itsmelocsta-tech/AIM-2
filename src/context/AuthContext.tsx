import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  FirebaseUser,
  onAuthStateChanged,
  signInWithGoogle as fbSignInWithGoogle,
  signInWithEmail as fbSignInWithEmail,
  signUpWithEmail as fbSignUpWithEmail,
  signInAsGuest as fbSignInAsGuest,
  logOut as fbLogOut,
  getIdToken as fbGetIdToken,
} from '../services/firebaseClient';

import { resetVoiceSession } from '../services/voiceService';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<{ user: FirebaseUser | null; error: string | null }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ user: FirebaseUser | null; error: string | null }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ user: FirebaseUser | null; error: string | null }>;
  signInAsGuest: () => Promise<{ user: FirebaseUser | null; error: string | null }>;
  logOut: () => Promise<{ error: string | null }>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let previousUid: string | null | undefined;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (previousUid !== (currentUser?.uid ?? null)) resetVoiceSession();
      previousUid = currentUser?.uid ?? null;
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isGuest: Boolean(user?.isAnonymous),
    signInWithGoogle: fbSignInWithGoogle,
    signInWithEmail: fbSignInWithEmail,
    signUpWithEmail: fbSignUpWithEmail,
    signInAsGuest: fbSignInAsGuest,
    logOut: fbLogOut,
    getIdToken: fbGetIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** Optional context for visual-only components rendered outside an AuthProvider (e.g. SSR/tests). */
export function useOptionalAuth() {
  return useContext(AuthContext);
}
