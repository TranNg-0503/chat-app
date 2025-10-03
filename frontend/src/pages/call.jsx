// -----------------------------------
// CallPage.jsx
// -----------------------------------
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  StreamTheme,
  useCallStateHooks,
  CallingState,
  ParticipantView,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import axios from "axios";
import { UserContext } from "../components/providers/AuthProvider";
import CallControlsCustom from "./customCallcontrol";

const CustomLayout = () => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const uniqueParticipants = Array.from(
    new Map(participants.map((p) => [p.userId, p])).values()
  );

  return (
    <div className="h-full w-full flex items-center justify-center bg-black">
      {uniqueParticipants.length === 0 ? (
        <p className="text-white text-lg">Chưa có ai trong phòng</p>
      ) : uniqueParticipants.length === 1 ? (
        <div className="flex items-center justify-center w-full h-full max-w-[80vw] max-h-[80vh]">
          <div className="w-full h-full" style={{ aspectRatio: "16/9" }}>
            <ParticipantView participant={uniqueParticipants[0]} />
          </div>
        </div>
      ) : (
        <div
          className="w-full h-full grid gap-2 p-2"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
            gridAutoRows: "minmax(150px, 1fr)",
          }}
        >
          {uniqueParticipants.map((p) => (
            <div
              key={p.sessionId}
              className="w-full h-full flex items-center justify-center"
              style={{ aspectRatio: "16/9" }}
            >
              <ParticipantView participant={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CallPage() {
  const { id: callId } = useParams();
  const { user } = useContext(UserContext);

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const initCall = async () => {
      if (!user?._id || !callId) return;
      try {
        const res = await axios.post("http://localhost:5001/call/token", {
          userId: user._id,
        });

        const { token, apiKey } = res.data;

        const videoClient = new StreamVideoClient({ apiKey });

        await videoClient.connectUser(
          {
            id: String(user._id),
            name: user.fullName,
            image: user.profilePic,
          },
          token
        );

        const streamCall = videoClient.call("default", callId);
        await streamCall.join({ create: true });

        if (!isCancelled) {
          setClient(videoClient);
          setCall(streamCall);
        }
      } catch (err) {
        console.error("Lỗi khởi tạo call:", err);
      }
    };

    initCall();

    return () => {
      isCancelled = true;
      if (call) call.leave();
      if (client) client.disconnectUser();
    };
  }, [user, callId]);

  if (!client || !call) {
    return (
      <div className="flex items-center justify-center h-screen">
        Đang tải...
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallContent call={call} userId={user?._id} />
      </StreamCall>
    </StreamVideo>
  );
}

// -----------------------------------
// Component CallContent
// -----------------------------------
const CallContent = ({ call, userId }) => {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();

  const hasEndedRef = useRef(false); // đảm bảo gọi end call chỉ 1 lần
  const idleTimerRef = useRef(null);
  const prevCountRef = useRef(participants.length);

  const [showEndPopup, setShowEndPopup] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const triggerEndPopup = () => {
    setShowEndPopup(true);
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          window.close();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const safeEndCall = async () => {
    if (hasEndedRef.current || !call) return;
    hasEndedRef.current = true;

    try {
      const token = localStorage.getItem("token");
      const channelId = call.cid?.split(":")[1];

      await axios.post(
        "http://localhost:5001/call/end",
        { callId: call.id, channelId, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Call ended:", call.id);
    } catch (err) {
      console.error("❌ Lỗi khi end call:", err.response?.data || err.message);
    } finally {
      triggerEndPopup();
    }
  };

  // Nếu call đã LEFT -> trigger popup
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      triggerEndPopup();
    }
  }, [callingState]);

  // Auto-end nếu không có remote participant sau 28s
  useEffect(() => {
    const localId = String(userId);
    const remoteCount = participants.filter(p => String(p.userId) !== localId).length;

    if (remoteCount === 0 && !idleTimerRef.current) {
      idleTimerRef.current = setTimeout(() => {
        safeEndCall();
      }, 28000);
    } else if (remoteCount > 0 && idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, [participants]);

  // Auto-close khi số người < 2
  useEffect(() => {
    const prev = prevCountRef.current;
    if (participants.length < prev && participants.length < 2) {
      safeEndCall();
    }
    prevCountRef.current = participants.length;
  }, [participants]);

  // Xử lý event call_cancel từ server
  useEffect(() => {
    if (!call) return;

    const listener = (event) => {
      if (event.type === "call_cancel") {
        console.log("Call đã bị hủy bởi người gọi");
        safeEndCall();
      }
    };

    call.on("event", listener);
    return () => call.off("event", listener);
  }, [call]);

  // Xử lý tắt tab/cửa sổ
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!call || hasEndedRef.current) return;
      hasEndedRef.current = true;

      try {
        const channelId = call.cid?.split(":")[1];
        const payload = JSON.stringify({ callId: call.id, channelId, userId });
        navigator.sendBeacon("http://localhost:5001/call/end", new Blob([payload], { type: "application/json" }));
      } catch (e) {
        console.error("❌ sendBeacon error:", e);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [call, userId]);

  return (
    <StreamTheme>
      <div className="h-screen w-screen flex flex-col bg-gray-900 relative">
        <div className="flex-1">
          <CustomLayout />
        </div>
        <div className="p-4 border-t border-gray-700 flex justify-center">
          <CallControlsCustom call={call} onEnd={safeEndCall} />
        </div>

        {/* Popup thông báo */}
        {showEndPopup && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 rounded-xl shadow-lg p-6 max-w-sm text-center">
              <p className="text-lg font-semibold mb-3">Cuộc gọi đã kết thúc</p>
              <p className="text-sm text-gray-600">
                Cửa sổ sẽ tự đóng sau <span className="font-bold">{countdown}</span> giây...
              </p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={() => window.close()}
              >
                Đóng ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </StreamTheme>
  );
};
