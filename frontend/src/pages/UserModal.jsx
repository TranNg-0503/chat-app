    import { useEffect, useState } from "react";
    import api from "../api";

    export default function UserModal({ isOpen, onClose, user, setUser }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        fullName: "",
        profile: "",
        location: "",
    });

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [showAvatarMenu, setShowAvatarMenu] = useState(false);

    // Đồng bộ dữ liệu user vào form khi mở modal
    useEffect(() => {
        if (user && isOpen) {
        setEditData({
            fullName: user.fullName || "",
            profile: user.profile || "",
            location: user.location || "",
        });
        }
    }, [user, isOpen]);

    // Preview avatar khi chọn file
    useEffect(() => {
        if (!selectedFile) {
        setPreview(null);
        return;
        }
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    // Chọn file avatar
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
        setSelectedFile(e.target.files[0]);
        }
    };

    // Upload avatar
    // ✅ Sửa handleUpload
    const handleUpload = async () => {
        if (!selectedFile) return;
    
        const formData = new FormData();
        formData.append("avatar", selectedFile); // key phải là "avatar"
    
        try {
        const res = await api.post("/users/me/avatar", formData, {
            withCredentials: true,
            headers: {
            "Content-Type": "multipart/form-data", // ✅ BẮT BUỘC cho form-data
            },
        });
    
        console.log("Upload response:", res.data);
    
        if (res.data.success) {
            setUser(res.data.user); // ✅ update trực tiếp từ response
            alert("Cập nhật avatar thành công!");
          } else {
            alert(res.data.message || "Upload thất bại");
          }
          
        } catch (err) {
        console.error("Upload avatar error:", err.response?.data || err);
        alert(err.response?.data?.message || "Upload lỗi");
        }
    };
    
    
    

    // Xử lý input change
    const handleChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    // Lưu thông tin người dùng
    const handleSaveInfo = async () => {
        if (!editData.fullName.trim()) {
        alert("Họ tên không được để trống!");
        return;
        }

        try {
        console.log("Dữ liệu gửi lên:", editData); // Debug
        const res = await api.put("/users/me", editData, {
            withCredentials: true,
        });

        if (res.data?.user) {
            setUser(res.data.user);
            setIsEditing(false);
            alert("Cập nhật thông tin thành công!");
        } else {
            alert("Không thể cập nhật thông tin.");
        }
        } catch (err) {
        console.error("Update user error:", err.response?.data || err);
        alert(err.response?.data?.message || "Không thể cập nhật thông tin.");
        }
    };

    // Đổi mật khẩu
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
        setPasswordError("Điền đầy đủ thông tin");
        return;
        }
        if (newPassword !== confirmPassword) {
        setPasswordError("Mật khẩu mới không khớp");
        return;
        }
    
        try {
        const res = await api.put(
            "/users/me/password",
            { oldPassword, newPassword }, // ✅ Trùng key với backend
            { withCredentials: true }
        );
    
        if (res.data.success) {
            alert("Đổi mật khẩu thành công!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            setPasswordError(res.data.message || "Lỗi đổi mật khẩu");
        }
        } catch (err) {
        setPasswordError(err.response?.data?.message || "Lỗi server");
        }
    };
    
    
    
    // Reset toàn bộ state khi đóng modal
    const handleClose = () => {
        onClose();
        setIsEditing(false);
        setIsChangingPassword(false);
        setSelectedFile(null);
        setPreview(null);
        setShowAvatarMenu(false);
        setPasswordError("");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    if (!isOpen) return null;

return (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
      {/* Nút đóng ở góc */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        ✖
      </button>

      <h2 className="text-lg font-bold mb-4 text-center">Thông tin người dùng</h2>

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
                window.open(user.profilePic || "/default-avatar.png", "_blank");
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

      {/* Nội dung modal */}
      {!isChangingPassword ? (
        <div className="text-sm space-y-2 mb-4">
          {isEditing ? (
            <>
              <label className="block text-sm font-medium mb-1">Họ tên</label>
              <input
                type="text"
                name="fullName"
                value={editData.fullName}
                onChange={handleChange}
                className="input input-bordered w-full mb-3"
              />

              <label className="block text-sm font-medium mb-1">Profile</label>
              <input
                type="text"
                name="profile"
                value={editData.profile}
                onChange={handleChange}
                className="input input-bordered w-full mb-3"
              />

              <label className="block text-sm font-medium mb-1">Địa chỉ</label>
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
              <p><span className="font-medium">Họ tên:</span> {user.fullName}</p>
              <p><span className="font-medium">Profile:</span> {user.profile || "Chưa có"}</p>
              <p><span className="font-medium">Địa chỉ:</span> {user.location || "Chưa có"}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
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

          <label className="block text-sm font-medium">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input input-bordered w-full"
          />

          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
        </div>
      )}

      <hr className="my-4" />

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
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
);
}