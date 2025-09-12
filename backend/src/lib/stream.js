import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("Stream API key hoặc secret bị thiếu");
}

// khởi tạo client
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    // upsert user (tạo hoặc update nếu đã tồn tại)
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Lỗi khi tạo Stream user:", error);
  }
};

export const generateStreamToken = (userId) => {};
