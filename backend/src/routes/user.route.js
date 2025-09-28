import express from "express";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../lib/cloudinary.js";
import multer from "multer";
import {
  getMyFriends,
  getRecommendedUsers,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  getOutgoingFriendReqs,
  getFriendRequests,
  rejectFriendRequest,
  unsendFriendRequest,
  unFriend,
  uploadAvatar,
  updateMe,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Áp dụng middleware auth cho tất cả route
router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);
router.get("/search", searchUsers);

router.post("/friend-request/:id", sendFriendRequest);
router.delete("/friend-request/:id", unsendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.delete("/friend-request/:id/reject", rejectFriendRequest);
router.delete("/friends/:id", unFriend);

router.get("/friend-request", getFriendRequests);
router.get("/outgoing-friend-request", getOutgoingFriendReqs);

// // Cấu hình multer
// const upload = multer({ dest: "uploads/" });

// // Route upload avatar
// router.post("/me/avatar", upload.single("avatar"), uploadAvatar);

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "avatars",       // lưu vào folder "avatars" trên Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });
// Route upload avatar
router.post("/me/avatar", upload.single("avatar"), uploadAvatar);
//update 
router.put("/me", updateMe);
export default router;
