import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
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
  findNearbyUsers,
} from "../controllers/user.controller.js";
const route = express.Router();

route.use(protectRoute);

route.get("/", getRecommendedUsers);
route.get("/friends", getMyFriends);
route.get("/search", searchUsers);

route.post("/friend-request/:id", sendFriendRequest);
route.delete("/friend-request/:id", unsendFriendRequest);
route.put("/friend-request/:id/accept", acceptFriendRequest);
route.delete("/friend-request/:id/reject", rejectFriendRequest);
route.delete("/friends/:id", unFriend);


route.get("/friend-request", getFriendRequests);
route.get("/outgoing-friend-request", getOutgoingFriendReqs);
route.get("/find-nearby-users", findNearbyUsers);
export default route;
