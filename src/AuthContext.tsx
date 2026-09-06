"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import * as api from "./api";
import { onAuthStateChanged } from "firebase/auth";
import { isFirebaseConfigured, requireAuth, requireFirestore } from "./firebase";

export type User = { id: string; email: string; name: string | null; photoURL: string | null };

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
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const auth = requireAuth();
    const db = requireFirestore();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setUser({ id: u.uid, email: u.email || "", name: u.displayName || null, photoURL: u.photoURL || null });
      try {
        // Membership of the admins collection is the only source of truth. Never infer admin
        // rights from the email address: signup is public, so an address can be claimed.
        const adminSnap = await getDoc(doc(db, "admins", u.uid));
        setIsAdmin(adminSnap.exists());
      } catch {
        // Fail closed — a failed check is not a pass.
        setIsAdmin(false);
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
