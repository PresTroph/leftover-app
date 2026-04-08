import React, { createContext, ReactNode, useContext, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundDeep: string;
  surface: string;
  surfaceElevated: string;

  // Text
  primaryText: string;
  secondaryText: string;
  tertiaryText: string;

  // Accent
  accent: string;
  accentMuted: string;
  gradientStart: string;
  gradientEnd: string;

  // Semantic
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  success: string;
  successMuted: string;

  // Glass
  glassBg: string;
  glassBgLight: string;
  glassBgAccent: string;
  glassBorder: string;
  glassBorderLight: string;

  // Components
  cardBackground: string;
  border: string;
  divider: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
  inputBorder: string;

  // Misc
  overlay: string;
  buttonText: string;
}

const darkTheme: ThemeColors = {
  background: '#050a18',
  backgroundDeep: '#020510',
  surface: '#0c1224',
  surfaceElevated: '#111a32',

  primaryText: '#f1f5f9',
  secondaryText: 'rgba(148,163,184,0.7)',
  tertiaryText: 'rgba(148,163,184,0.4)',

  accent: '#22d3ee',
  accentMuted: 'rgba(34,211,238,0.15)',
  gradientStart: '#22d3ee',
  gradientEnd: '#a855f7',

  warning: '#f59e0b',
  warningMuted: 'rgba(245,158,11,0.15)',
  danger: '#f87171',
  dangerMuted: 'rgba(248,113,113,0.12)',
  success: '#10b981',
  successMuted: 'rgba(16,185,129,0.15)',

  glassBg: 'rgba(255,255,255,0.04)',
  glassBgLight: 'rgba(255,255,255,0.06)',
  glassBgAccent: 'rgba(34,211,238,0.06)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBorderLight: 'rgba(255,255,255,0.12)',

  cardBackground: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.04)',
  tabBar: '#050a18',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.1)',

  overlay: 'rgba(0,0,0,0.85)',
  buttonText: '#050a18',
};

const lightTheme: ThemeColors = {
  background: '#f8fafc',
  backgroundDeep: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',

  primaryText: '#0f172a',
  secondaryText: 'rgba(71,85,105,0.8)',
  tertiaryText: 'rgba(100,116,139,0.5)',

  accent: '#0891b2',
  accentMuted: 'rgba(8,145,178,0.1)',
  gradientStart: '#06b6d4',
  gradientEnd: '#8b5cf6',

  warning: '#d97706',
  warningMuted: 'rgba(217,119,6,0.1)',
  danger: '#ef4444',
  dangerMuted: 'rgba(239,68,68,0.08)',
  success: '#059669',
  successMuted: 'rgba(5,150,105,0.1)',

  glassBg: 'rgba(255,255,255,0.7)',
  glassBgLight: 'rgba(255,255,255,0.85)',
  glassBgAccent: 'rgba(8,145,178,0.05)',
  glassBorder: 'rgba(0,0,0,0.06)',
  glassBorderLight: 'rgba(0,0,0,0.1)',

  cardBackground: '#ffffff',
  border: 'rgba(0,0,0,0.08)',
  divider: 'rgba(0,0,0,0.05)',
  tabBar: '#ffffff',
  tabBarBorder: 'rgba(0,0,0,0.06)',
  inputBg: '#f1f5f9',
  inputBorder: 'rgba(0,0,0,0.1)',

  overlay: 'rgba(0,0,0,0.5)',
  buttonText: '#ffffff',
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
  mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const colors = isDarkMode ? darkTheme : lightTheme;
  const mode: ThemeMode = isDarkMode ? 'dark' : 'light';

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors, mode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
