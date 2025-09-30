import express from "express";
import { getVideoToken } from "../controllers/video.controller.js";
import streamVideoServer from "../lib/streamVideo.js";
const router = express.Router();

router.post("/token", getVideoToken);
router.post("/notify", (req, res) => {
  const { callId, callerId, callerName } = req.body;
  // Logic WebSocket đã được xử lý trong index.js
  res.status(200).send({ message: "Notification sent" });
});
router.post("/end", async (req, res) => {
  try {
    const { callId } = req.body;
    if (!callId) {
      return res.status(400).json({ message: "Thiếu callId" });
    }

    const call = streamVideoServer.video.call("default", callId);
    await call.end();

    res.json({ success: true, message: "Phòng gọi đã bị hủy" });
  } catch (err) {
    console.error("Lỗi end call:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/:callId/participants", async (req, res) => {
  const { callId } = req.params;

  try {
    const call = await Call.findOne({ callId });
    if (!call) return res.status(404).json({ error: "Call not found" });

    // participants là mảng userId hoặc object bạn lưu khi join
    res.json({ participants: call.participants || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/reject", (req, res) => {
  const { callId, userId } = req.body;
  res.status(200).send({ message: "Call rejected" });
});
export default router;
