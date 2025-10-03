import express from "express";
import { getVideoToken } from "../controllers/video.controller.js";
import streamVideoServer from "../lib/streamVideo.js";
import User from "../models/User.js";
// import Call nếu bạn cần cho participants
// import Call from "../models/Call.js";
import CallMessage from "../models/Call.js"; 
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

    // Lấy danh sách participants từ DB
    const call = await Call.findOne({ callId });
    if (!call) return res.status(404).json({ message: "Call not found" });

    const participants = call.participants || [];

    // Lấy thông tin user để gửi message
    const user = await User.findById(userId).lean();
    const displayName = user?.fullName || user?.email || "Người dùng";

    // Nếu còn nhiều hơn 2 người -> chỉ remove user + gửi message "rời cuộc gọi"
    if (participants.length > 2) {
      await Call.updateOne({ callId }, { $pull: { participants: userId } });

      // Gửi message call_leave
      const msg = await streamVideoServer.chat.channel("messaging", channelId).sendMessage({
        message: {
          text: `📞 ${displayName} đã rời khỏi cuộc gọi`,
          user_id: userId,
          attachments: [{ type: "call_leave", callId }],
        },
      });

      // Lưu vào MongoDB
      const callMsg = new CallMessage({
        callId,
        userId,
        type: "call_leave",
        text: msg.message.text,
        channelId,
        createdAt: new Date(msg.message.created_at),
      });
      await callMsg.save();

      return res.json({
        success: true,
        message: "Bạn đã rời khỏi cuộc gọi, nhưng phòng vẫn còn người tham gia",
      });
    }

    // Nếu <= 2 người -> end call thật sự
    const videoCall = streamVideoServer.video.call("default", callId);
    await videoCall.end();

    // Gửi message call_cancel
    const msg = await streamVideoServer.chat.channel("messaging", channelId).sendMessage({
      message: {
        text: `📞 ${displayName} đã kết thúc cuộc gọi`,
        user_id: userId,
        attachments: [{ type: "call_cancel", callId }],
      },
    });

    // Lưu vào MongoDB
    const callMsg = new CallMessage({
      callId,
      userId,
      type: "call_cancel",
      text: msg.message.text,
      channelId,
      createdAt: new Date(msg.message.created_at),
    });
    await callMsg.save();

    res.json({ success: true, message: "Phòng gọi đã bị hủy, message đã lưu" });

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
