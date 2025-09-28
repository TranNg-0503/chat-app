import Message from "../models/Message.js";

export const streamWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log("📩 Webhook event:", event.type);

    if (event.type === "message.new") {
      const msg = new Message({
        messageId: event.message.id,
        userId: event.message.user.id,
        text: event.message.text,
        channelId: event.channel?.id,
        createdAt: new Date(event.message.created_at),
      });

      await msg.save();
      console.log("✅ Saved message:", msg.text);
    }

    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("error");
  }
};
