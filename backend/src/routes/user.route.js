import express from "express";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../lib/cloudinary.js";
import multer from "multer";
import { changePassword } from "../controllers/user.controller.js";
import {
  getMyFriends,
  getRecommendedUsers,
  searchUsers,
  searchUsersForAdd,
  sendFriendRequest,
  acceptFriendRequest,
  getOutgoingFriendReqs,
  getFriendRequests,
  rejectFriendRequest,
  unsendFriendRequest,
  unFriend,
  uploadAvatar,
  updateMe,
  findNearbyUsers,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const route = express.Router();

// Áp dụng middleware auth cho tất cả route
route.use(protectRoute);

route.get("/", getRecommendedUsers);
route.get("/friends", getMyFriends);
route.get("/search", searchUsers);
route.get("/search-add", searchUsersForAdd);

route.post("/friend-request/:id", sendFriendRequest);
route.delete("/friend-request/:id", unsendFriendRequest);
route.put("/friend-request/:id/accept", acceptFriendRequest);
route.delete("/friend-request/:id/reject", rejectFriendRequest);
route.delete("/friends/:id", unFriend);
route.get("/friend-request", getFriendRequests);
route.get("/outgoing-friend-request", getOutgoingFriendReqs);

// // Cấu hình multer
// const upload = multer({ dest: "uploads/" });

// // Route upload avatar
// router.post("/me/avatar", upload.single("avatar"), uploadAvatar);

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "avatars", // lưu vào folder "avatars" trên Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });
// Route upload avatar
route.post("/me/avatar", upload.single("avatar"), uploadAvatar);

//update
route.put("/me", updateMe);
// đổi pass
route.put("/me/password", changePassword);
route.get("/friend-request", getFriendRequests);
route.get("/outgoing-friend-request", getOutgoingFriendReqs);
route.get("/find-nearby-users", findNearbyUsers);
export default route;
