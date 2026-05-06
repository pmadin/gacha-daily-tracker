'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthUser } from '../_lib/api';
import { getToken, setToken, clearToken, getStoredUser, setStoredUser } from '../_lib/storage';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTokenState(getToken());
    setUser(getStoredUser());
    setIsLoading(false);
  }, []);

  const login = useCallback((t: string, u: AuthUser) => {
    setToken(t);
    setStoredUser(u);
    setTokenState(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
