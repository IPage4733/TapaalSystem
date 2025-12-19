// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AuthContextType, AuthUser, LoginCredentials } from "../types/User";

import {
  setAuthToken,
  removeAuthToken,
  getStoredAuthUser,
  setStoredAuthUser,
  removeStoredAuthUser,
} from "../services/authService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

const LOGIN_API =
  "https://guxwtk0to9.execute-api.ap-southeast-1.amazonaws.com/dev/login";

/**
 * 🔥 FINAL ROLE NORMALIZER
 * Handles:
 * - "Joint Collector"
 * - "Co-Officer"
 * - "Naib Tahsildar"
 * - "RI", "VRO", etc.
 */
const normalizeRole = (role: string): string =>
  role
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_"); // space OR hyphen → underscore

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** 🔁 Restore user on page refresh */
  useEffect(() => {
    try {
      const raw = getStoredAuthUser();
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        setUser({
          ...parsed,
          role: normalizeRole(parsed.role), // ✅ normalize on restore
        });
      }
    } catch (err) {
      console.error("[auth] Failed to restore user", err);
      removeStoredAuthUser();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** 🔐 LOGIN — backend is source of truth */
  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await fetch(LOGIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json?.success || !json?.officer) {
        setIsLoading(false);
        return {
          success: false,
          error:
            response.status === 401
              ? "Invalid email or password"
              : "Authentication failed",
        };
      }

      const officer = json.officer;

      const authUser: AuthUser = {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: normalizeRole(officer.role), // ✅ normalize on login
        department: officer.department,
        phoneNumber: officer.phone || officer.phoneNumber,
      };

      setUser(authUser);
      setStoredAuthUser(JSON.stringify(authUser));
      setAuthToken("FAKE_TOKEN"); // replace with JWT later

      setIsLoading(false);
      return { success: true, user: authUser };
    } catch (err) {
      console.error("[auth] Network error:", err);
      setIsLoading(false);
      return {
        success: false,
        error: "Network error. Check your connection.",
      };
    }
  };

  /** 🚪 LOGOUT */
  const logout = () => {
    setUser(null);
    removeAuthToken();
    removeStoredAuthUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};