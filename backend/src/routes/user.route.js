import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMyFriends, getRecommendedUsers, searchUsers } from "../controllers/user.controller.js"
const route = express.Router();

route.use(protectRoute);

route.get("/", getRecommendedUsers);
route.get("/friends", getMyFriends);
route.get("/search", searchUsers);

export default route;
