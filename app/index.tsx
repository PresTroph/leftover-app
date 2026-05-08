'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
	initRevenueCat,
	purchaseWeeklySubscription,
	restorePurchases
} from '@/src/services/revenuecat';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width - 48; // Match padding

const SLIDES = [
	{ id: '1', titleKey: 'knowWhatsLeft', descriptionKey: 'knowWhatsLeftDesc', icon: '💰' },
	{ id: '2', titleKey: 'addExpensesIn3Taps', descriptionKey: 'addExpensesIn3TapsDesc', icon: '⚡' },
	{ id: '3', titleKey: 'stayInControl', descriptionKey: 'stayInControlDesc', icon: '📈' },
];

const SLIDE_AUTO_ADVANCE_MS = 3000;
const DEV_MODE = Platform.OS === 'web';

export default function OnboardingScreen() {
	const router = useRouter();
	const { colors } = useTheme();
	const { t } = useLanguage();
	const { isAuthenticated, isLoading: authLoading, loginWithRevenueCat, loginWithEmail, signUpWithEmail } = useAuth();
	const [currentIndex, setCurrentIndex] = useState(0);
	const flatListRef = useRef<FlatList>(null);
	const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [authError, setAuthError] = useState('');
	const hasRedirected = useRef(false);
	const [showPromoInput, setShowPromoInput] = useState(false);
	const [promoCode, setPromoCode] = useState('');
	const [promoError, setPromoError] = useState('');
	const [promoLoading, setPromoLoading] = useState(false);

	// Dev login state
	const [showDevLogin, setShowDevLogin] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSignUp, setIsSignUp] = useState(false);

	// Initialize RevenueCat
	useEffect(() => {
		initRevenueCat().catch(() => {});
	}, []);

	// Already authenticated → straight to dashboard
	useEffect(() => {
		if (!authLoading && isAuthenticated && !hasRedirected.current) {
			hasRedirected.current = true;
			router.replace('/(tabs)/dashboard');
		}
	}, [isAuthenticated, authLoading]);

	// Carousel auto-advance with FlatList
	useEffect(() => {
		if (showDevLogin || authLoading || isAuthenticated) return;
		if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
		autoAdvanceTimerRef.current = setTimeout(() => {
			const nextIndex = currentIndex < SLIDES.length - 1 ? currentIndex + 1 : 0;
			setCurrentIndex(nextIndex);
			flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
		}, SLIDE_AUTO_ADVANCE_MS);
		return () => {
			if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
		};
	}, [currentIndex, showDevLogin, authLoading, isAuthenticated]);

	// Track visible slide
	const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
		if (viewableItems.length > 0 && viewableItems[0].index !== null) {
			setCurrentIndex(viewableItems[0].index);
		}
	}).current;

	const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

	// ── THE MAIN FLOW ──
	const handleTryForFree = async () => {
		if (DEV_MODE) {
			setShowDevLogin(true);
			return;
		}

		setIsPurchasing(true);
		setAuthError('');

		try {
			const revenueCatUserId = await purchaseWeeklySubscription();

			if (!revenueCatUserId) {
				setIsPurchasing(false);
				return;
			}

			await loginWithRevenueCat(revenueCatUserId);
			router.replace('/(tabs)/dashboard');
		} catch (err: unknown) {
			console.error('[Onboarding] Error:', err);
			setAuthError('Something went wrong. Please try again.');
			setIsPurchasing(false);
		}
	};

	const handleContinue = async () => {
		// Returning user flow — check if still subscribed
		setIsPurchasing(true);
		setAuthError('');

		try {
			// First try restore
			const revenueCatUserId = await restorePurchases();
			if (revenueCatUserId) {
				await loginWithRevenueCat(revenueCatUserId);
				router.replace('/(tabs)/dashboard');
				return;
			}

			// Not subscribed — purchase without trial
			const purchasedUserId = await purchaseWeeklySubscription();
			if (purchasedUserId) {
				await loginWithRevenueCat(purchasedUserId);
				router.replace('/(tabs)/dashboard');
			} else {
				setAuthError('Subscription required to continue.');
			}
		} catch {
			setAuthError('Could not restore. Please try again.');
		} finally {
			setIsPurchasing(false);
		}
	};

	const handleRestore = async () => {
		setIsPurchasing(true);
		setAuthError('');
		try {
			const revenueCatUserId = await restorePurchases();
			if (revenueCatUserId) {
				await loginWithRevenueCat(revenueCatUserId);
				router.replace('/(tabs)/dashboard');
			} else {
				setAuthError('No previous purchase found.');
			}
		} catch {
			setAuthError('Could not restore purchases.');
		} finally {
			setIsPurchasing(false);
		}
	};

	const handlePromoCode = async () => {
    if (!promoCode.trim()) {
        setPromoError('Enter a promo code');
        return;
    }
    setPromoLoading(true);
    setPromoError('');
    try {
        const { signInAnonymously } = await import('firebase/auth');
        const { auth } = await import('@/src/config/firebase');
        const cred = await signInAnonymously(auth);
        const userId = cred.user.uid;

        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/src/config/firebase');
        
        const snap = await getDocs(collection(db, 'promoCodes'));
        let foundPromo = null;
        
        snap.forEach((doc) => {
            const data = doc.data();
            if (data.code === promoCode.trim().toUpperCase() && data.active === true && data.currentUses < data.maxUses) {
                foundPromo = { id: doc.id, ...data };
            }
        });

        if (!foundPromo) {
            setPromoError('Invalid or expired code');
            setPromoLoading(false);
            return;
        }

        await loginWithRevenueCat(userId);
        router.replace('/(tabs)/dashboard');
    } catch (err: any) {
        console.error('[Promo] Error:', err);
        setPromoError(err?.message || err?.code || 'Something went wrong. Try again.');
    } finally {
        setPromoLoading(false);
    }
};

	// Dev auth (web only)
	const handleDevAuth = async () => {
		if (!email.trim() || !password.trim()) {
			setAuthError('Please fill in email and password');
			return;
		}
		setAuthError('');
		try {
			if (isSignUp) {
				await signUpWithEmail(email.trim(), password);
			} else {
				await loginWithEmail(email.trim(), password);
			}
		} catch (err: unknown) {
			setAuthError(err instanceof Error ? err.message : 'Authentication failed');
		}
	};

	// Loading states
	if (authLoading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="large" color={colors.accent} />
			</View>
		);
	}

	if (isAuthenticated) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="large" color={colors.accent} />
			</View>
		);
	}

	// Render slide item
	const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
		<View style={styles.slide}>
			<Text style={styles.slideIcon}>{item.icon}</Text>
			<Text style={[styles.slideTitle, { color: colors.primaryText }]}>
				{t[item.titleKey as keyof typeof t] || item.titleKey}
			</Text>
			<Text style={[styles.slideDescription, { color: colors.secondaryText }]}>
				{t[item.descriptionKey as keyof typeof t] || item.descriptionKey}
			</Text>
		</View>
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<LinearGradient
				colors={[`${colors.gradientStart}15`, `${colors.gradientEnd}08`, 'transparent']}
				style={styles.topGlow}
				start={{ x: 0.5, y: 0 }}
				end={{ x: 0.5, y: 1 }}
			/>

			<SafeAreaView style={styles.safeArea}>
				<View style={styles.titleContainer}>
					<Text style={[styles.appTitle, { color: colors.primaryText }]}>LEFTOVER</Text>
					<Text style={[styles.appSubtitle, { color: colors.secondaryText }]}>
						The lazy budget app for Gen-Z.
					</Text>
				</View>

				{!showDevLogin && (
					<View style={styles.carouselContainer}>
						<View style={[styles.carouselCard, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
							<FlatList
								ref={flatListRef}
								data={SLIDES}
								renderItem={renderSlide}
								keyExtractor={(item) => item.id}
								horizontal
								pagingEnabled
								showsHorizontalScrollIndicator={false}
								snapToInterval={SLIDE_WIDTH}
								snapToAlignment="center"
								decelerationRate="fast"
								onViewableItemsChanged={onViewableItemsChanged}
								viewabilityConfig={viewabilityConfig}
								getItemLayout={(_, index) => ({
									length: SLIDE_WIDTH,
									offset: SLIDE_WIDTH * index,
									index,
								})}
								style={styles.carousel}
							/>
						</View>

						<View style={styles.dotsContainer}>
							{SLIDES.map((_, index: number) => (
								<View
									key={index}
									style={[
										styles.dot,
										index === currentIndex
											? { backgroundColor: colors.primaryText, width: 8 }
											: { backgroundColor: colors.tertiaryText, width: 6 },
									]}
								/>
							))}
						</View>
					</View>
				)}

				{showDevLogin && (
					<View style={styles.devLoginContainer}>
						<Text style={[styles.devLoginTitle, { color: colors.primaryText }]}>
							{isSignUp ? 'Create Account' : 'Sign In'}
						</Text>
						<Text style={[styles.devLoginSubtitle, { color: colors.secondaryText }]}>
							{isSignUp ? 'Create an account to get started' : 'Sign in to access your budget'}
						</Text>

						{authError ? (
							<View style={[styles.errorBox, { backgroundColor: colors.dangerMuted }]}>
								<Text style={[styles.errorText, { color: colors.danger }]}>{authError}</Text>
							</View>
						) : null}

						<TextInput
							style={[styles.devInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]}
							placeholder="Email"
							placeholderTextColor={colors.tertiaryText}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							value={email}
							onChangeText={setEmail}
						/>
						<TextInput
							style={[styles.devInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.primaryText }]}
							placeholder="Password"
							placeholderTextColor={colors.tertiaryText}
							secureTextEntry
							autoCapitalize="none"
							value={password}
							onChangeText={setPassword}
						/>

						<TouchableOpacity
							style={[styles.devAuthButton, { backgroundColor: colors.accent }]}
							onPress={handleDevAuth}
							disabled={authLoading}
							activeOpacity={0.85}
						>
							{authLoading ? (
								<ActivityIndicator color={colors.buttonText} />
							) : (
								<Text style={[styles.devAuthButtonText, { color: colors.buttonText }]}>
									{isSignUp ? 'Create Account' : 'Sign In'}
								</Text>
							)}
						</TouchableOpacity>

						<TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
							<Text style={[styles.devSwitchText, { color: colors.accent }]}>
								{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
							</Text>
						</TouchableOpacity>

						<TouchableOpacity onPress={() => setShowDevLogin(false)} style={styles.devBackButton}>
							<Text style={[styles.devBackText, { color: colors.secondaryText }]}>← Back</Text>
						</TouchableOpacity>
					</View>
				)}

				<View style={styles.bottomSection}>
					{!showDevLogin && (
						<>
							{authError ? (
								<Text style={[styles.errorTextSmall, { color: colors.danger }]}>{authError}</Text>
							) : null}

							<Text style={[styles.noPayment, { color: colors.primaryText }]}>
								{t.noPaymentDueNow}
							</Text>

							<TouchableOpacity
								style={styles.tryButton}
								onPress={handleTryForFree}
								activeOpacity={0.85}
								disabled={isPurchasing}
							>
								<LinearGradient
									colors={[colors.gradientStart, colors.gradientEnd]}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
									style={styles.tryButtonGradient}
								>
									{isPurchasing ? (
										<ActivityIndicator color={colors.buttonText} />
									) : (
										<>
											<Text style={[styles.tryButtonText, { color: colors.buttonText }]}>
												{t.tryForFree}
											</Text>
											<View style={styles.tryButtonArrow}>
												<Text style={[styles.tryButtonArrowText, { color: colors.buttonText }]}>›</Text>
											</View>
										</>
									)}
								</LinearGradient>
							</TouchableOpacity>

							<Text style={[styles.pricingText, { color: colors.primaryText }]}>
								{t.threeDaysFree}, then $2.99/week
							</Text>

							<View style={styles.legalRow}>
								<TouchableOpacity onPress={handleRestore}>
									<Text style={[styles.legalText, {color: colors.primaryText }]}>{t.restorePurchase}</Text>
								</TouchableOpacity>
								<TouchableOpacity>
									<Text style={[styles.legalText, { color: colors.primaryText }]}>{t.termsOfUse}</Text>
								</TouchableOpacity>
								<TouchableOpacity>
									<Text style={[styles.legalText, { color: colors.primaryText }]}>{t.privacyPolicy}</Text>
								</TouchableOpacity>
							</View>
							{!showPromoInput ? (
    <TouchableOpacity onPress={() => setShowPromoInput(true)} style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textDecorationLine: 'underline', color: colors.primaryText }}>Have a code?</Text>
    </TouchableOpacity>
) : (
    <View style={{ marginTop: 12, alignItems: 'center', gap: 8, width: '100%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, overflow: 'hidden', width: '100%', backgroundColor: colors.inputBg, borderColor: colors.inputBorder }}>
            <TextInput
                style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '600', color: colors.primaryText }}
                placeholder="Enter promo code"
                placeholderTextColor={colors.tertiaryText}
                autoCapitalize="characters"
                autoCorrect={false}
                value={promoCode}
                onChangeText={setPromoCode}
            />
            <TouchableOpacity
                style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.accent }}
                onPress={handlePromoCode}
                disabled={promoLoading}
            >
                {promoLoading ? (
                    <ActivityIndicator color={colors.buttonText} size="small" />
                ) : (
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.buttonText }}>Redeem</Text>
                )}
            </TouchableOpacity>
        </View>
        {promoError ? <Text style={{ fontSize: 12, fontWeight: '500', color: colors.danger }}>{promoError}</Text> : null}
        <TouchableOpacity onPress={() => { setShowPromoInput(false); setPromoError(''); }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.secondaryText }}>Cancel</Text>
        </TouchableOpacity>
    </View>
)}
					</>
					)}
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
	safeArea: { flex: 1, justifyContent: 'space-between' },
	titleContainer: { alignItems: 'center', paddingTop: 20 },
	appTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 6 },
	appSubtitle: { fontSize: 14, marginTop: 6, fontWeight: '500' },
	carouselContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
	carouselCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', height: 320 },
	carousel: { flex: 1 },
	slide: { width: Dimensions.get('window').width - 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
	slideIcon: { fontSize: 56, marginBottom: 20 },
	slideTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12, letterSpacing: -0.3 },
	slideDescription: { fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 8 },
	dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 },
	dot: { height: 6, borderRadius: 3 },
	devLoginContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 12 },
	devLoginTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
	devLoginSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
	errorBox: { padding: 12, borderRadius: 10, marginBottom: 4 },
	errorText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
	errorTextSmall: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginBottom: 8 },
	devInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
	devAuthButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 4 },
	devAuthButtonText: { fontSize: 16, fontWeight: '700' },
	devSwitchText: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 8 },
	devBackButton: { marginTop: 16, alignItems: 'center' },
	devBackText: { fontSize: 14, fontWeight: '500' },
	bottomSection: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
	noPayment: { fontSize: 14, fontWeight: '700', marginBottom: 16 },
	tryButton: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
	tryButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
	tryButtonText: { fontSize: 17, fontWeight: '700' },
	tryButtonArrow: { position: 'absolute', right: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
	tryButtonArrowText: { fontSize: 20, fontWeight: '700' },
	pricingText: { fontSize: 13, fontWeight: '700', marginBottom: 16 },
	legalRow: { flexDirection: 'row', gap: 20 },
	legalText: { fontSize: 11, fontWeight: '700' },
});