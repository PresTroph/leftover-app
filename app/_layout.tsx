'use client';

import { AuthProvider } from '@/src/context/AuthContext';
import { BudgetProvider } from '@/src/context/BudgetContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BudgetProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'fade',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="income-setup" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="constants-setup" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="savings-setup" options={{ animation: 'slide_from_right' }} />
              </Stack>
            </BudgetProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}