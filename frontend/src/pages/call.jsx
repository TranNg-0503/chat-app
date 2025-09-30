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
  CallControls,
  useCallStateHooks,
  CallingState,
  ParticipantView,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import axios from "axios";
import { UserContext } from "../components/providers/AuthProvider";

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
// -----------------------------------
// Component CallContent
// -----------------------------------
// -----------------------------------
// Component CallContent
// -----------------------------------
const CallContent = ({ call, userId }) => {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  const { channel } = useChatContext();
  const idleTimerRef = useRef(null);
  const prevCountRef = useRef(participants.length);

  const [showEndPopup, setShowEndPopup] = useState(false);
  const [countdown, setCountdown] = useState(3); // đếm ngược 3s
  const sendCancelMessage = async () => {
  try {
    await channel.sendMessage({
      text: "📴 Cuộc gọi đã kết thúc.",
      attachments: [{ type: "call_cancel", callId: call.id }],
    });
  } catch (e) {
    console.error("Error sending cancel message:", e);
  }
};

// Hàm hiển thị popup + auto đếm ngược
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

  // Nếu call đã LEFT -> hiện popup
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      sendCancelMessage();
      triggerEndPopup();
    }
  }, [callingState]);

  // Auto-end nếu sau 30s không có remote participant
  useEffect(() => {
    const localId = String(userId);
    const remoteCount = participants.filter(
      (p) => String(p.userId) !== localId
    ).length;

    if (remoteCount === 0) {
      if (!idleTimerRef.current) {
        idleTimerRef.current = setTimeout(() => {
          try {
            if (call?.endCall) call.endCall();
            else if (call?.leave) call.leave();
          } catch (e) {
            console.error("Error ending call:", e);
          }
          sendCancelMessage();
          triggerEndPopup();
        }, 30000);
      }
    } else {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    }
  }, [participants, call, userId]);

  // Auto-close ngay khi có người rời
  useEffect(() => {
    const prev = prevCountRef.current;
    if (prev > 1 && participants.length < prev) {
      try {
        if (call?.endCall) call.endCall();
        else if (call?.leave) call.leave();
      } catch (e) {
        console.error("Error ending call:", e);
      }
      sendCancelMessage();
      triggerEndPopup();
    }
    prevCountRef.current = participants.length;
  }, [participants, call]);

  return (
    <StreamTheme>
      <div className="h-screen w-screen flex flex-col bg-gray-900 relative">
        <div className="flex-1">
          <CustomLayout />
        </div>
        <div className="p-4 border-t border-gray-700">
          <CallControls />
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
