import { useContext, useState, useEffect } from "react";
import { UserContext } from "./providers/AuthProvider";
import UserModal from "../pages/UserModal";
import api from "../api";

const Header = ({ className }) => {
  const { user, updateUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lấy thông tin user khi load app nếu chưa có
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/me", { withCredentials: true });
        updateUser(res.data.user);
      } catch (err) {
        console.error("Fetch /me error:", err.response?.data || err);
      }
    };
    if (!user) fetchMe();
  }, [user, updateUser]);
  

  return (
    <>
      <header
        className={`flex items-center justify-end bg-base-100 shadow px-6 py-3 border-b border-base-200 ${
          className ?? ""
        }`}
      >
        {user && (
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="font-medium">{user.fullName}</span>
            <img
              src={user.profilePic || "/default-avatar.png"}
              alt="Avatar"
              className="w-10 h-10 rounded-full border"
            />
          </div>
        )}
      </header>

      {/* Gọi UserModal */}
      <UserModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  user={user}
  setUser={updateUser}
/>

    </>
  );
};

export default Header;
