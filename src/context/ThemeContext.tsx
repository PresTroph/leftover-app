import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface ThemeColors {
  background: string;
  surface: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  warning: string;
  danger: string;
  border: string;
  cardBackground: string;
}

const lightTheme: ThemeColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  primaryText: '#000000',
  secondaryText: '#64748b',
  accent: '#22d3ee',
  warning: '#facc15',
  danger: '#f87171',
  border: 'rgba(0, 0, 0, 0.1)',
  cardBackground: 'rgba(0, 0, 0, 0.05)',
};

const darkTheme: ThemeColors = {
  background: '#000000',
  surface: '#0f172a',
  primaryText: '#ffffff',
  secondaryText: '#94a3b8',
  accent: '#22d3ee',
  warning: '#facc15',
  danger: '#f87171',
  border: 'rgba(255, 255, 255, 0.1)',
  cardBackground: 'rgba(255, 255, 255, 0.05)',
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const colors = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
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