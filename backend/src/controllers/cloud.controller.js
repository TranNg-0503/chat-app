import File from "../models/File.model.js";
import cloudinary from "../lib/cloudinary.js";

// Upload file lên Cloudinary + lưu metadata vào MongoDB
export const uploadFile = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "Không có file nào được tải lên" });
    }

    const newFile = await File.create({
      userId: req.user._id,
      fileUrl: req.file.path,
      fileType: req.file.mimetype.startsWith("image")
        ? "image"
        : req.file.mimetype.startsWith("video")
        ? "video"
        : req.file.mimetype.startsWith("audio")
        ? "audio"
        : "document",
      originalName: req.file.originalname,
    });

    res.status(201).json({ success: true, file: newFile });
  } catch (error) {
    console.error("Upload file error:", error);
    res.status(500).json({ message: "Lỗi khi upload file" });
  }
};

// Lấy danh sách file của user
export const getMyFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách file" });
  }
};
export const addNote = async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) return res.status(400).json({ success: false, message: "Nội dung trống" });
  
      const note = await File.create({
        userId: req.user._id,
        fileType: "note",
        noteText: content,
      });
  
      res.json({ success: true, note });
    } catch (err) {
      console.error("Add note error:", err);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  };

// Xoá file (cả trên Cloudinary và MongoDB)
export const deleteFile = async (req, res) => {
    try {
      const file = await File.findOne({
        _id: req.params.id,
        userId: req.user._id,
      });
  
      if (!file) {
        return res.status(404).json({ message: "File không tồn tại" });
      }
  
      // Nếu là file upload lên Cloudinary thì xoá trên Cloudinary
      if (file.fileType !== "note" && file.fileUrl) {
        try {
          const publicId = file.fileUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
        } catch (cloudErr) {
          console.error("Xoá trên Cloudinary lỗi:", cloudErr);
        }
      }
  
      // Xoá trong MongoDB (áp dụng cho cả note và file)
      await file.deleteOne();
  
      res.json({ success: true, message: "Đã xoá thành công" });
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({ message: "Lỗi khi xoá file/note" });
    }
  };
