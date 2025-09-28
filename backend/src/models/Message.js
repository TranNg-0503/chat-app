import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  messageId: String,
  userId: String,
  text: String,
  channelId: String,
  createdAt: Date,
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
