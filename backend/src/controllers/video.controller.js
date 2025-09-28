import streamVideoServer from "../lib/streamVideo.js";  // chỗ bạn cấu hình SDK server

export async function getVideoToken(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId" });
    }

    // 👇 chỉ truyền userId (string), KHÔNG truyền object
    const token = streamVideoServer.createToken(String(userId));

    res.json({ token, apiKey: process.env.STREAM_API_KEY });
  } catch (err) {
    console.error("Lỗi tạo video token:", err);
    res.status(500).json({ message: "Server error" });
  }
}
