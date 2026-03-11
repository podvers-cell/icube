"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import * as api from "./api";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth, firestore } from "./firebase";

export type User = { id: string; email: string; name: string | null; photoURL: string | null };

const ADMIN_EMAIL = "admin@icube.ae";

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      if (!u) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setUser({ id: u.uid, email: u.email || "", name: u.displayName || null, photoURL: u.photoURL || null });
      try {
        const emailIsAdmin = (u.email || "").trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const adminSnap = await getDoc(doc(firestore, "admins", u.uid));
        setIsAdmin(emailIsAdmin || adminSnap.exists());
      } catch {
        const emailIsAdmin = (u.email || "").trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setIsAdmin(emailIsAdmin);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
