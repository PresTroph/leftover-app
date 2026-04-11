'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
    initRevenueCat,
    purchaseWeeklySubscription,
    restorePurchases,
} from '@/src/services/revenuecat';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
	{ id: 1, titleKey: 'knowWhatsLeft', descriptionKey: 'knowWhatsLeftDesc', icon: '💰' },
	{ id: 2, titleKey: 'addExpensesIn3Taps', descriptionKey: 'addExpensesIn3TapsDesc', icon: '⚡' },
	{ id: 3, titleKey: 'stayInControl', descriptionKey: 'stayInControlDesc', icon: '📈' },
];

const SLIDE_AUTO_ADVANCE_MS = 3000;
const DEV_MODE = Platform.OS === 'web';

export default function OnboardingScreen() {
	const router = useRouter();
	const { colors } = useTheme();
	const { t } = useLanguage();
	const { isAuthenticated, isLoading: authLoading, loginWithRevenueCat, loginWithEmail, signUpWithEmail } = useAuth();
	const [currentIndex, setCurrentIndex] = useState(0);
	const scrollViewRef = useRef<ScrollView>(null);
	const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [authError, setAuthError] = useState('');
	const hasRedirected = useRef(false);

	// Dev login state
	const [showDevLogin, setShowDevLogin] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isSignUp, setIsSignUp] = useState(false);

	// Initialize RevenueCat
	useEffect(() => {
		initRevenueCat().catch(() => {});
	}, []);

	// Already authenticated -> straight to dashboard, no delay, no onboarding
	useEffect(() => {
		if (!authLoading && isAuthenticated && !hasRedirected.current) {
			hasRedirected.current = true;
			router.replace('/(tabs)/dashboard');
		}
	}, [isAuthenticated, authLoading]);

	// Carousel auto-advance
	useEffect(() => {
		if (showDevLogin || authLoading || isAuthenticated) return;
		if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
		autoAdvanceTimerRef.current = setTimeout(() => {
			const nextIndex = currentIndex < SLIDES.length - 1 ? currentIndex + 1 : 0;
			setCurrentIndex(nextIndex);
			scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
		}, SLIDE_AUTO_ADVANCE_MS);
		return () => {
			if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
		};
	}, [currentIndex, showDevLogin, authLoading, isAuthenticated]);

	const handleScroll = (event: any) => {
		const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
		if (newIndex !== currentIndex) setCurrentIndex(newIndex);
	};

	// -- THE MAIN FLOW --
	// One tap -> one Face ID -> dashboard. That's it.
	const handleTryForFree = async () => {
		if (DEV_MODE) {
			setShowDevLogin(true);
			return;
		}

		setIsPurchasing(true);
		setAuthError('');

		try {
			// This ONE call does everything:
			// 1. Shows the Apple subscription sheet (price + free trial + Face ID)
			// 2. User confirms with Face ID (one confirmation)
			// 3. RevenueCat creates the user + activates subscription
			// 4. Returns the user ID
			const revenueCatUserId = await purchaseWeeklySubscription();

			if (!revenueCatUserId) {
				// User cancelled - stay on onboarding
				setIsPurchasing(false);
				return;
			}

			// Save user to Firestore and persist login
			await loginWithRevenueCat(revenueCatUserId);

			// Go to dashboard - never see this screen again
			router.replace('/(tabs)/dashboard');
		} catch (err: unknown) {
			console.error('[Onboarding] Error:', err);
			setAuthError('Something went wrong. Please try again.');
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
			// Auth state change triggers redirect via useEffect
		} catch (err: unknown) {
			setAuthError(err instanceof Error ? err.message : 'Authentication failed');
		}
	};

	// Show loading while checking if already authenticated
	if (authLoading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}> 
				<ActivityIndicator size="large" color={colors.accent} />
			</View>
		);
	}

	// If authenticated, show nothing (redirect is happening)
	if (isAuthenticated) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}> 
				<ActivityIndicator size="large" color={colors.accent} />
			</View>
		);
	}

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
							<ScrollView
								ref={scrollViewRef}
								horizontal
								pagingEnabled
								scrollEventThrottle={16}
								onScroll={handleScroll}
								showsHorizontalScrollIndicator={false}
								style={styles.carousel}
							>
								{SLIDES.map((slide) => (
									<View key={slide.id} style={styles.slide}>
										<Text style={styles.slideIcon}>{slide.icon}</Text>
										<Text style={[styles.slideTitle, { color: colors.primaryText }]}>
											{t[slide.titleKey as keyof typeof t] || slide.titleKey}
										</Text>
										<Text style={[styles.slideDescription, { color: colors.secondaryText }]}>
											{t[slide.descriptionKey as keyof typeof t] || slide.descriptionKey}
										</Text>
									</View>
								))}
							</ScrollView>
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

							<Text style={[styles.noPayment, { color: colors.secondaryText }]}> 
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

							<Text style={[styles.pricingText, { color: colors.tertiaryText }]}> 
								{t.threeDaysFree}, then $2.99/week
							</Text>

							<View style={styles.legalRow}>
								<TouchableOpacity onPress={handleRestore}>
									<Text style={[styles.legalText, { color: colors.tertiaryText }]}>{t.restorePurchase}</Text>
								</TouchableOpacity>
								<TouchableOpacity>
									<Text style={[styles.legalText, { color: colors.tertiaryText }]}>{t.termsOfUse}</Text>
								</TouchableOpacity>
								<TouchableOpacity>
									<Text style={[styles.legalText, { color: colors.tertiaryText }]}>{t.privacyPolicy}</Text>
								</TouchableOpacity>
							</View>
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
	slide: { width: width - 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
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
	noPayment: { fontSize: 14, fontWeight: '500', marginBottom: 16 },
	tryButton: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
	tryButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
	tryButtonText: { fontSize: 17, fontWeight: '700' },
	tryButtonArrow: { position: 'absolute', right: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
	tryButtonArrowText: { fontSize: 20, fontWeight: '700' },
	pricingText: { fontSize: 13, marginBottom: 16 },
	legalRow: { flexDirection: 'row', gap: 20 },
	legalText: { fontSize: 11, fontWeight: '500' },
});
