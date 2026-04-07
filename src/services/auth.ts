// ============================================================
// LEFTOVER - Auth Service
// Sign in with Apple / Google + RevenueCat subscription
// ============================================================
//
// INSTALL DEPENDENCIES:
//   npx expo install expo-apple-authentication
//   npx expo install @react-native-google-signin/google-signin
//   npm install react-native-purchases  (RevenueCat)
//
// SETUP:
// 1. Apple: Enable "Sign in with Apple" in your Apple Developer account
//    and in your Expo app.json under ios.usesAppleSignIn
// 2. Google: Get OAuth client ID from Firebase Console → Auth → Google
// 3. RevenueCat: Create account at https://www.revenuecat.com
//    - Add your app (iOS + Android)
//    - Create an entitlement called "pro"
//    - Create an offering with your $2.99/week product
//    - Copy your public API keys
//
// ============================================================

import {
    User as FirebaseUser,
    GoogleAuthProvider,
    OAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithCredential,
} from 'firebase/auth';

import { auth } from '../config/firebase';
import { createUser, getUser } from './firestore';

// ─── TYPES ──────────────────────────────────────────────────

export interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  subscriptionActive: boolean;
}

// ─── SIGN IN WITH APPLE ─────────────────────────────────────
// 
// In your component, use expo-apple-authentication to get the
// credential, then pass it here.
//
// Example in component:
//
// import * as AppleAuthentication from 'expo-apple-authentication';
//
// const credential = await AppleAuthentication.signInAsync({
//   requestedScopes: [
//     AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
//     AppleAuthentication.AppleAuthenticationScope.EMAIL,
//   ],
// });
//
// await signInWithApple(credential.identityToken, credential.fullName);

export async function signInWithApple(
  identityToken: string | null,
  fullName?: { givenName: string | null; familyName: string | null } | null
): Promise<FirebaseUser> {
  if (!identityToken) throw new Error('No identity token from Apple');

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: identityToken,
  });

  const result = await signInWithCredential(auth, credential);
  const firebaseUser = result.user;

  // Check if this is a new user — create their Firestore doc
  const existingUser = await getUser(firebaseUser.uid);
  if (!existingUser) {
    const name = fullName
      ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
      : firebaseUser.displayName || 'User';

    await createUser(firebaseUser.uid, {
      email: firebaseUser.email || '',
      name,
    });
  }

  return firebaseUser;
}

// ─── SIGN IN WITH GOOGLE ────────────────────────────────────
//
// In your component, use @react-native-google-signin to get
// the idToken, then pass it here.
//
// Example in component:
//
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
//
// GoogleSignin.configure({ webClientId: 'YOUR_WEB_CLIENT_ID' });
// await GoogleSignin.hasPlayServices();
// const { idToken } = await GoogleSignin.signIn();
// await signInWithGoogle(idToken);

export async function signInWithGoogle(idToken: string): Promise<FirebaseUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const firebaseUser = result.user;

  // Check if new user
  const existingUser = await getUser(firebaseUser.uid);
  if (!existingUser) {
    await createUser(firebaseUser.uid, {
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'User',
    });
  }

  return firebaseUser;
}

// ─── SIGN OUT ───────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ─── AUTH STATE LISTENER ────────────────────────────────────

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── REVENUECAT INTEGRATION ─────────────────────────────────
//
// RevenueCat handles:
// - 3-day free trial
// - $2.99/week subscription
// - Receipt validation
// - Cross-platform subscription status
//
// Initialize in your app's root:
//
// import Purchases from 'react-native-purchases';
//
// // In _layout.tsx or App.tsx:
// Purchases.configure({
//   apiKey: Platform.OS === 'ios'
//     ? 'YOUR_REVENUECAT_IOS_KEY'
//     : 'YOUR_REVENUECAT_ANDROID_KEY',
// });
//
// // After auth, identify the user:
// await Purchases.logIn(firebaseUser.uid);

/**
 * Check if user has active subscription or is in trial.
 * Call this after RevenueCat is initialized.
 */
export async function checkSubscriptionStatus(): Promise<{
  isActive: boolean;
  isTrial: boolean;
  expirationDate: string | null;
}> {
  try {
    // Import dynamically to avoid issues if not installed yet
    const Purchases = require('react-native-purchases').default;
    const customerInfo = await Purchases.getCustomerInfo();

    const entitlement = customerInfo.entitlements.active['pro'];

    return {
      isActive: !!entitlement,
      isTrial: entitlement?.periodType === 'TRIAL',
      expirationDate: entitlement?.expirationDate || null,
    };
  } catch {
    // RevenueCat not set up yet — default to trial
    return { isActive: true, isTrial: true, expirationDate: null };
  }
}

/**
 * Present the paywall. Call this before auth flow.
 * Returns true if user started trial/subscribed.
 */
export async function presentPaywall(): Promise<boolean> {
  try {
    const Purchases = require('react-native-purchases').default;
    const offerings = await Purchases.getOfferings();

    if (offerings.current) {
      // The actual paywall UI is built in your React Native component.
      // This just returns the package info for you to display.
      const weeklyPackage = offerings.current.availablePackages.find(
        (pkg: any) => pkg.packageType === 'WEEKLY'
      );

      if (weeklyPackage) {
        // Purchase is handled in the component:
        // await Purchases.purchasePackage(weeklyPackage);
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
