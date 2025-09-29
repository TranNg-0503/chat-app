import React, { useContext, useState, useRef, useEffect } from "react";
import { useMessageContext, useChatContext, MessageSimple } from "stream-chat-react";
import { UserContext } from "../../../components/providers/AuthProvider";
import { ThemeContext } from "../../../components/providers/ThemeProvider";
import { THEMES } from "../../../../theme.config";
import axios from "axios";

// 🔔 import file mp3
import ring from "./ring.mp3";

export default function CustomMessage(props) {
  const { message } = useMessageContext();
  const { channel } = useChatContext();
  const { user } = useContext(UserContext);
  const { theme } = useContext(ThemeContext);

  const [isHandled, setIsHandled] = useState(false);
  const audioRef = useRef(null); // ref cho audio

  const isDark = theme === THEMES.Night;

  if (!message?.attachments?.length) {
    return <MessageSimple {...props} />;
  }

  const attachment = message.attachments[0];
  const { type, callId } = attachment;
  const isSender = String(message.user?.id) === String(user?._id);
  const callerName = message.user?.name || message.user?.fullName || message.user?.id;

  const formatTime = () =>
    new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const alignClass = isSender ? "justify-end text-right" : "justify-start text-left";
  const bubbleColor = isSender
    ? isDark
      ? "bg-cyan-900 text-white border-blue-400"
      : "bg-blue-50 text-gray border-blue-50"
    : isDark
    ? "bg-gray-700 text-gray-50 border-blue-300"
    : "bg-gray-200 text-gray-900 border-gray-200";

  const baseBox = `rounded-xl p-3 border shadow-sm max-w-[70%] ${bubbleColor}`;

  const actionBtn = (color, label, onClick) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${color} hover:opacity-90`}
    >
      {label}
    </button>
  );

  // ====== Tính toán còn hạn 30s không ======
  const createdAt = new Date(message.created_at).getTime();
  const now = Date.now();
  const isExpired = now - createdAt > 30000;

  // ====== Handlers ======
  const stopRing = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleAccept = async () => {
    setIsHandled(true);
    stopRing();
    await channel.sendMessage({
      text: `✅ ${user?.name || user?.fullName || user?._id} đã tham gia cuộc gọi lúc ${formatTime()}.`,
      attachments: [{ type: "call_accept", callId }],
    });
    window.open(`/call/${callId}`, "_blank");
  };

  const handleReject = async () => {
    setIsHandled(true);
    stopRing();
    await channel.sendMessage({
      text: `🚫 ${user?.name || user?.fullName || user?._id} đã từ chối cuộc gọi lúc ${formatTime()}.`,
      attachments: [{ type: "call_reject", callId }],
    });
    await axios.post("http://localhost:5001/call/end", { callId });
  };

  // ====== Auto play chuông khi có call_invite ======
  useEffect(() => {
    if (type === "call_invite" && !isSender && !isExpired && !isHandled) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          console.warn("Không auto play được (trình duyệt chặn).");
        });
      }
    }
    return () => stopRing();
  }, [type, isSender, isExpired, isHandled]);

  // ====== Giao diện ======
  if (type === "call_invite") {
    return (
      <div className={`flex ${alignClass} my-2`}>
        <div className={baseBox}>
          {!isSender ? (
            <>
              <p className="mb-2">
                📞 Cuộc gọi đến từ: <span className="font-semibold">{callerName}</span>
              </p>

              {!isExpired && !isHandled && (
                <div className="flex flex-col gap-2">
                  {/* 🔔 Audio chuông */}
                  <audio ref={audioRef} src={ring} loop />
                  <div className="flex gap-2">
                    {actionBtn("bg-green-200 text-white", "✅ Tham gia", handleAccept)}
                    {actionBtn("bg-red-200 text-white", "❌ Từ chối", handleReject)}
                  </div>
                </div>
              )}

              {isHandled && (
                <p className="text-sm text-red-400 italic">Bạn đã từ chối cuộc gọi</p>
              )}

              {!isHandled && isExpired && (
                <p className="text-sm text-gray-400 italic">(Lời mời gọi đã hết hạn)</p>
              )}
            </>
          ) : (
            <>
              <p className="mb-2">
                📞 Bạn đã gọi đến{" "}
                <span className="font-semibold">
                  {Object.values(channel.state.members)
                    .filter((m) => m.user.id !== user?._id)
                    .map((m) => m.user.name || m.user.id)
                    .join(", ")}
                </span>
              </p>
              <p className="text-sm text-gray-400 italic">
                (Lời mời gọi sẽ tự hủy sau 30s nếu không phản hồi)
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (type === "call_accept") {
    return (
      <div className={`flex ${alignClass} my-2`}>
        <div className={`${baseBox} text-green-600 dark:text-green-400`}>
          {message.text}
        </div>
      </div>
    );
  }

  if (type === "call_reject") {
    return (
      <div className={`flex ${alignClass} my-2`}>
        <div className={`${baseBox} text-red-600 dark:text-red-400`}>
          {message.text}
        </div>
      </div>
    );
  }

  if (type === "call_cancel") {
    return (
      <div className={`flex ${alignClass} my-2`}>
        <div className={`${baseBox} text-gray-600 dark:text-gray-400 italic`}>
          {message.text}
        </div>
      </div>
    );
  }

  return <MessageSimple {...props} />;
}
