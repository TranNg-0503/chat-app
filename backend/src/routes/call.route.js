import express from "express";
import { getVideoToken } from "../controllers/video.controller.js";

const router = express.Router();

router.post("/token", getVideoToken);
router.post("/notify", (req, res) => {
  const { callId, callerId, callerName } = req.body;
  // Logic WebSocket đã được xử lý trong index.js
  res.status(200).send({ message: "Notification sent" });
});

router.post("/reject", (req, res) => {
  const { callId, userId } = req.body;
  res.status(200).send({ message: "Call rejected" });
});
export default router;
