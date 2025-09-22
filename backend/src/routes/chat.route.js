import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken,chatWithBot } from "../controllers/chat.controller.js";


const router = express.Router();
router.get("/token", protectRoute, getStreamToken)
router.post("/chat", chatWithBot);
export default router;