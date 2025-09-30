import mongoose from "mongoose";

const callMessageSchema = new mongoose.Schema({
  callId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["call_invite","call_accept","call_reject","call_cancel"], 
    required: true 
  },
  text: { type: String },
  channelId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("CallMessage", callMessageSchema);
