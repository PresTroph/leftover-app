'use client';

import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { BudgetProvider, useBudget } from '@/src/context/BudgetContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AuthBudgetBridge({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { setUser } = useBudget();

  useEffect(() => {
    setUser(user);
  }, [user]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BudgetProvider>
              <AuthBudgetBridge>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                </Stack>
              </AuthBudgetBridge>
            </BudgetProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}