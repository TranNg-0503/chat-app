export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // panel đổi ảnh
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

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

  // Hàm handle chọn file
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Hàm upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("avatar", selectedFile);

    try {
      const res = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setUser({ ...user, profilePic: res.data.profilePic }); // cập nhật avatar mới
      setIsOpen(false);
      setSelectedFile(null);
    } catch (err) {
      console.error("Upload avatar error:", err);
    }
  };

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
                className="w-10 h-10 rounded-full border cursor-pointer"
                onClick={() => setIsOpen(true)}
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

      {/* Modal đổi avatar */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Đổi ảnh đại diện</h2>

            {/* Preview */}
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 rounded-full border mx-auto mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border mx-auto mb-4 flex items-center justify-center text-gray-400">
                Chưa chọn ảnh
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setIsOpen(false)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleUpload}
                disabled={!selectedFile}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
