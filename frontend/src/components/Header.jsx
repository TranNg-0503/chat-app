import { useContext } from "react";
import { UserContext } from "./providers/AuthProvider";

/* Thanh ngang trên cùng */
const Header = ({ className }) => {
  const { user } = useContext(UserContext);

  return (
    <header
      className={`flex items-center justify-end bg-base-100 shadow px-6 py-3 border-b border-base-200 ${
        className ?? ""
      }`}
    >
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
  );
};

export default Header;
