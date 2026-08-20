import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/apiClient';
import { AuthService } from '../api/services';
import { UserProfile } from '../types/models';

const TOKEN_KEY = 'poststreak_auth_token';
const USER_KEY = 'poststreak_auth_user';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, niche: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore a persisted session on boot — same reasoning as apiClient's
  // in-memory-only token: without this, every reload signs the user out.
  useEffect(() => {
    const restore = async () => {
      try {
        const [token, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (token && storedUser) {
          apiClient.setToken(token);
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const persistSession = async (token: string, profile: UserProfile) => {
    apiClient.setToken(token);
    setUser(profile);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(profile)),
    ]);
  };

  const signIn = async (email: string, password: string) => {
    const res = await AuthService.signIn(email, password);
    if (!res.success || !res.data) {
      return { success: false, error: res.error ?? 'Sign in failed' };
    }
    await persistSession(res.data.token, res.data.user);
    return { success: true };
  };

  const signUp = async (name: string, email: string, niche: string) => {
    const res = await AuthService.signUp({ name, email, niche });
    if (!res.success) {
      return { success: false, error: res.error ?? 'Sign up failed' };
    }
    // SignUpScreen collects no password field today, so the backend falls
    // back to a passwordless OTP flow and can't return an immediate
    // session — there's no verification-code UI step to send the user to
    // yet either. Real, named gap, not silently papered over: see
    // AuthContext's signUp doc / PR description.
    if (!res.data?.token) {
      return { success: true, requiresVerification: true };
    }
    await persistSession(res.data.token, res.data.user);
    return { success: true };
  };

  const signOut = async () => {
    apiClient.setToken(null);
    setUser(null);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
