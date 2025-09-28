import React, { useState, useContext, useEffect } from "react";
import api from "../api";
import { UserContext } from "../components/providers/AuthProvider";

export default function AIChatPage() {
  const { user } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // load lịch sử chat khi vào trang
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/chat/history");
        if (res.data.history) {
          setMessages(res.data.history);
        }
      } catch (err) {
        console.error("Lỗi load history:", err);
      }
    };
    fetchHistory();
  }, []);


  // gửi tin nhắn
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post("/chat/chat", { message: input });
      const botReply = res.data.reply;

      setMessages((prev) => [...prev, { role: "bot", content: botReply }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`my-1 p-2 rounded ${
              msg.role === "user"
                ? "bg-blue-100 text-right"
                : "bg-gray-100 text-left"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <div className="text-gray-500">AI đang trả lời...</div>}
      </div>

      <div className="flex mt-2">
        <input
          className="flex-1 border p-2 rounded-l"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-r"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
