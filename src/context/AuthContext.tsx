'use client';

import React, { createContext, useCallback, useState } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    // Firebase will go here
    setIsAuthenticated(true);
    setUser({ email });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    // Firebase will go here
    setIsAuthenticated(true);
    setUser({ email });
  }, []);

  const signOut = useCallback(async () => {
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}