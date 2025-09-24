import { generateStreamToken } from "../lib/stream.js";
import fetch from "node-fetch";
import Chat from "../models/chat.model.js";
export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function chatWithBot(req, res) {
  try {
    const { message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User chưa đăng nhập" });
    }

    // 1. Tính ngày hiện tại
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Đếm số chat hôm nay
    const chatCount = await Chat.countDocuments({
      userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (chatCount >= 20) {
      return res.status(429).json({ message: "Bạn đã đạt giới hạn 20 lần chat hôm nay" });
    }

    // 3. Gọi Groq API
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: message }],
        }),
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error("Groq API Error:", data.error);
      return res.status(500).json({ message: data.error.message });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ message: "Không có nội dung trả về từ Groq API" });
    }

    // 4. Lưu chat vào MongoDB
    const chat = new Chat({ userId, userMessage: message, botReply: reply });
    await chat.save();

    // lấy tin nhắn gần nhất
   /* const chats = await Chat.find({ userId }).sort({ createdAt: 1 });

    // format về frontend
    const history = chats.flatMap((c) => [
      { role: "user", content: c.userMessage },
      { role: "bot", content: c.botReply },
    ]);*/


    //res.json({ reply, history });
    res.json({ reply });
  } catch (err) {
    console.error("Lỗi gọi Groq API:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getChatHistory(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User chưa đăng nhập" });

    const chats = await Chat.find({ userId }).sort({ createdAt: 1 }).limit(50);

    const history = chats.flatMap((c) => [
      { role: "user", content: c.userMessage },
      { role: "bot", content: c.botReply },
    ]);

    res.json({ history });
  } catch (err) {
    console.error("Lỗi getChatHistory:", err);
    res.status(500).json({ message: "Server error" });
  }
}

