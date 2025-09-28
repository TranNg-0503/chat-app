import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String }, // có thể null nếu chỉ lưu note
    fileType: { type: String, enum: ["image", "video", "audio", "document", "note"], required: true },
    originalName: { type: String },
    noteText: { type: String },  // 📝 nội dung note
    createdAt: { type: Date, default: Date.now },
  });
  

const File = mongoose.model("File", fileSchema);
export default File;
