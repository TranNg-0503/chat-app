// -----------------------------------
// CallPage.jsx
// -----------------------------------
import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
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

  // Giữ tất cả participants, bao gồm cả localParticipant
  const uniqueParticipants = Array.from(
    new Map(participants.map((p) => [p.userId, p])).values()
  );

  return (
    <div className="h-full w-full flex items-center justify-center bg-black" style={{ boxSizing: 'border-box' }}>
      {uniqueParticipants.length === 0 ? (
        <p className="text-white text-lg">Chưa có ai trong phòng</p>
      ) : uniqueParticipants.length === 1 ? (
        // Single participant: scale to fit viewport while maintaining aspect ratio
        <div className="flex items-center justify-center w-full h-full max-w-[80vw] max-h-[80vh]">
          <div className="w-full h-full" style={{ aspectRatio: '16/9' }}>
            <ParticipantView participant={uniqueParticipants[0]} />
          </div>
        </div>
      ) : (
        // Multiple participants: use CSS grid to fit all participants
        <div
          className="w-full h-full grid gap-2 p-2"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
            gridAutoRows: 'minmax(150px, 1fr)',
            boxSizing: 'border-box',
          }}
        >
          {uniqueParticipants.map((p) => (
            <div
              key={p.sessionId}
              className="w-full h-full flex items-center justify-center"
              style={{ aspectRatio: '16/9' }}
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
        <CallContent call={call} callId={callId} userId={user?._id} />
      </StreamCall>
    </StreamVideo>
  );
}

// -----------------------------------
// Component CallContent
// -----------------------------------
const CallContent = ({ call, callId, userId }) => {
  const { useCallCallingState, useMicrophoneState, useCameraState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { microphone } = useMicrophoneState();
  const { camera } = useCameraState();

  useEffect(() => {
    console.log("Mic state:", microphone.enabled, "Mic track:", microphone.track);
    console.log("Camera state:", camera.enabled, "Camera track:", camera.track);
  }, [microphone.enabled, microphone.track, camera.enabled, camera.track]);

  // Khi đã rời call từ SDK thì đóng tab luôn
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      window.close();
    }
  }, [callingState]);

  return (
    <StreamTheme>
      <div className="h-screen w-screen flex flex-col bg-gray-900">
        {/* Video layout */}
        <div className="flex-1">
          <CustomLayout />
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-700">
          <CallControls  />
        </div>
      </div>
    </StreamTheme>
  );
};
