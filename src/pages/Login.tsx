import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-icube-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-icube-gray border border-white/10 rounded-sm p-8"
      >
        <div className="flex justify-center mb-8">
          <img src="/icube-logo.svg" alt="ICUBE" className="h-12 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-display font-bold text-center mb-6 text-white">
          Dashboard Login
        </h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          Dubai · ICUBE Vision TV Production
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold"
              placeholder="admin@icube.ae"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white focus:outline-none focus:border-icube-gold"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light transition-colors disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-gray-500 text-xs text-center mt-6">
          Default: admin@icube.ae / admin123
        </p>
        <a href="/" className="block text-center text-icube-gold text-sm mt-4 hover:underline">
          ← Back to site
        </a>
      </motion.div>
    </div>
  );
}
