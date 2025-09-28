import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/login";
import Onboard from "./pages/onboard";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import Friend from "./pages/friend";
import UserChatPage from "./pages/user-chat";
import ThemeToggler from "./components/ThemeToggler";
import CloudPage from "./pages/CloudPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        <Route
          path="/onboard"
          element={
            <ProtectedRoute>
              <Onboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friend />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat-user"
          element={
            <ProtectedRoute>
              <UserChatPage />
            </ProtectedRoute>
          }
        />
    <Route
  path="/cloud"
  element={
    <ProtectedRoute>
      <CloudPage />
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
