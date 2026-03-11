"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { firebaseAuth } from "../firebase";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignUp() {
    setError("");
    setGoogleSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
      router.replace("/");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        // ignore
      } else {
        setError(err instanceof Error ? err.message : "Google sign-up failed");
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
              Create your account
            </h1>
            <Link href="/" className="text-[11px] text-gray-400 hover:text-icube-gold transition-colors">
              Back to site
            </Link>
          </div>
          <p className="text-gray-400 text-xs mb-6">
            Sign up as a client or creator to manage bookings and stay connected with ICUBE.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleSubmitting}
            className="w-full mb-4 flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 py-2.5 text-xs font-medium text-gray-50 hover:bg-white/10 transition-colors disabled:opacity-60"
          >
            <span className="h-4 w-4 bg-white rounded-sm flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="h-3.5 w-3.5" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.894 32.657 29.303 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.06 6.053 29.303 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691 12.88 19.51C14.66 15.108 18.964 12 24 12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.06 6.053 29.303 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.202 0 9.86-1.994 13.409-5.236l-6.189-5.238C29.176 35.091 26.715 36 24 36c-5.281 0-9.858-3.321-11.292-7.946l-6.52 5.023C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a11.97 11.97 0 0 1-4.083 5.526l.003-.002 6.189 5.238C36.973 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
            </span>
            <span>{googleSubmitting ? "Connecting…" : "Continue with Google"}</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">or email</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-black/60 border border-white/10 px-3 py-2 rounded-md text-sm text-white focus:outline-none focus:border-icube-gold"
                placeholder="Your name"
              />
            </div>
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
                placeholder="Choose a secure password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-icube-gold text-icube-dark text-sm font-semibold rounded-md hover:bg-icube-gold-light transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating account…" : "Sign up"}
            </button>
            <p className="text-gray-400 text-xs text-center mt-4">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-icube-gold hover:text-icube-gold-light underline-offset-2 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

