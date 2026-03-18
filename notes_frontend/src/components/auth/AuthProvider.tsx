"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest, ApiError } from "@/lib/apiClient";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/lib/authStorage";
import { usePathname, useRouter } from "next/navigation";

export type AuthUser = {
  id: string;
  email: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATH_PREFIXES = ["/auth", "/"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

function mapError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }: { children: React.ReactNode }) {
  /** Provides authentication state + actions to the entire app. */
  const router = useRouter();
  const pathname = usePathname();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    router.replace("/");
  }, [router]);

  const refreshMe = useCallback(async () => {
    const t = token ?? getStoredToken();
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const me = await apiRequest<AuthUser>("/auth/me", { token: t });
      setUser(me);
    } catch {
      // Token invalid/expired -> logout
      clearStoredToken();
      setToken(null);
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    // Initialize token from storage on first load
    const stored = getStoredToken();
    setToken(stored);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    void refreshMe();
  }, [token, refreshMe]);

  useEffect(() => {
    // Simple client-side protection: if user navigates to protected routes without token, redirect.
    if (isLoading) return;
    if (isPublicPath(pathname)) return;

    const t = token ?? getStoredToken();
    if (!t) {
      router.replace("/auth/login");
    }
  }, [isLoading, pathname, router, token]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const res = await apiRequest<{ token: string; user?: AuthUser }>(
          "/auth/login",
          {
            method: "POST",
            body: { email, password },
          }
        );
        setStoredToken(res.token);
        setToken(res.token);
        if (res.user) setUser(res.user);
        router.replace("/app");
      } catch (e) {
        setError(mapError(e));
        throw e;
      }
    },
    [router]
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const res = await apiRequest<{ token: string; user?: AuthUser }>(
          "/auth/signup",
          {
            method: "POST",
            body: { email, password },
          }
        );
        setStoredToken(res.token);
        setToken(res.token);
        if (res.user) setUser(res.user);
        router.replace("/app");
      } catch (e) {
        setError(mapError(e));
        throw e;
      }
    },
    [router]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      error,
      login,
      signup,
      logout,
      refreshMe,
    }),
    [token, user, isLoading, error, login, signup, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth(): AuthContextValue {
  /** Hook to access auth state + actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider />");
  }
  return ctx;
}
