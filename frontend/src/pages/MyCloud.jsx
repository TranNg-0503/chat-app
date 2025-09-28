import { useEffect, useState } from "react";
import api from "../api";

export default function Cloud() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  // Lấy danh sách file + note
  const fetchFiles = async () => {
    try {
      const { data } = await api.get("/cloud");
      if (data.success) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error("Lỗi lấy file:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Upload file
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const { data } = await api.post("/cloud/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        setFiles((prev) => [data.file, ...prev]);
      }
    } catch (err) {
      console.error("Upload lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  // Thêm note
  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      const { data } = await api.post("/cloud/note", { content: note });
      if (data.success) {
        setFiles((prev) => [data.note, ...prev]);
        setNote("");
      }
    } catch (err) {
      console.error("Lỗi thêm note:", err);
    }
  };

  // Xoá file/note
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá mục này?")) return;

    try {
      await api.delete(`/cloud/${id}`);
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("Xoá lỗi:", err);
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto p-6 bg-base-200">
        <div className="max-w-3xl mx-auto bg-base-100 shadow-xl rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">☁️ Cloud cá nhân của tôi</h2>

          {/* Upload file */}
          <label className="btn btn-primary mb-4">
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Tải file lên"
            )}
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={loading}
            />
          </label>

          {/* Thêm note */}
          <div className="mb-6">
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Nhập ghi chú..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button onClick={handleAddNote} className="btn btn-primary mt-2">
              Lưu Note
            </button>
          </div>

          {/* Danh sách file + note */}
          {files.length === 0 ? (
            <p className="text-gray-500">Chưa có file hay ghi chú nào</p>
          ) : (
            <ul className="space-y-3">
              {files.map((f) => (
                <li
                  key={f._id}
                  className="flex items-start justify-between bg-gray-50 p-3 rounded-lg shadow-sm"
                >
                  {f.fileType === "note" ? (
                    <div>
                      <p className="font-medium">📝 Note</p>
                      <p className="text-gray-700 whitespace-pre-line">
                        {f.noteText}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">{f.originalName}</p>
                      <a
                        href={f.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 text-sm"
                      >
                        Mở file
                      </a>
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(f._id)}
                    className="btn btn-sm btn-error ml-4"
                  >
                    Xoá
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
