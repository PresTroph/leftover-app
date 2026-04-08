'use client';

import React, {
    ReactNode,
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
import { User } from '../types';

// Inline Firestore user functions to avoid circular deps
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

function now(): string {
  return new Date().toISOString();
}

async function getFirestoreUser(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
}

async function createFirestoreUser(userId: string, data: Partial<User>): Promise<void> {
  const user = {
    email: data.email || '',
    name: data.name || '',
    language: data.language || 'en',
    darkMode: true,
    currency: 'USD',
    resetDay: 1,
    resetFrequency: 'monthly',
    notifications: {
      threeDaysBeforeReset: true,
      onResetDay: true,
      autoReset: false,
      paydayCountdown: true,
    },
    subscription: {
      status: 'trial',
      trialStartDate: now(),
      trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: null,
      revenueCatId: null,
    },
    createdAt: now(),
    updatedAt: now(),
  };
  await setDoc(doc(db, 'users', userId), user);
}

async function updateFirestoreUser(userId: string, data: Partial<User>): Promise<void> {
  const { updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'users', userId), { ...data, updatedAt: now() });
}

// ─── TYPES ──────────────────────────────────────────────────

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  firebaseUser: FirebaseUser | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithApple: (identityToken: string, fullName?: { givenName: string | null; familyName: string | null } | null) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          let userData = await getFirestoreUser(fbUser.uid);
          if (!userData) {
            await createFirestoreUser(fbUser.uid, {
              email: fbUser.email || '',
              name: fbUser.displayName || '',
            });
            userData = await getFirestoreUser(fbUser.uid);
          }
          setUser(userData);
        } catch (err: unknown) {
          console.error('Failed to load user data:', err);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Sign in failed';
      throw new Error(message);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createFirestoreUser(result.user.uid, {
        email: result.user.email || '',
        name: result.user.displayName || '',
      });
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Sign up failed';
      throw new Error(message);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const handleSignInWithApple = useCallback(async (
    identityToken: string,
    fullName?: { givenName: string | null; familyName: string | null } | null
  ) => {
    setIsLoading(true);
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: identityToken });
      const result = await signInWithCredential(auth, credential);
      const existingUser = await getFirestoreUser(result.user.uid);
      if (!existingUser) {
        const name = fullName
          ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
          : result.user.displayName || 'User';
        await createFirestoreUser(result.user.uid, {
          email: result.user.email || '',
          name,
        });
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Apple sign in failed';
      throw new Error(message);
    }
  }, []);

  const handleSignInWithGoogle = useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      const existingUser = await getFirestoreUser(result.user.uid);
      if (!existingUser) {
        await createFirestoreUser(result.user.uid, {
          email: result.user.email || '',
          name: result.user.displayName || 'User',
        });
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Google sign in failed';
      throw new Error(message);
    }
  }, []);

  const updateUserProfile = useCallback(async (data: Partial<User>) => {
    if (!firebaseUser?.uid) return;
    await updateFirestoreUser(firebaseUser.uid, data);
    const updated = await getFirestoreUser(firebaseUser.uid);
    setUser(updated);
  }, [firebaseUser?.uid]);

  const value: AuthContextType = {
    isAuthenticated: !!firebaseUser,
    isLoading,
    firebaseUser,
    user,
    signIn,
    signUp,
    signOut: handleSignOut,
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
