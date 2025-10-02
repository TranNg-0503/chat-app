// -----------------------------------
// CallControlsCustom.jsx
// -----------------------------------
import React, { useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

export default function CallControlsCustom({ call, onEnd }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const toggleMic = async () => {
    if (!call) return;
    if (micOn) {
      await call.microphone.disable();
      setMicOn(false);
    } else {
      await call.microphone.enable();
      setMicOn(true);
    }
  };

  const toggleCam = async () => {
    if (!call) return;
    if (camOn) {
      await call.camera.disable();
      setCamOn(false);
    } else {
      await call.camera.enable();
      setCamOn(true);
    }
  };

  return (
    <div className="flex justify-center gap-4 bg-gray-800 p-3 rounded-lg">
      {/* Mic */}
      <button
        onClick={toggleMic}
        className={`p-3 rounded-full ${micOn ? "bg-green-600" : "bg-red-600"}`}
      >
        {micOn ? <Mic className="text-white" /> : <MicOff className="text-white" />}
      </button>

      {/* Camera */}
      <button
        onClick={toggleCam}
        className={`p-3 rounded-full ${camOn ? "bg-green-600" : "bg-red-600"}`}
      >
        {camOn ? <Video className="text-white" /> : <VideoOff className="text-white" />}
      </button>

      {/* End call */}
      <button
        onClick={onEnd}
        className="p-3 rounded-full bg-red-700"
      >
        <PhoneOff className="text-white" />
      </button>
    </div>
  );
}
