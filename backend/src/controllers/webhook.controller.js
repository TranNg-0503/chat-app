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
    if (event.type === "message.deleted") {
      const { message } = event;
      // Xóa tin nhắn thường
      await Message.deleteOne({ messageId: message.id });
      
    }
    if (event.type === "message.updated") {
      const { message } = event;
      await Message.updateOne(
        { messageId: message.id },
        { text: message.text }
      );
      console.log("✏️ Updated message:", message.id);
    }
     if (event.type === "channel.created") {
      const { channel, members } = event;
      const newChannel = new Channel({
        channelId: channel.id,
        name: channel.name,
        type: channel.type,
        members: members.map(m => m.user_id),
        createdAt: new Date(channel.created_at),
      });
      await newChannel.save();
      console.log("✅ Saved new channel:", channel.id);
    }

    if (event.type === "channel.deleted") {
      const { channel } = event;
      await Channel.deleteOne({ channelId: channel.id });
      console.log("🗑 Deleted channel:", channel.id);
    }

    // Member events
    if (event.type === "member.added") {
      const { channel, member } = event;
      await Channel.updateOne(
        { channelId: channel.id },
        { $addToSet: { members: member.user.id } }
      );
      console.log("➕ Added member:", member.user.id, "to channel:", channel.id);
    }

    if (event.type === "member.removed") {
      const { channel, member } = event;
      await Channel.updateOne(
        { channelId: channel.id },
        { $pull: { members: member.user.id } }
      );
      console.log("➖ Removed member:", member.user.id, "from channel:", channel.id);
    }
    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("error");
  }
};
