// ============================================================
// LEFTOVER - Enhanced Auth Context
// Real Firebase Auth + Sign in with Apple/Google
// ============================================================

'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

import {
    User as FirebaseUser,
    GoogleAuthProvider,
    OAuthProvider,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
} from 'firebase/auth';

import { auth } from '../config/firebase';
import * as FirestoreService from '../services/firestore';
import { User } from '../types';

// ─── TYPES ──────────────────────────────────────────────────

export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  firebaseUser: FirebaseUser | null;
  user: User | null;

  // Email/Password (existing flow from Haiku)
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Apple/Google (new)
  signInWithApple: (identityToken: string, fullName?: { givenName: string | null; familyName: string | null } | null) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;

  // User management
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

// ─── CONTEXT ────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | null>(null);

// ─── PROVIDER ───────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Listen for auth state changes ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Load or create user doc from Firestore
        try {
          let userData = await FirestoreService.getUser(fbUser.uid);

          if (!userData) {
            // First time — create user doc
            await FirestoreService.createUser(fbUser.uid, {
              email: fbUser.email || '',
              name: fbUser.displayName || '',
            });
            userData = await FirestoreService.getUser(fbUser.uid);
          }

          setUser(userData);
        } catch (err) {
          console.error('Failed to load user data:', err);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // ── Email/Password Sign In ──
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setIsLoading(false);
      throw new Error(err.message || 'Sign in failed');
    }
  }, []);

  // ── Email/Password Sign Up ──
  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Create Firestore user doc
      await FirestoreService.createUser(result.user.uid, {
        email: result.user.email || '',
        name: result.user.displayName || '',
      });
    } catch (err: any) {
      setIsLoading(false);
      throw new Error(err.message || 'Sign up failed');
    }
  }, []);

  // ── Sign Out ──
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  // ── Sign In with Apple ──
  const handleSignInWithApple = useCallback(async (
    identityToken: string,
    fullName?: { givenName: string | null; familyName: string | null } | null
  ) => {
    setIsLoading(true);
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: identityToken });
      const result = await signInWithCredential(auth, credential);

      // Check if new user
      const existingUser = await FirestoreService.getUser(result.user.uid);
      if (!existingUser) {
        const name = fullName
          ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
          : result.user.displayName || 'User';

        await FirestoreService.createUser(result.user.uid, {
          email: result.user.email || '',
          name,
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      throw new Error(err.message || 'Apple sign in failed');
    }
  }, []);

  // ── Sign In with Google ──
  const handleSignInWithGoogle = useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);

      const existingUser = await FirestoreService.getUser(result.user.uid);
      if (!existingUser) {
        await FirestoreService.createUser(result.user.uid, {
          email: result.user.email || '',
          name: result.user.displayName || 'User',
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      throw new Error(err.message || 'Google sign in failed');
    }
  }, []);

  // ── Update User Profile ──
  const updateUserProfile = useCallback(async (data: Partial<User>) => {
    if (!firebaseUser?.uid) return;
    await FirestoreService.updateUser(firebaseUser.uid, data);
    const updated = await FirestoreService.getUser(firebaseUser.uid);
    setUser(updated);
  }, [firebaseUser?.uid]);

  // ── Value ──
  const value: AuthContextType = {
    isAuthenticated: !!firebaseUser,
    isLoading,
    firebaseUser,
    user,
    signIn,
    signUp,
    signOut,
    signInWithApple: handleSignInWithApple,
    signInWithGoogle: handleSignInWithGoogle,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── HOOK ──

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
