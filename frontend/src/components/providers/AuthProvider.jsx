import { createContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../../api";

const UserContext = createContext({
  user: null,
  loading: true,
  allowed: false,
  reloadUserData: null,
});

export default function AuthProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    allowed: false,
    user: null,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/me");

        if (mounted) {
          setState({
            loading: false,
            allowed: !!data?.success,
            user: data?.user,
          });
        }
      } catch {
        if (mounted) setState({ loading: false, allowed: false, user: null });
      }
    })();
    return () => (mounted = false);
  }, []);

  const reloadUserData = async () => {
    try {
      const { data } = await api.get("/me");
      setState({
        loading: false,
        allowed: !!data?.success,
        user: data?.user,
      });
    } catch {
      setState({ loading: false, allowed: false, user: null });
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!state.allowed) return <Navigate to="/login" replace />;

  return (
    <UserContext.Provider value={{ ...state, reloadUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext };
