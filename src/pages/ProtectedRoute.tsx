import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

import type { ReactNode } from "react";

const ADMIN_EMAIL = "admin@icube.ae";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-icube-dark flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
