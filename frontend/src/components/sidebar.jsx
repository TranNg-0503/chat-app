import { NavLink, useNavigate } from "react-router-dom";
import { Users, MessageSquareText, Pencil, LogOut } from "lucide-react";

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
    <div className="w-64 min-h-screen bg-base-100 shadow-md p-4">
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>

      <nav className="flex flex-col gap-2">
        <NavLink to="/friends" className={linkClass}>
          <Users size={18} /> Friend
        </NavLink>

        <NavLink to="/dashboard/messages" className={linkClass}>
          <MessageSquareText size={18} /> Message
        </NavLink>

        {/* onboard*/}
        <NavLink to="/onboard" className={linkClass}>
          <Pencil size={18} /> Sửa onboard
        </NavLink>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-error/10 text-error hover:text-error font-medium transition"
        >
          <LogOut size={18} /> Sign out
        </button>
      </nav>
    </div>
  );
}
