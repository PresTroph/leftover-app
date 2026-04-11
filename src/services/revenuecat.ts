// ============================================================
// LEFTOVER - RevenueCat Service
// Combined auth + subscription in one Face ID confirmation
// ============================================================

import { Platform } from 'react-native';

const REVENUECAT_API_KEY = 'appl_poPXHFmryHmGwljLnScocJdahkO';
const ENTITLEMENT_ID = 'Leftover Pro';

let isConfigured = false;
let PurchasesModule: any = null;

/**
 * Initialize RevenueCat SDK.
 */
export async function initRevenueCat(): Promise<void> {
	if (isConfigured || Platform.OS === 'web') return;

	try {
		PurchasesModule = require('react-native-purchases').default;
		const { LOG_LEVEL } = require('react-native-purchases');

		PurchasesModule.setLogLevel(LOG_LEVEL.DEBUG);
		await PurchasesModule.configure({ apiKey: REVENUECAT_API_KEY });
		isConfigured = true;
		console.log('[RevenueCat] Initialized');
	} catch (err) {
		console.warn('[RevenueCat] Init failed:', err);
	}
}

/**
 * Get the current RevenueCat anonymous user ID.
 */
export async function getRevenueCatUserId(): Promise<string | null> {
	if (!isConfigured || !PurchasesModule) return null;
	try {
		const info = await PurchasesModule.getCustomerInfo();
		return info.originalAppUserId || null;
	} catch {
		return null;
	}
}

/**
 * Purchase the weekly subscription.
 * This is the ONE action that handles everything:
 * - Apple presents the subscription sheet
 * - User confirms with Face ID
 * - RevenueCat creates/identifies the user
 * - Subscription is active
 * Returns the RevenueCat user ID if successful, null if cancelled.
 */
export async function purchaseWeeklySubscription(): Promise<string | null> {
	if (!isConfigured || !PurchasesModule) return null;

	try {
		// Get the weekly package
		const offerings = await PurchasesModule.getOfferings();
		if (!offerings?.current) {
			console.warn('[RevenueCat] No current offering');
			return null;
		}

		const weekly = offerings.current.weekly ||
			offerings.current.availablePackages?.find(
				(p: any) => p.packageType === 'WEEKLY' || p.identifier === '$rc_weekly'
			);

		if (!weekly) {
			console.warn('[RevenueCat] No weekly package found');
			return null;
		}

		// Purchase - this shows the Apple subscription sheet with Face ID
		// ONE popup, ONE Face ID confirmation - subscription + auth in one step
		const { customerInfo } = await PurchasesModule.purchasePackage(weekly);

		const isActive = customerInfo.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
		console.log('[RevenueCat] Purchase complete, active:', isActive);

		// Return the user ID - this becomes their identity in the app
		return customerInfo.originalAppUserId || null;
	} catch (err: any) {
		if (err?.userCancelled) {
			console.log('[RevenueCat] User cancelled');
			return null;
		}
		console.error('[RevenueCat] Purchase error:', err);
		return null;
	}
}

/**
 * Check if user has active subscription.
 */
export async function checkSubscription(): Promise<boolean> {
	if (Platform.OS === 'web') return true;
	if (!isConfigured || !PurchasesModule) return false;

	try {
		const info = await PurchasesModule.getCustomerInfo();
		return info.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
	} catch {
		return false;
	}
}

/**
 * Restore previous purchases.
 */
export async function restorePurchases(): Promise<string | null> {
	if (!isConfigured || !PurchasesModule) return null;

	try {
		const info = await PurchasesModule.restorePurchases();
		const isActive = info.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
		if (isActive) {
			return info.originalAppUserId || null;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Logout from RevenueCat.
 */
export async function logoutRevenueCat(): Promise<void> {
	if (!isConfigured || !PurchasesModule) return;
	try {
		await PurchasesModule.logOut();
	} catch { /* silently fail */ }
}
