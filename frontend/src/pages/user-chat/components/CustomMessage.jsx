import React, { useContext, useState, useEffect } from "react";
import { useMessageContext, useChatContext, MessageSimple } from "stream-chat-react";
import { UserContext } from "../../../components/providers/AuthProvider";
import { ThemeContext } from "../../../components/providers/ThemeProvider";
import { THEMES } from "../../../../theme.config";
import axios from "axios";
export default function CustomMessage(props) {
  const { message } = useMessageContext();
  const { channel } = useChatContext();
  const { user } = useContext(UserContext);
  const { theme } = useContext(ThemeContext);

  const [actionTaken, setActionTaken] = useState(false);

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
      ? "bg-blue-600 text-white border-blue-700"
      : "bg-blue-500 text-white border-blue-300"
    : isDark
      ? "bg-gray-800 text-gray-100 border-gray-700"
      : "bg-yellow-50 text-gray-900 border-yellow-200";

  const baseBox = `rounded-xl p-3 border shadow-sm max-w-[70%] ${bubbleColor}`;

  const actionBtn = (color, label, onClick) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${color} hover:opacity-90`}
    >
      {label}
    </button>
  );

  // ====== Handlers ======
  const handleAccept = async () => {
    setActionTaken(true);
    await channel.sendMessage({
      text: `✅ ${user?.name || user?.fullName || user?._id} đã tham gia cuộc gọi lúc ${formatTime()}.`,
      attachments: [{ type: "call_accept", callId }],
    });
    window.open(`/call/${callId}`, "_blank");
  };

  const handleReject = async () => {
    setActionTaken(true);
    await channel.sendMessage({
      text: `🚫 ${user?.name || user?.fullName || user?._id} đã từ chối cuộc gọi lúc ${formatTime()}.`,
      attachments: [{ type: "call_reject", callId }],
      
    });
    await axios.post("http://localhost:5001/call/end", { callId });
  };

  // ====== Auto hide after 30s ======
  useEffect(() => {
    if (type === "call_invite" && !actionTaken) {
      const timer = setTimeout(() => {
        setActionTaken(true);
      }, 30000); // 30s
      return () => clearTimeout(timer);
    }
  }, [type, actionTaken]);
  // useEffect(() => {
  // if (type === "call_invite" && isSender && !actionTaken) {
  //   const timer = setTimeout(async () => {
  //     try {
  //       // gửi tin nhắn thông báo
  //       await channel.sendMessage({
  //         text: `⏱ Cuộc gọi từ ${callerName} đã kết thúc.`,
  //         attachments: [{ type: "call_cancel", callId }],
  //       });

  //       // gọi API backend hủy phòng
  //       await axios.post("http://localhost:5001/call/end", { callId });

  //       setActionTaken(true);
  //     } catch (err) {
  //       console.error("Auto cancel call error:", err);
  //     }
  //   }, 30000);

  //   return () => clearTimeout(timer);
  // }
  // }, [type, isSender, actionTaken, callId, channel, callerName]);
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
              {!actionTaken && (
                <div className="flex gap-2">
                  {actionBtn("bg-green-500 text-white", "✅ Tham gia", handleAccept)}
                  {actionBtn("bg-red-500 text-white", "❌ Từ chối", handleReject)}
                </div>
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
              {/* ❌ Bỏ nút hủy, chỉ hiển thị thông báo */}
              <p className="text-sm text-gray-500 italic">
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
