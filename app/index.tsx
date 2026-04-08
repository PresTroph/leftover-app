'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
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

const SLIDE_AUTO_ADVANCE_MS = 3000; // slightly faster

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If already authenticated, skip onboarding
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      const nextIndex = currentIndex < SLIDES.length - 1 ? currentIndex + 1 : 0;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, SLIDE_AUTO_ADVANCE_MS);
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [currentIndex]);

  const handleScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const handleTryForFree = async () => {
    // In production: trigger RevenueCat subscription + Sign in with Apple
    // For now: navigate to dashboard (auth will be handled by the subscription flow)
    // When RevenueCat is wired: the subscription confirmation auto-creates
    // the account via Sign in with Apple's biometric confirmation
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top gradient glow */}
      <LinearGradient
        colors={[`${colors.gradientStart}15`, `${colors.gradientEnd}08`, 'transparent']}
        style={styles.topGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* App Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.appTitle, { color: colors.primaryText }]}>LEFTOVER</Text>
          <Text style={[styles.appSubtitle, { color: colors.secondaryText }]}>
            The lazy budget app for Gen-Z.
          </Text>
        </View>

        {/* Carousel */}
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

          {/* Dot Indicators */}
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

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* No payment due */}
          <Text style={[styles.noPayment, { color: colors.secondaryText }]}>
            {t.noPaymentDueNow}
          </Text>

          {/* Try for Free Button */}
          <TouchableOpacity
            style={styles.tryButton}
            onPress={handleTryForFree}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tryButtonGradient}
            >
              <Text style={[styles.tryButtonText, { color: colors.buttonText }]}>
                {t.tryForFree}
              </Text>
              <View style={styles.tryButtonArrow}>
                <Text style={[styles.tryButtonArrowText, { color: colors.buttonText }]}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Pricing info */}
          <Text style={[styles.pricingText, { color: colors.tertiaryText }]}>
            {t.threeDaysFree}, {t.thenPricePerWeek}
          </Text>

          {/* Legal links */}
          <View style={styles.legalRow}>
            <TouchableOpacity>
              <Text style={[styles.legalText, { color: colors.tertiaryText }]}>{t.termsOfUse}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={[styles.legalText, { color: colors.tertiaryText }]}>{t.restorePurchase}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={[styles.legalText, { color: colors.tertiaryText }]}>{t.privacyPolicy}</Text>
            </TouchableOpacity>
          </View>
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
  carouselCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    height: 320,
  },
  carousel: { flex: 1 },
  slide: {
    width: width - 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  slideIcon: { fontSize: 56, marginBottom: 20 },
  slideTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12, letterSpacing: -0.3 },
  slideDescription: { fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 8 },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  dot: { height: 6, borderRadius: 3 },

  bottomSection: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
  noPayment: { fontSize: 14, fontWeight: '500', marginBottom: 16 },

  tryButton: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  tryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  tryButtonText: { fontSize: 17, fontWeight: '700' },
  tryButtonArrow: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tryButtonArrowText: { fontSize: 20, fontWeight: '700' },

  pricingText: { fontSize: 13, marginBottom: 16 },

  legalRow: { flexDirection: 'row', gap: 20 },
  legalText: { fontSize: 11, fontWeight: '500' },
});
