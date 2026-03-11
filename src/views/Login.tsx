"use client";

import { useState, type FormEvent } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";
import { firebaseAuth } from "../firebase";

const ADMIN_EMAIL = "admin@icube.ae";

function getRedirectFrom(): string {
  if (typeof window === "undefined") return "/dashboard";
  const from = new URLSearchParams(window.location.search).get("from");
  return from || "/dashboard";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const from = getRedirectFrom();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      await login(trimmedEmail, password);
      if (trimmedEmail === ADMIN_EMAIL.toLowerCase()) {
        router.replace(from);
      } else {
        router.replace("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(firebaseAuth, provider);
      const userEmail = cred.user.email?.toLowerCase() ?? "";
      if (userEmail === ADMIN_EMAIL.toLowerCase()) {
        router.replace(from);
      } else {
        router.replace("/");
      }
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        // Silent fail if user closed the popup
      } else {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
      }
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-icube-dark via-black to-icube-gray flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-black/70 border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.75)]">
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-display font-semibold text-white tracking-tight">
              Welcome back
            </h1>
            <Link href="/" className="text-[11px] text-gray-400 hover:text-icube-gold transition-colors">
              Back to site
            </Link>
          </div>
          <p className="text-gray-400 text-xs mb-6">
            Sign in with your email or continue with Google. Admins go to the dashboard,
            clients&nbsp;to the site.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleSubmitting}
            className="w-full mb-4 flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 py-2.5 text-xs font-medium text-gray-50 hover:bg-white/10 transition-colors disabled:opacity-60"
          >
            <span className="h-4 w-4 rounded-full bg-white" />
            <span>{googleSubmitting ? "Connecting…" : "Continue with Google"}</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">or email</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/60 border border-white/10 px-3 py-2 rounded-md text-sm text-white focus:outline-none focus:border-icube-gold"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/60 border border-white/10 px-3 py-2 rounded-md text-sm text-white focus:outline-none focus:border-icube-gold"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-icube-gold text-icube-dark text-sm font-semibold rounded-md hover:bg-icube-gold-light transition-colors disabled:opacity-50"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-gray-500 text-[11px] text-center mt-2">
              Admin (local): admin@icube.ae / admin123
            </p>
            <p className="text-gray-400 text-xs text-center mt-4">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-icube-gold hover:text-icube-gold-light underline-offset-2 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
