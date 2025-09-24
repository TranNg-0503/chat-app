import { NavLink, useNavigate } from "react-router-dom";
import { Users, MessageSquareText, Pencil, LogOut } from "lucide-react";
import ThemeToggler from "./ThemeToggler";

export default function Sidebar() {
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 transition ${
      isActive ? "bg-base-300 font-semibold" : ""
    }`;

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.log("Logout error:", e);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="w-64 min-h-screen bg-base-100 shadow-md p-4 flex flex-col">
      <NavLink to="/">
        <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      </NavLink>

      <nav className="flex flex-col gap-2">
        <NavLink to="/friends" className={linkClass}>
          <Users size={18} /> Friend
        </NavLink>

        <NavLink to="/chat-user" className={linkClass}>
          <MessageSquareText size={18} /> Chat với người dùng
        </NavLink>

        {/* onboard*/}
        <NavLink to="/chat-ai" className={linkClass}>
          <Pencil size={18} /> Chat với AI
        </NavLink>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-error/10 text-error hover:text-error font-medium transition"
        >
          <LogOut size={18} /> Sign out
        </button>
      </nav>

      <ThemeToggler className="block mt-auto mx-auto" />
    </div>
  );
}
