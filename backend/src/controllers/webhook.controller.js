import Message from "../models/Message.js";
import CallMessage from "../models/Call.js";
import Channel from "../models/Channel.js";
import User from "../models/User.js";

export const streamWebhook = async (req, res) => {
  try {
    const event = req.body;

    console.log("📩 Webhook event:", event.type);
    console.log("🔹 Payload:", JSON.stringify(event, null, 2));

    // ---------------- Messages ----------------
    if (event.type === "message.new") {
      const message = event.message;
      if (!message?.user?.id) throw new Error("Message user ID missing");

      // Kiểm tra call attachment
      const callAttachment = message.attachments?.find(att =>
        ["call_invite","call_accept","call_reject","call_cancel"].includes(att.type)
      );

      if (callAttachment) {
        const callMsg = new CallMessage({
          callId: callAttachment.callId,
          userId: message.user.id,
          type: callAttachment.type,
          text: message.text || "",
          channelId: event.channel?.id || "",
          createdAt: new Date(message.created_at),
        });
        await callMsg.save();
        console.log("✅ Saved call message:", callMsg.text);
      } else {
        const msg = new Message({
          messageId: message.id,
          userId: message.user.id,
          text: message.text || "",
          channelId: event.channel?.id || "",
          createdAt: new Date(message.created_at),
        });
        await msg.save();
        console.log("✅ Saved normal message:", msg.text);
      }
    }

    if (event.type === "message.deleted") {
      const messageId = event?.message?.id;
      if (messageId) {
        await Message.deleteOne({ messageId });
        console.log("🗑 Deleted message:", messageId);
      }
    }

    if (event.type === "message.updated") {
      const messageId = event?.message?.id;
      if (messageId) {
        await Message.updateOne(
          { messageId },
          { text: event.message.text || "" }
        );
        console.log("✏️ Updated message:", messageId);
      }
    }

    // ---------------- Channels ----------------
    if (event.type === "channel.created") {
      const channelData = event?.channel;
      if (channelData?.id) {
        const members = (event?.members || []).map(m => m?.user_id).filter(Boolean);
        const newChannel = new Channel({
          channelId: channelData.id,
          name: channelData.name || "",
          type: channelData.type || "",
          members,
          createdAt: new Date(channelData.created_at),
        });
        await newChannel.save();
        //console.log("✅ Saved new channel:", channelData.id);
      }
    }

    if (event.type === "channel.deleted") {
      const channelId = event?.channel?.id;
      if (channelId) {
        await Channel.deleteOne({ channelId });
        console.log("🗑 Deleted channel:", channelId);
      }
    }

    // ---------------- Members ----------------
    if (event.type === "member.added") {
      const channelId = event?.channel?.id;
      const userId = event?.member?.user?.id;
      if (channelId && userId) {
        await Channel.updateOne(
          { channelId },
          { $addToSet: { members: userId } }
        );
        console.log(`➕ Added member: ${userId} to channel: ${channelId}`);
      }
    }

    if (event.type === "member.removed") {
      const channelId = event.channel_id || event.cid;
      const userId = event.member?.user?.id;

      if (!channelId || !userId) {
        console.log("⚠️ Missing channelId or userId in payload");
      } else {
        const result = await Channel.updateOne(
          { channelId },
          { $pull: { members: userId } } // members trong DB là String array
        );
        console.log("➖ Removed member:", userId, "from channel:", channelId, result);
      }
    }


    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("error");
  }
};
