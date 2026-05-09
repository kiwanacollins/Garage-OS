'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthResponse, AuthUser } from '@/lib/api';
import { apiRequest } from '@/lib/api';

type Credentials = {
  email: string;
  password: string;
};

type Registration = Credentials & {
  name: string;
  phone?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login(credentials: Credentials): Promise<void>;
  register(input: Registration): Promise<void>;
  refresh(): Promise<void>;
  logout(): void;
};

const ACCESS_TOKEN_KEY = 'garageos.accessToken';
const REFRESH_TOKEN_KEY = 'garageos.refreshToken';
const AuthContext = createContext<AuthContextValue | null>(null);

function storeSession(session: AuthResponse) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((session: AuthResponse) => {
    storeSession(session);
    setUser(session.user);
    setAccessToken(session.accessToken);
  }, []);

  async function login(credentials: Credentials) {
    const session = await apiRequest<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    applySession(session);
  }

  async function register(input: Registration) {
    const session = await apiRequest<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    applySession(session);
  }

  const logout = useCallback(() => {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setAccessToken(null);
  }, []);

  const refresh = useCallback(async () => {
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      setLoading(false);
      return;
    }

    const session = await apiRequest<AuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    applySession(session);
  }, [applySession]);

  useEffect(() => {
    setAccessToken(window.localStorage.getItem(ACCESS_TOKEN_KEY));
    refresh().catch(logout).finally(() => setLoading(false));
  }, [logout, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      refresh().catch(logout);
    }, 14 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [logout, refresh]);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return value;
}
