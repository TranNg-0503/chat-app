import React, { useContext, useState, useRef, useEffect } from "react";
import { useMessageContext, useChatContext, MessageSimple } from "stream-chat-react";
import { UserContext } from "../../../components/providers/AuthProvider";
import { ThemeContext } from "../../../components/providers/ThemeProvider";
import { THEMES } from "../../../../theme.config";
import axios from "axios";
import ring from "./ring.mp3";

export default function CustomMessage(props) {
  const { message } = useMessageContext();
  const { channel } = useChatContext();
  const { user } = useContext(UserContext);
  const { theme } = useContext(ThemeContext);

  const [handleStatus, setHandleStatus] = useState(null); 
  const audioRef = useRef(null);

  if (!message?.attachments?.length) {
    return <MessageSimple {...props} />;
  }

  const attachment = message.attachments[0];
  const { type, callId } = attachment; // ✅ callId lấy từ attachments
  const isSender = String(message.user?.id) === String(user?._id);
  const callerName = message.user?.name || message.user?.fullName || message.user?.id;

  const formatTime = () =>
    new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const isDark = theme === THEMES.Night;
  const alignClass = isSender ? "justify-end text-right" : "justify-start text-left";
  const bubbleColor = isSender
    ? isDark
      ? "bg-cyan-900 text-white border-blue-400"
      : "bg-blue-50 text-gray border-blue-50"
    : isDark
    ? "bg-gray-700 text-gray-50 border-blue-300"
    : "bg-gray-200 text-gray-900 border-gray-200";
  const baseBox = `rounded-xl p-3 border shadow-sm max-w-[70%] ${bubbleColor}`;

  const actionBtn = (color, label, onClick, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${color} hover:opacity-90 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {label}
    </button>
  );
  const createdAt = new Date(message.created_at).getTime();
  const now = Date.now();
  const isExpired = now - createdAt > 30000;

  const stopRing = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleAccept = async () => {
    setHandleStatus("accepted");
    stopRing();
    await channel.sendMessage({
      text: `✅ ${user?.name || user?.fullName || user?._id} đã tham gia cuộc gọi lúc ${formatTime()}.`,
      attachments: [{ type: "call_accept", callId }],
    });
    window.open(`/call/${callId}`, "_blank");
  };

  const handleReject = async () => {
    setHandleStatus("rejected");
    stopRing();

    await channel.sendMessage({
      text: `🚫 ${user?.name || user?.fullName || user?._id} đã từ chối cuộc gọi lúc ${formatTime()}.`,
      attachments: [{ type: "call_reject", callId }],
    });

    const memberCount = Object.keys(channel.state.members).length;
    if (memberCount <= 2 && callId) {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          "http://localhost:5001/call/end",
          {
            callId,
            channelId: channel.id,
            userId: user._id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.error("❌ Lỗi khi end call:", err.response?.data || err.message);
      }
    }
  };

  useEffect(() => {
    if (type === "call_cancel") {
      setHandleStatus("canceled");
      stopRing();
    }
  }, [type]);

  useEffect(() => {
    if (type === "call_invite" && !isSender && !isExpired && !handleStatus) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          console.warn("Không auto play được (trình duyệt chặn).");
        });
      }
    }
    return () => stopRing();
  }, [type, isSender, isExpired, handleStatus]);

  // ✅ Ẩn hết nút nếu có tin nhắn mới với attachment type=call_cancel
  useEffect(() => {
    const handleNewMessage = (event) => {
      const newMsg = event.message;
      if (newMsg?.attachments?.[0]?.type === "call_cancel") {
        setHandleStatus("canceled");
        stopRing();
      }
    };

    channel.on("message.new", handleNewMessage);
    return () => channel.off("message.new", handleNewMessage);
  }, [channel]);

  if (type === "call_invite") {
    return (
      <div className={`flex ${alignClass} my-2`}>
        <div className={baseBox}>
          {!isSender ? (
            <>
              <p className="mb-2">
                📞 Cuộc gọi đến từ: <span className="font-semibold">{callerName}</span>
              </p>
              {!isExpired && handleStatus !== "canceled" && (
                <div className="flex flex-col gap-2">
                  <audio ref={audioRef} src={ring} loop />
                  <div className="flex gap-2">
                    {actionBtn(
                      "bg-green-500 text-white",
                      "✅ Tham gia",
                      handleAccept,
                      handleStatus === "rejected"
                    )}
                    {actionBtn(
                      "bg-red-500 text-white",
                      "❌ Từ chối",
                      handleReject,
                      handleStatus === "accepted"
                    )}
                  </div>
                </div>
              )}

              {handleStatus === "canceled" && (
                <p className="text-sm text-gray-400 italic">Người gọi đã kết thúc cuộc gọi</p>
              )}
              {handleStatus === "rejected" && (
                <p className="text-sm text-red-400 italic">Bạn đã từ chối cuộc gọi</p>
              )}
              {handleStatus === "accepted" && (
                <p className="text-sm text-green-400 italic">Bạn đã tham gia cuộc gọi</p>
              )}
              {!handleStatus && isExpired && (
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
