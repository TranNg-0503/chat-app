import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMyFriends, getRecommendedUsers } from "../controllers/user.controller.js"
const route = express.Router();

route.use(protectRoute);

route.get("/", getRecommendedUsers);
route.get("/friends", getMyFriends);

export default route;
