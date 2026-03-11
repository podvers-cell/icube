import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const from = location.pathname || "/dashboard";

  if (loading) {
    return (
      <div className="min-h-screen bg-icube-dark flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to={"/login?from=" + encodeURIComponent(from)} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
