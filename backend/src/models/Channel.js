// models/Channel.js
import mongoose from "mongoose";

const ChannelSchema = new mongoose.Schema({
  channelId: { type: String, required: true, unique: true },
  name: { type: String },
  type: { type: String }, // e.g., "messaging", "team"
  members: [{ type: String }], // danh sách userId
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Channel", ChannelSchema);
