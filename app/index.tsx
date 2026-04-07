'use client';

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    titleKey: 'knowWhatsLeft',
    descriptionKey: 'knowWhatsLeftDesc',
    icon: '💰',
  },
  {
    id: 2,
    titleKey: 'addExpensesIn3Taps',
    descriptionKey: 'addExpensesIn3TapsDesc',
    icon: '⚡',
  },
  {
    id: 3,
    titleKey: 'stayInControl',
    descriptionKey: 'stayInControlDesc',
    icon: '📈',
  },
];

const SLIDE_AUTO_ADVANCE_MS = 4000;

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance carousel
  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [currentIndex]);

  const startAutoAdvance = () => {
    if (currentIndex < SLIDES.length - 1) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
      }, SLIDE_AUTO_ADVANCE_MS);
    }
  };

  const handleScroll = (event: any) => {
    const newIndex = Math.round((event as any).nativeEvent.contentOffset.x / width);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const handleGetStarted = () => {
    // Go to auth flow — user signs up or logs in
    router.push('/(auth)/signup');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Carousel */}
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
            <Text style={styles.icon}>{slide.icon}</Text>
            <Text style={[styles.title, { color: colors.primaryText }]}>
              {t[slide.titleKey as keyof typeof t] || slide.titleKey}
            </Text>
            <Text style={[styles.description, { color: colors.secondaryText }]}>
              {t[slide.descriptionKey as keyof typeof t] || slide.descriptionKey}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? [styles.dotActive, { backgroundColor: colors.accent }] : [styles.dotInactive, { backgroundColor: colors.secondaryText }],
            ]}
          />
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={handleGetStarted}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: colors.background }]}>
          {t.getStarted}
        </Text>
        <Text style={[styles.buttonArrow, { color: colors.background }]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginLink} onPress={handleLogin}>
        <Text style={[styles.loginLinkText, { color: colors.secondaryText }]}> 
          Already have an account?{' '}
        </Text>
        <Text style={[styles.loginLinkAccent, { color: colors.accent }]}>Sign In</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
  },
  button: {
    marginHorizontal: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonArrow: {
    fontSize: 20,
    marginLeft: 4,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginLinkText: {
    fontSize: 14,
  },
  loginLinkAccent: {
    fontSize: 14,
    fontWeight: '600',
  },
});