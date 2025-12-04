// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  getStoredAuthUser,
  setStoredAuthUser,
  removeStoredAuthUser
} from '../services/authService'; // uses only user storage helpers

// Shape of authenticated user stored in the app
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phoneNumber?: string;
};

export type LoginCredentials = { email: string; password: string };

export type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (creds: LoginCredentials) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/**
 * Configuration — only the login endpoint is required now.
 */
const LOGIN_ENDPOINT = 'https://guxwtk0to9.execute-api.ap-southeast-1.amazonaws.com/dev/login';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = getStoredAuthUser();
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // quick bootstrap from stored user
    setIsLoading(false);
  }, []);

  const looksLikeEmpId = (s: string) => /^emp-\d+$/i.test(s.trim());

  // safe fetch -> returns { ok, status, json, text }
  const fetchJson = async (url: string, opts: RequestInit = {}) => {
    try {
      const res = await fetch(url, opts);
      const text = await res.text().catch(() => '');
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      return { ok: res.ok, status: res.status, json, text };
    } catch (err) {
      console.error('[auth] network error', err);
      return { ok: false, status: 0, json: null, text: '' };
    }
  };

  const normalizeRole = (roleStr?: string): string => {
    if (!roleStr) return 'clerk';
    const r = roleStr.toLowerCase();
    if (r.includes('collector')) return 'collector';
    if (r.includes('tahsildar')) return 'tahsildar';
    if (r.includes('naib')) return 'naib_tahsildar';
    if (r.includes('revenue inspector') || r.includes('ri')) return 'ri';
    if (r.includes('village revenue officer') || r.includes('vro')) return 'vro';
    if (r.includes('co-officer') || r.includes('co officer') || r.includes('co_officer')) return 'co_officer';
    if (r.includes('dro')) return 'dro';
    if (r.includes('rdo')) return 'rdo';
    if (r.includes('clerk')) return 'clerk';
    return 'clerk';
  };

  /**
   * login flow (login API returns officer details):
   * 1) POST /login with { email, password } -> expects { success: true, officer: { ... } }
   * 2) Build AuthUser directly from login response and store it
   */
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    setIsLoading(true);

    // 1) verify credentials with POST /login
    try {
      const loginRes = await fetchJson(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, password: credentials.password })
      });

      if (!loginRes.ok) {
        const msg = loginRes.json?.message ?? loginRes.text ?? `Login failed (${loginRes.status})`;
        setIsLoading(false);
        return { success: false, error: msg };
      }

      const loginData = loginRes.json ?? null;
      if (!loginData || loginData.success !== true) {
        setIsLoading(false);
        return { success: false, error: loginData?.message ?? 'Invalid email or password' };
      }

      // Expect officer object directly in the login response
      const officer = loginData.officer ?? loginData.user ?? null;
      if (!officer || !officer.email) {
        setIsLoading(false);
        return { success: false, error: 'Login succeeded but officer details missing in response' };
      }

      const authUser: AuthUser = {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: normalizeRole(officer.role),
        department: officer.department,
        phoneNumber: officer.phone || officer.phoneNumber
      };

      setUser(authUser);
      setStoredAuthUser(JSON.stringify(authUser));
      setIsLoading(false);
      return { success: true, user: authUser };
    } catch (err) {
      console.error('[auth] login network error', err);
      setIsLoading(false);
      return { success: false, error: 'Network error during login' };
    }
  };

  const logout = () => {
    setUser(null);
    removeStoredAuthUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
