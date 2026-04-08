'use client';

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tertiaryText,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t.dashboard,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-expense"
        options={{
          title: t.addExpense,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: focused ? colors.accent : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -4,
            }}>
              <Ionicons
                name="add"
                size={22}
                color={focused ? colors.buttonText : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="financial-setup"
        options={{
          title: t.financialSetup,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
