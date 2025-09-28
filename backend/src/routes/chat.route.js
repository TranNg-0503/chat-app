import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken,chatWithBot,getChatHistory } from "../controllers/chat.controller.js";


const router = express.Router();
router.get("/token", protectRoute, getStreamToken)
router.post("/chat", protectRoute,chatWithBot);
router.get("/history", protectRoute, getChatHistory);
export default router;