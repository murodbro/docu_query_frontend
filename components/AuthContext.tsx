'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
  getToken,
  getStoredUser,
} from '@/lib/auth';



interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          // Try to get stored user first for instant loading
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
          // Then verify with API
          const freshUser = await getMe();
          setUser(freshUser);
        } catch {
          // Token is invalid, clear it
          apiLogout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await apiLogin(email, password);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    // Register then login
    await apiRegister(email, password, name);
    const loggedInUser = await apiLogin(email, password);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
