import { createContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../../api";

const UserContext = createContext({
  user: null,
  loading: true,
  allowed: false,
  reloadUserData: null,
});

export default function AuthProvider({ children }) {
  const location = useLocation(); // lấy path hiện tại
  const [state, setState] = useState({
    loading: true,
    allowed: false,
    user: null,
  });

  // những path không cần auth
  const publicPaths = ["/login", "/signup", "/verify", "/forgot-password", "/reset-password"];

  useEffect(() => {
    let mounted = true;

    // nếu đang ở public path thì bỏ qua check
    if (publicPaths.includes(location.pathname)) {
      setState({ loading: false, allowed: true, user: null });
      return;
    }

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
  }, [location.pathname]); // chạy lại khi đổi route

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

  // nếu không phải public path và chưa login thì về /login
  if (!publicPaths.includes(location.pathname) && !state.allowed) {
    return <Navigate to="/login" replace />;
  }
  const updateUser = (newUser) => {
    setState((prev) => ({ ...prev, user: newUser }));
  };
  return (
    <UserContext.Provider value={{ ...state,updateUser, reloadUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export { UserContext };
