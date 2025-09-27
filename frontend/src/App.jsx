import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Onboard from "./pages/onboard";
import ForgotPassword from "./pages/forgot-psw";
import ResetPassword from "./pages/reset-psw";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import Friend from "./pages/friend";
import UserChatPage from "./pages/user-chat";
import ThemeProvider from "./components/providers/ThemeProvider";
import ProtectedLayout from "./components/layouts/ProtecedLayout";
import CallPage from "./pages/call.jsx";
import AuthGuard from "./components/layouts/AuthGuard";
import AuthProvider from "./components/providers/AuthProvider";
import AIChatPage from "./pages/ai-chat";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            <Route
              path="/onboard"
              element={
                <ProtectedLayout>
                  <Onboard />
                </ProtectedLayout>
              }
            />

            <Route
              path="/friends"
              element={
                <ProtectedLayout>
                  <Friend />
                </ProtectedLayout>
              }
            />

            <Route
              path="/chat-user"
              element={
                <ProtectedLayout>
                  <UserChatPage />
                </ProtectedLayout>
              }
            />

            <Route
              path="/chat-ai"
              element={
                <ProtectedLayout>
                  <AIChatPage />
                </ProtectedLayout>
              }
            />

            {/* Video call */}
            <Route
              path="/call/:id"
              element={
                <AuthGuard>
                  <CallPage />
                </AuthGuard>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
