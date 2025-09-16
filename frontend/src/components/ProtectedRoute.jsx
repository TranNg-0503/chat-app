import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/me");
        if (mounted) setState({ loading: false, allowed: !!data?.success });
      } catch {
        if (mounted) setState({ loading: false, allowed: false });
      }
    })();
    return () => (mounted = false);
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }
  if (!state.allowed) return <Navigate to="/login" replace />;
  return children;
}
