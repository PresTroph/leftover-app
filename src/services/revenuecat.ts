// ============================================================
// LEFTOVER - RevenueCat Service
// Subscription management via RevenueCat
// ============================================================

import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

// ─── CONFIG ──────────────────────────────────────────────────

const REVENUECAT_API_KEY = 'test_HKJxnBcIkyCkbvvuM0A0idnEezP';
const ENTITLEMENT_ID = 'Leftover Pro';

// ─── INITIALIZATION ──────────────────────────────────────────

let isConfigured = false;

function getPurchases() {
	return require('react-native-purchases').default;
}

/**
 * Initialize RevenueCat SDK. Call once on app startup.
 */
export async function initRevenueCat(appUserId?: string): Promise<void> {
	if (isConfigured) return;

	try {
		if (Platform.OS === 'web') {
			console.log('[RevenueCat] Skipping init on web');
			return;
		}

		const Purchases = require('react-native-purchases').default;
		const { LOG_LEVEL } = require('react-native-purchases');

		Purchases.setLogLevel(LOG_LEVEL.DEBUG);

		await Purchases.configure({
			apiKey: REVENUECAT_API_KEY,
			appUserID: appUserId || undefined,
		});

		isConfigured = true;
		console.log('[RevenueCat] Initialized successfully');
	} catch (err: unknown) {
		console.error('[RevenueCat] Init error:', err);
		// Don't crash the app if RevenueCat fails to init
	}
}

/**
 * Login a user to RevenueCat (link Firebase UID to RevenueCat).
 */
export async function loginRevenueCat(appUserId: string): Promise<void> {
	if (Platform.OS === 'web') return;

	try {
		const Purchases = getPurchases();
		await Purchases.logIn(appUserId);
		console.log('[RevenueCat] Logged in user:', appUserId);
	} catch (err: unknown) {
		console.error('[RevenueCat] Login error:', err);
	}
}

/**
 * Logout from RevenueCat.
 */
export async function logoutRevenueCat(): Promise<void> {
	if (Platform.OS === 'web') return;

	try {
		const Purchases = getPurchases();
		await Purchases.logOut();
		console.log('[RevenueCat] Logged out');
	} catch (err: unknown) {
		console.error('[RevenueCat] Logout error:', err);
	}
}

// ─── ENTITLEMENTS ────────────────────────────────────────────

/**
 * Check if the current user has an active "Leftover Pro" entitlement.
 */
export async function checkSubscription(): Promise<boolean> {
	if (Platform.OS === 'web') return true; // Allow web access for dev

	try {
		const Purchases = getPurchases();
		const customerInfo = await Purchases.getCustomerInfo();
		const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
		console.log('[RevenueCat] Subscription active:', isActive);
		return isActive;
	} catch (err: unknown) {
		console.error('[RevenueCat] Check subscription error:', err);
		return false;
	}
}

/**
 * Get customer info from RevenueCat.
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
	if (Platform.OS === 'web') return null;

	try {
		const Purchases = getPurchases();
		return await Purchases.getCustomerInfo();
	} catch (err: unknown) {
		console.error('[RevenueCat] Get customer info error:', err);
		return null;
	}
}

// ─── OFFERINGS ───────────────────────────────────────────────

/**
 * Get current offerings (subscription packages available).
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
	if (Platform.OS === 'web') return null;

	try {
		const Purchases = getPurchases();
		const offerings = await Purchases.getOfferings();
		if (offerings.current) {
			console.log('[RevenueCat] Current offering:', offerings.current.identifier);
			return offerings.current;
		}
		console.warn('[RevenueCat] No current offering found');
		return null;
	} catch (err: unknown) {
		console.error('[RevenueCat] Get offerings error:', err);
		return null;
	}
}

/**
 * Get the weekly package from the current offering.
 */
export async function getWeeklyPackage(): Promise<PurchasesPackage | null> {
	const offering = await getOfferings();
	if (!offering) return null;

	const weekly = offering.weekly;
	if (weekly) {
		console.log('[RevenueCat] Weekly package:', weekly.product.priceString);
		return weekly;
	}

	// Fallback: look through all packages
	const pkg = offering.availablePackages.find(
		(p) => p.packageType === 'WEEKLY' || p.identifier === '$rc_weekly'
	);

	if (pkg) {
		console.log('[RevenueCat] Found weekly in packages:', pkg.product.priceString);
		return pkg;
	}

	console.warn('[RevenueCat] No weekly package found');
	return null;
}

// ─── PURCHASES ───────────────────────────────────────────────

/**
 * Purchase the weekly subscription.
 * Returns true if purchase was successful, false otherwise.
 */
export async function purchaseWeekly(): Promise<boolean> {
	if (Platform.OS === 'web') return true;

	try {
		const Purchases = getPurchases();
		const pkg = await getWeeklyPackage();
		if (!pkg) {
			console.error('[RevenueCat] No weekly package to purchase');
			return false;
		}

		const { customerInfo } = await Purchases.purchasePackage(pkg);
		const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
		console.log('[RevenueCat] Purchase complete, active:', isActive);
		return isActive;
	} catch (err: unknown) {
		const error = err as { userCancelled?: boolean };
		if (error.userCancelled) {
			console.log('[RevenueCat] User cancelled purchase');
			return false;
		}
		console.error('[RevenueCat] Purchase error:', err);
		return false;
	}
}

/**
 * Restore previous purchases (e.g., user reinstalled app).
 */
export async function restorePurchases(): Promise<boolean> {
	if (Platform.OS === 'web') return true;

	try {
		const Purchases = getPurchases();
		const customerInfo = await Purchases.restorePurchases();
		const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
		console.log('[RevenueCat] Restore complete, active:', isActive);
		return isActive;
	} catch (err: unknown) {
		console.error('[RevenueCat] Restore error:', err);
		return false;
	}
}
