// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

const LOGIN_API = "https://guxwtk0to9.execute-api.ap-southeast-1.amazonaws.com/dev/login";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = getStoredAuthUser();
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // bootstrap loading done
    setIsLoading(false);
  }, []);

  /** LOGIN FUNCTION */
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

      const text = await response.text();
      let json: any = null;

      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!response.ok) {
        setIsLoading(false);
        return {
          success: false,
          error:
            response.status === 401
              ? "Invalid email or password"
              : "Server error while authenticating",
        };
      }

      if (!json?.success || !json?.officer) {
        setIsLoading(false);
        return { success: false, error: "Invalid response from server" };
      }

      const officer = json.officer;

      const authUser: AuthUser = {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: normalizeRole(officer.role),
        department: officer.department,
        phoneNumber: officer.phone || officer.phoneNumber,
      };

      // save user
      setUser(authUser);
      setStoredAuthUser(JSON.stringify(authUser));

      // save token (placeholder until API returns real token)
      setAuthToken("FAKE_TOKEN");

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

  /** LOGOUT FUNCTION */
  const logout = () => {
    setUser(null);
    removeAuthToken();
    removeStoredAuthUser();
  };

  /** ROLE NORMALIZER */
  const normalizeRole = (roleStr?: string): string => {
    if (!roleStr) return "clerk";
    const r = roleStr.toLowerCase();

    if (r.includes("collector")) return "collector";
    if (r.includes("tahsildar")) return "tahsildar";
    if (r.includes("naib")) return "naib_tahsildar";
    if (r.includes("revenue inspector") || r.includes("ri")) return "ri";
    if (r.includes("village revenue officer") || r.includes("vro")) return "vro";
    if (r.includes("co-officer") || r.includes("co officer")) return "co_officer";
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
