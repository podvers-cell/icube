import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { firebaseAuth } from "../firebase";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      navigate("/", { replace: true });
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
      navigate("/", { replace: true });
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
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-black/70 border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.75)]"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-display font-semibold text-white tracking-tight">
              Create your account
            </h1>
            <a href="/" className="text-[11px] text-gray-400 hover:text-icube-gold transition-colors">
              Back to site
            </a>
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
              <a
                href="/login"
                className="text-icube-gold hover:text-icube-gold-light underline-offset-2 hover:underline"
              >
                Sign in
              </a>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

