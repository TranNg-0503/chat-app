import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import api from "../api";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  // Lấy thông tin user hiện lại lên
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const userData = await api.get("/me", {
          credentials: "include",
        });
        setUser(userData.data.user);
      } catch (err) {
        console.error("Fetch /me error:", err);
      }
    };
    fetchMe();
  }, []);

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* Sidebar bên trái */}
      <Sidebar />

      {/* Khu vực nội dung */}
      <div className="flex-1 flex flex-col">
        {/* Thanh ngang trên cùng */}
        <header className="flex items-center justify-end bg-base-100 shadow px-6 py-3">
          {user && (
            <div className="flex items-center gap-3">
              <span className="font-medium">{user.fullName}</span>
              <img
                src={user.profilePic}
                alt="Avatar"
                className="w-10 h-10 rounded-full border"
              />
            </div>
          )}
        </header>

        {/* Nội dung chính */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="card bg-base-100 shadow p-6 w-full max-w-lg text-center">
            <h2 className="card-title">Chào mừng bạn đến Dashboard </h2>
            <p className="mt-2">Đây là Project của nhóm 3</p>
          </div>
        </main>
      </div>
    </div>
  );
}
