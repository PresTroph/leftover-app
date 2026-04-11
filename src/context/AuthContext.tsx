'use client';

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, {
    createContext,
    ReactNode,
    useCallback, useContext, useEffect, useState,
} from 'react';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { User } from '../types';

// --- CONSTANTS ------------------------------------------------

const AUTH_STORAGE_KEY = 'leftover_auth_user_id';

// --- HELPERS --------------------------------------------------

function now(): string {
	return new Date().toISOString();
}

// Storage that works on both web and native
async function saveUserId(userId: string): Promise<void> {
	try {
		if (Platform.OS === 'web') {
			window.localStorage.setItem(AUTH_STORAGE_KEY, userId);
		} else {
			const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
			await AsyncStorage.setItem(AUTH_STORAGE_KEY, userId);
		}
	} catch { /* silently fail */ }
}

async function getSavedUserId(): Promise<string | null> {
	try {
		if (Platform.OS === 'web') {
			return window.localStorage.getItem(AUTH_STORAGE_KEY);
		} else {
			const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
			return await AsyncStorage.getItem(AUTH_STORAGE_KEY);
		}
	} catch {
		return null;
	}
}

async function clearSavedUserId(): Promise<void> {
	try {
		if (Platform.OS === 'web') {
			window.localStorage.removeItem(AUTH_STORAGE_KEY);
		} else {
			const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
			await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
		}
	} catch { /* silently fail */ }
}

// --- FIRESTORE USER ------------------------------------------

async function getFirestoreUser(userId: string): Promise<User | null> {
	try {
		const snap = await getDoc(doc(db, 'users', userId));
		if (!snap.exists()) return null;
		return { id: snap.id, ...snap.data() } as User;
	} catch {
		return null;
	}
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
			revenueCatId: userId,
		},
		createdAt: now(),
		updatedAt: now(),
	};
	await setDoc(doc(db, 'users', userId), user);
}

async function updateFirestoreUser(userId: string, data: Partial<User>): Promise<void> {
	await updateDoc(doc(db, 'users', userId), { ...data, updatedAt: now() });
}

// --- CONTEXT TYPE --------------------------------------------

export interface AuthContextType {
	isAuthenticated: boolean;
	isLoading: boolean;
	user: User | null;
	userId: string | null;
	loginWithRevenueCat: (revenueCatUserId: string, email?: string, name?: string) => Promise<void>;
	loginWithEmail: (email: string, password: string) => Promise<void>;
	signUpWithEmail: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	updateUserProfile: (data: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// --- PROVIDER -------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// On mount: check if user was previously logged in
	useEffect(() => {
		const restoreSession = async () => {
			try {
				const savedId = await getSavedUserId();
				if (savedId) {
					// Sign in anonymously to Firebase so Firestore rules work
					const { signInAnonymously } = await import('firebase/auth');
					const { auth } = await import('../config/firebase');
					await signInAnonymously(auth);

					const userData = await getFirestoreUser(savedId);
					if (userData) {
						setUserId(savedId);
						setUser(userData);
					}
				}
			} catch (err) {
				console.error('[Auth] Restore session error:', err);
			} finally {
				setIsLoading(false);
			}
		};
		restoreSession();
	}, []);

	// Login via RevenueCat (production - after subscription confirmed)
	const loginWithRevenueCat = useCallback(async (
		revenueCatUserId: string,
		email?: string,
		name?: string
	) => {
		setIsLoading(true);
		try {
			// Sign in anonymously to Firebase so Firestore security rules work
			const { signInAnonymously } = await import('firebase/auth');
			const { auth } = await import('../config/firebase');
			await signInAnonymously(auth);

			let userData = await getFirestoreUser(revenueCatUserId);
			if (!userData) {
				await createFirestoreUser(revenueCatUserId, {
					email: email || '',
					name: name || '',
				});
				userData = await getFirestoreUser(revenueCatUserId);
			}
			setUserId(revenueCatUserId);
			setUser(userData);
			await saveUserId(revenueCatUserId);
		} catch (err) {
			console.error('[Auth] RevenueCat login error:', err);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Login via email (web dev mode only)
	const loginWithEmail = useCallback(async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const { signInWithEmailAndPassword } = await import('firebase/auth');
			const { auth } = await import('../config/firebase');
			const result = await signInWithEmailAndPassword(auth, email, password);
			const uid = result.user.uid;

			let userData = await getFirestoreUser(uid);
			if (!userData) {
				await createFirestoreUser(uid, { email });
				userData = await getFirestoreUser(uid);
			}
			setUserId(uid);
			setUser(userData);
			await saveUserId(uid);
		} catch (err) {
			setIsLoading(false);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Sign up via email (web dev mode only)
	const signUpWithEmail = useCallback(async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const { createUserWithEmailAndPassword } = await import('firebase/auth');
			const { auth } = await import('../config/firebase');
			const result = await createUserWithEmailAndPassword(auth, email, password);
			const uid = result.user.uid;

			await createFirestoreUser(uid, { email });
			const userData = await getFirestoreUser(uid);
			setUserId(uid);
			setUser(userData);
			await saveUserId(uid);
		} catch (err) {
			setIsLoading(false);
			throw err;
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Sign out
	const handleSignOut = useCallback(async () => {
		await clearSavedUserId();
		setUser(null);
		setUserId(null);
		// Also sign out of Firebase if on web
		if (Platform.OS === 'web') {
			try {
				const { signOut: fbSignOut } = await import('firebase/auth');
				const { auth } = await import('../config/firebase');
				await fbSignOut(auth);
			} catch { /* silently fail */ }
		}
	}, []);

	// Update user profile
	const updateUserProfile = useCallback(async (data: Partial<User>) => {
		if (!userId) return;
		await updateFirestoreUser(userId, data);
		const updated = await getFirestoreUser(userId);
		setUser(updated);
	}, [userId]);

	const value: AuthContextType = {
		isAuthenticated: !!userId && !!user,
		isLoading,
		user,
		userId,
		loginWithRevenueCat,
		loginWithEmail,
		signUpWithEmail,
		signOut: handleSignOut,
		updateUserProfile,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within an AuthProvider');
	return context;
}
