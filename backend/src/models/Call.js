// models/call.model.js
import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
  callId: { type: String, required: true, unique: true },
  type: { type: String, default: "default" },
  members: [String],
  status: { type: String, enum: ["ringing", "active", "ended"], default: "ringing" },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

export default mongoose.model("Call", callSchema);
