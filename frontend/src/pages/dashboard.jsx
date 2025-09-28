import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import api from "../api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // State chỉnh sửa thông tin
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: "",
    profile: "",
    location: "",
  });

  // State đổi mật khẩu
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Menu avatar
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // Lấy thông tin user khi vào dashboard
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const userData = await api.get("/me", { credentials: "include" });
        setUser(userData.data.user);
      } catch (err) {
        console.error("Fetch /me error:", err);
      }
    };
    fetchMe();
  }, []);

  // Sync dữ liệu vào form khi mở modal
  useEffect(() => {
    if (user && isOpen) {
      setEditData({
        fullName: user.fullName || "",
        profile: user.profile || "",
        location: user.location || "",
      });
    }
  }, [user, isOpen]);

  // Cập nhật preview khi chọn file
  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload avatar
  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("avatar", selectedFile);

    try {
      const res = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setUser({ ...user, profilePic: res.data.profilePic });
      setSelectedFile(null);
      setPreview(null);
      alert("Cập nhật avatar thành công!");
    } catch (err) {
      console.error("Upload avatar error:", err);
    }
  };

  // Handle input change khi chỉnh sửa
  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  // Lưu thông tin chỉnh sửa
  const handleSaveInfo = async () => {
    try {
      const res = await api.put("/users/me", editData, {
        withCredentials: true,
      });
      setUser(res.data.user);
      setIsEditing(false);
    } catch (err) {
      console.error("Update user error:", err);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async () => {
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận không khớp!");
      return;
    }

    try {
      const res = await api.put(
        "/users/me/password",
        { oldPassword, newPassword },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("Đổi mật khẩu thành công!");
        setIsChangingPassword(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Có lỗi khi đổi mật khẩu."
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-base-200">
      {/* Sidebar */}
      <Sidebar />

      {/* Nội dung */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-end bg-base-100 shadow px-6 py-3">
          {user && (
            <div className="flex items-center gap-3">
              <span className="font-medium">{user.fullName}</span>
              <img
                src={user.profilePic}
                alt="Avatar"
                className="w-10 h-10 rounded-full border cursor-pointer"
                onClick={() => setIsOpen(true)}
              />
            </div>
          )}
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="card bg-base-100 shadow p-6 w-full max-w-lg text-center">
            <h2 className="card-title">Chào mừng bạn đến Dashboard</h2>
            <p className="mt-2">Đây là Project của nhóm 3</p>
          </div>
        </main>
      </div>

      {/* Modal */}
      {isOpen && user && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
            <h2 className="text-lg font-bold mb-4 text-center">
              Thông tin người dùng
            </h2>

            {/* Avatar + Menu */}
            <div className="flex flex-col items-center mb-4 relative">
              <img
                src={preview || user.profilePic || "/default-avatar.png"}
                alt="Avatar"
                className="w-24 h-24 rounded-full border mb-2 cursor-pointer hover:opacity-80"
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              />
              <span className="font-semibold">{user.fullName}</span>

              {showAvatarMenu && (
                <div className="absolute top-28 bg-white border rounded-lg shadow-md w-40">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => {
                      window.open(
                        user.profilePic || "/default-avatar.png",
                        "_blank"
                      );
                      setShowAvatarMenu(false);
                    }}
                  >
                    👁 Xem ảnh
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => {
                      document.getElementById("avatarInput").click();
                      setShowAvatarMenu(false);
                    }}
                  >
                    ✏️ Đổi ảnh đại diện
                  </button>
                </div>
              )}

              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Thông tin cơ bản hoặc đổi mật khẩu */}
            {!isChangingPassword ? (
              <div className="text-sm space-y-2 mb-4">
                {isEditing ? (
                  <>
                    <label className="block text-sm font-medium mb-1">
                      Họ tên
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={editData.fullName}
                      onChange={handleChange}
                      className="input input-bordered w-full mb-3"
                    />

                    <label className="block text-sm font-medium mb-1">
                      Profile
                    </label>
                    <input
                      type="text"
                      name="profile"
                      value={editData.profile}
                      onChange={handleChange}
                      className="input input-bordered w-full mb-3"
                    />

                    <label className="block text-sm font-medium mb-1">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={editData.location}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                    />
                  </>
                ) : (
                  <>
                    <p>
                      <span className="font-medium">Họ tên:</span>{" "}
                      {user.fullName}
                    </p>
                    <p>
                      <span className="font-medium">Profile:</span>{" "}
                      {user.profile || "Chưa có"}
                    </p>
                    <p>
                      <span className="font-medium">Địa chỉ:</span>{" "}
                      {user.location || "Chưa có"}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-medium">Mật khẩu cũ</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="input input-bordered w-full"
                />

                <label className="block text-sm font-medium">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input input-bordered w-full"
                />

                <label className="block text-sm font-medium">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input input-bordered w-full"
                />

                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
              </div>
            )}

            <hr className="my-4" />

            {/* Buttons */}
            <div className="flex flex-wrap gap-2 justify-between">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => {
                  setIsOpen(false);
                  setIsEditing(false);
                  setIsChangingPassword(false);
                  setSelectedFile(null);
                  setPreview(null);
                  setShowAvatarMenu(false);
                }}
              >
                Đóng
              </button>

              {!isChangingPassword ? (
                <>
                  {!isEditing ? (
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded"
                      onClick={() => setIsEditing(true)}
                    >
                      Chỉnh sửa
                    </button>
                  ) : (
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                      onClick={handleSaveInfo}
                    >
                      Lưu thông tin
                    </button>
                  )}

                  <button
                    className="px-4 py-2 bg-yellow-600 text-white rounded"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Đổi mật khẩu
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={handleUpload}
                    disabled={!selectedFile}
                  >
                    Lưu Avatar
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="px-4 py-2 bg-gray-400 text-white rounded"
                    onClick={() => setIsChangingPassword(false)}
                  >
                    Hủy
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={handleChangePassword}
                  >
                    Lưu mật khẩu
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
