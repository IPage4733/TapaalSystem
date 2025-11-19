// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContextType, AuthUser, LoginCredentials } from "../types/User";
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getStoredAuthUser,
  setStoredAuthUser,
  removeStoredAuthUser,
} from "../services/authService";
import { mockUsers } from "../data/mockUsers";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

const OFFICER_BY_EMAIL_BASE = "https://hejfy9cx00.execute-api.ap-southeast-1.amazonaws.com/dev/officer";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
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
    // quick bootstrap
    setIsLoading(false);
  }, []);



const fetchOfficerByUrl = async (url: string) => {
  try {
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text().catch(() => '');
    let json;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { ok: res.ok, status: res.status, json, text };
  } catch (err) {
    console.error('[auth] network error fetching', url, err);
    return { ok: false, status: 0, json: null, text: '' };
  }
};

const login = async (credentials: LoginCredentials): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
  setIsLoading(true);
  const emailRaw = credentials.email.trim();
  const emailEncoded = encodeURIComponent(emailRaw);

  // Try raw email path first (because your backend expects raw @)
  const tryUrls = [
    `${OFFICER_BY_EMAIL_BASE}/${emailRaw}`,      // raw: .../sanjay.vro@example.com
    `${OFFICER_BY_EMAIL_BASE}/${emailEncoded}`   // encoded: .../sanjay.vro%40example.com
  ];

  for (const url of tryUrls) {
    const { ok, status, json, text } = await fetchOfficerByUrl(url);

    // If 404, try next fallback
    if (status === 404) {
      console.warn(`[auth] ${url} returned 404, trying next fallback.`);
      continue;
    }

    if (!ok) {
      // non-404 error — return a helpful message (or try next)
      console.error(`[auth] ${url} returned status ${status} body:`, text);
      // if it's a 500 or network 0, surface a server error to user
      if (status >= 500 || status === 0) {
        setIsLoading(false);
        return { success: false, error: 'Server error while authenticating. Try again later.' };
      }
      // otherwise, continue to next URL
      continue;
    }

    // ok === true -> parse officer from response
    // Response might be { success: true, officer: {...} } or direct officer object
    const payload = json ?? null;
    const officer = payload?.officer ?? payload;

    if (!officer || !officer.email) {
      setIsLoading(false);
      return { success: false, error: 'Invalid response from server' };
    }

    // Temporary client-side password check (dev-only)
    if (officer.password !== credentials.password) {
      setIsLoading(false);
      return { success: false, error: 'Incorrect password' };
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
    setAuthToken('FAKE_TOKEN'); // placeholder until server issues real token
    setIsLoading(false);
    return { success: true, user: authUser };
  }

  // If we reach here, both attempts failed (404 or other non-ok)
  setIsLoading(false);
  return { success: false, error: 'Email not found or server did not return user' };
};

  const clientSideMatch = async (credentials: LoginCredentials) => {
    // in-repo mock data
    const found = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === credentials.email.toLowerCase() &&
        u.password === credentials.password
    );

    if (!found) {
      setIsLoading(false);
      return {
        success: false,
        error: "Invalid email or password (local mock)",
      };
    }

    const authUser: AuthUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      department: found.department,
      phoneNumber: found.phoneNumber,
    };

    setUser(authUser);
    setStoredAuthUser(JSON.stringify(authUser));
    setIsLoading(false);
    return { success: true, user: authUser };
  };

  const logout = () => {
    setUser(null);
    removeAuthToken();
    removeStoredAuthUser();
  };

  // helper to normalize role strings from backend to your canonical roles
  const normalizeRole = (roleStr?: string): string => {
    if (!roleStr) return "clerk";
    const r = roleStr.toLowerCase();
    if (r.includes("collector")) return "collector";
    if (r.includes("tahsildar")) return "tahsildar";
    if (r.includes("naib")) return "naib_tahsildar";
    if (r.includes("revenue inspector") || r.includes("ri")) return "ri";
    if (r.includes("village revenue officer") || r.includes("vro"))
      return "vro";
    if (
      r.includes("co-officer") ||
      r.includes("co officer") ||
      r.includes("co_officer")
    )
      return "co_officer";
    if (r.includes("dro")) return "dro";
    if (r.includes("rdo")) return "rdo";
    if (r.includes("clerk")) return "clerk";
    return "clerk";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
