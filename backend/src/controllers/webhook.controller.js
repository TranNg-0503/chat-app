import Message from "../models/Message.js";
import CallMessage from "../models/Call.js";

export const streamWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log("📩 Webhook event:", event.type);

    if (event.type === "message.new") {
      const { message } = event;

      // Kiểm tra có call attachment không
      const callAttachment = message.attachments?.find(att =>
        ["call_invite","call_accept","call_reject","call_cancel"].includes(att.type)
      );

      if (callAttachment) {
        // Lưu vào collection CallMessage
        const callMsg = new CallMessage({
          callId: callAttachment.callId,
          userId: message.user.id,
          type: callAttachment.type,
          text: message.text,
          channelId: event.channel?.id,
          createdAt: new Date(message.created_at),
        });
        await callMsg.save();
        console.log("✅ Saved call message:", callMsg.text);
      } else {
        // Lưu message bình thường
        const msg = new Message({
          messageId: message.id,
          userId: message.user.id,
          text: message.text,
          channelId: event.channel?.id,
          createdAt: new Date(message.created_at),
        });
        await msg.save();
        console.log("✅ Saved normal message:", msg.text);
      }
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("error");
  }
};
