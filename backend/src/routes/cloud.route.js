import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../lib/cloudinary.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { uploadFile, getMyFiles, deleteFile,addNote } from "../controllers/cloud.controller.js";

const router = express.Router();

// middleware auth
router.use(protectRoute);

// Cấu hình Multer + Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "user_files",
    resource_type: "auto", // cho phép image/video/audio/document
  },
});

const upload = multer({ storage });

// upload file
router.post("/upload", upload.single("file"), uploadFile);

// lấy danh sách file
router.get("/", getMyFiles);

router.post("/note", protectRoute, addNote);
// xoá file
router.delete("/:id", deleteFile);

export default router;
