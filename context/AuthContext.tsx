import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { clearSessionStorage, getStoredSession, saveSession } from "@/lib/auth-storage";
import { AuthUser, LoginResponse } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const session = await getStoredSession();
        if (!active) return;
        setUser(session.user);
        setToken(session.token);
        setRefreshToken(session.refreshToken);
      } finally {
        if (active) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const data = await apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password
      })
    });

    if (!data.user?.isAdmin) {
      throw new Error("Access denied. Admin account required.");
    }

    await saveSession(data.token, data.refreshToken, data.user);
    setUser(data.user);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
  }

  async function logout() {
    await clearSessionStorage();
    setUser(null);
    setToken(null);
    setRefreshToken(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      refreshToken,
      isBootstrapping,
      isAuthenticated: Boolean(token && user?.isAdmin),
      login,
      logout
    }),
    [isBootstrapping, refreshToken, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
