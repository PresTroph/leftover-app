
// ============================================================
// LEFTOVER - Tutorial Overlay
// First-launch walkthrough with spotlight tooltips
// Saves completion state to AsyncStorage
// ============================================================

'use client';

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TUTORIAL_KEY = 'leftover_tutorial_completed';

export interface TutorialStep {
  id: string;
  title: string;
  message: string;
  icon: string;
  position: 'top' | 'center' | 'bottom';
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onComplete: () => void;
}

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Check if tutorial was completed before
    let completed = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        completed = window.localStorage.getItem(TUTORIAL_KEY) === 'true';
      }
    } catch {
      completed = false;
    }

    if (!completed) {
      const timer = setTimeout(() => setShowTutorial(true), 1000);
      return () => clearTimeout(timer);
    }
    setIsChecked(true);
  }, []);

  const completeTutorial = () => {
    setShowTutorial(false);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TUTORIAL_KEY, 'true');
      }
    } catch {
      // Silently fail
    }
  };

  const resetTutorial = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TUTORIAL_KEY);
      }
    } catch {
      // Silently fail
    }
  };

  return { showTutorial, completeTutorial, resetTutorial, isChecked };
}

export default function TutorialOverlay({ steps, onComplete }: TutorialOverlayProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Animate step transitions
    fadeAnim.setValue(0.5);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const getTooltipPosition = () => {
    switch (step.position) {
      case 'top':
        return { top: 120 };
      case 'center':
        return { top: SCREEN_HEIGHT * 0.3 };
      case 'bottom':
        return { bottom: 180 };
    }
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Dark backdrop */}
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]} />

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={styles.stepDots}>
          {steps.map((_: TutorialStep, index: number) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                {
                  backgroundColor: index <= currentStep ? colors.accent : 'rgba(255,255,255,0.2)',
                  width: index === currentStep ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: 'rgba(255,255,255,0.5)' }]}>{t.tutorialSkip}</Text>
        </TouchableOpacity>
      </View>

      {/* Tooltip card */}
      <Animated.View
        style={[
          styles.tooltipContainer,
          getTooltipPosition(),
          { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
        ]}
      >
        <View style={[styles.tooltipCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.glassBorderLight }]}>
          <LinearGradient
            colors={[`${colors.gradientStart}15`, `${colors.gradientEnd}08`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Icon */}
          <View style={[styles.tooltipIconCircle, { backgroundColor: colors.accentMuted }]}>
            <Text style={styles.tooltipIcon}>{step.icon}</Text>
          </View>

          {/* Content */}
          <Text style={[styles.tooltipTitle, { color: colors.primaryText }]}>{step.title}</Text>
          <Text style={[styles.tooltipMessage, { color: colors.secondaryText }]}>{step.message}</Text>

          {/* Progress text */}
          <Text style={[styles.progressText, { color: colors.tertiaryText }]}>
            {currentStep + 1} / {steps.length}
          </Text>

          {/* Action button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={[styles.nextButtonText, { color: colors.buttonText }]}>
                {isLastStep ? t.tutorialGotIt : t.tutorialNext}
              </Text>
              {!isLastStep && (
                <Ionicons name="arrow-forward" size={16} color={colors.buttonText} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Step indicator
  stepIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Tooltip
  tooltipContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 10,
  },
  tooltipCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
  },
  tooltipIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tooltipIcon: {
    fontSize: 32,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  tooltipMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },

  // Button
  nextButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
