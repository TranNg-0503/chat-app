import express from "express";
import { getVideoToken } from "../controllers/video.controller.js";
import streamVideoServer from "../lib/streamVideo.js";
import User from "../models/User.js";
// import Call nếu bạn cần cho participants
// import Call from "../models/Call.js";

const router = express.Router();

router.post("/token", getVideoToken);

router.post("/notify", (req, res) => {
  const { callId, callerId, callerName } = req.body;
  // Logic WebSocket đã được xử lý trong index.js
  res.status(200).send({ message: "Notification sent" });
});

router.post("/end", async (req, res) => {
  try {
    const { callId, channelId, userId } = req.body;
    if (!callId || !channelId || !userId) {
      return res.status(400).json({ message: "Thiếu callId, channelId hoặc userId" });
    }

    console.log("👉 End call:", { callId, channelId, userId });

    // End video call
    const call = streamVideoServer.video.call("default", callId);
    await call.end();

    // Gửi tin nhắn vào channel chat
    const channel = streamVideoServer.chat.channel("messaging", channelId);

    // Lấy user từ DB
    const user = await User.findById(userId).lean();
    const displayName = user?.fullName || user?.email || "Người dùng";

    // 🚨 sendMessage của Stream yêu cầu `user_id`, không phải `user: {}`
    await channel.sendMessage({
      message: {
        text: `📞 ${displayName} đã kết thúc cuộc gọi `,
        user_id: userId,
        attachments: [
          {
            type: "call_cancel",
            callId, // để client biết call nào bị hủy
          },  // Bắt buộc phải có
        ]
      }
    });

    res.json({ success: true, message: "Phòng gọi đã bị hủy & tin nhắn đã gửi" });
  } catch (err) {
    console.error("❌ Lỗi end call:", err.response?.data || err.message || err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/:callId/participants", async (req, res) => {
  const { callId } = req.params;

  try {
    const call = await Call.findOne({ callId }); // ✅ nhớ import Call model
    if (!call) return res.status(404).json({ error: "Call not found" });

    res.json({ participants: call.participants || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/reject", (req, res) => {
  const { callId, userId } = req.body;
  res.status(200).send({ message: `Call ${callId} rejected by user ${userId}` });
});

export default router;
