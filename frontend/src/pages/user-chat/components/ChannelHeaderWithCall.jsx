import React from "react";
import {
  ChannelHeader as DefaultChannelHeader,
  useChannelStateContext,
} from "stream-chat-react";

function ChannelHeaderWithCall({ onStartCall }) {
  // still forward the rest of the default header props via composition
  const { channel } = useChannelStateContext();

  return (
    <div className="relative">
      <DefaultChannelHeader />
      <button
        className="btn btn-secondary btn-sm absolute top-3.5 right-3.5"
        title="Bắt đầu video call"
        onClick={() => onStartCall(channel)}
      >
        Call
      </button>
    </div>
  );
}

export default ChannelHeaderWithCall;
