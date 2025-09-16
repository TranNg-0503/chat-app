import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/login";
import Onboard from "./pages/onboard";
import Signup from "./pages/signup";
import ThemeToggler from "./components/ThemeToggler";

function Home() {
  return (
    <div className="min-h-screen p-6 bg-base-200">
      <div className="max-w-xl mx-auto card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Trang chính</h2>
          <p>Bạn đã đăng nhập.</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboard"
          element={
            <ProtectedRoute>
              <Onboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ThemeToggler />
    </BrowserRouter>
  );
}
