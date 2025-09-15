import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMyFriends, getRecommendedUsers, searchUsers, sendFriendRequest, acceptFriendRequest,getOutgoingFriendReqs, getFriendRequests} from "../controllers/user.controller.js"
const route = express.Router();

route.use(protectRoute);

route.get("/", getRecommendedUsers);
route.get("/friends", getMyFriends);
route.get("/search", searchUsers);

route.post("/friend-request/:id", sendFriendRequest);
route.put("/friend-request/:id/accept", acceptFriendRequest);


route.get("/friend-request", getFriendRequests);
route.get("/outgoing-friend-request", getOutgoingFriendReqs);
export default route;
