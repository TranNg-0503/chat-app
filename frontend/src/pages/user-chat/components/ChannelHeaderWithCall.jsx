//ca
import React, { useState, useContext } from "react";
import {
  ChannelHeader as DefaultChannelHeader,
  useChannelStateContext,
  useChatContext,
} from "stream-chat-react";
import EditGroupChatModal from "./EditGroupChatModal";
import { UserContext } from "../../../components/providers/AuthProvider";
import { useNavigate } from "react-router-dom";

function ChannelHeaderWithCall() {
  const { channel } = useChannelStateContext();
  const { setActiveChannel } = useChatContext();
  const [openEditModal, setOpenEditModal] = useState(false);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const isGroup = Object.keys(channel?.state?.members).length > 2;
  const isCreator =
    String(
      channel?.data?.created_by_id ||
        channel?.data?.created_by?._id ||
        channel?.data?.created_by?.id
    ) === String(user?._id);

  const handleLeaveChannel = async () => {
    if (!window.confirm("Rời khỏi kênh?")) return;
    try {
      await channel.hide();
      await channel.removeMembers([String(user?._id)]);
      setActiveChannel(null);
    } catch (err) {
      console.error("Error leaving channel", err);
    }
  };

  const handleDeleteChannel = async () => {
    if (!window.confirm("Bạn có chắc muốn xoá kênh này?")) return;
    try {
      await channel.hide();
      await channel.delete();
      setActiveChannel(null);
    } catch (err) {
      console.error("Error deleting channel", err);
    }
  };

  const handleStartCall = async () => {
    if (!channel?.id) return;

    try {
      // 1. Gửi tin nhắn call invite
      await channel.sendMessage({
        text: "📞 Bạn có cuộc gọi đến!",
        attachments: [
          {
            type: "call_invite",
            callId: channel.id,
            callerId: String(user?._id),
          },
        ],
      });

      // 2. Mở tab mới cho người gọi
      window.open(
        `/call/${channel.id}`,
        "_blank",
        "width=1200,height=800,noopener,noreferrer"
      );
    } catch (err) {
      console.error("Error starting call:", err);
    }
  };

  return (
    <div className="relative">
      <DefaultChannelHeader />
      <div className="absolute top-3.5 right-3.5 flex gap-2">
        {isGroup && isCreator && (
          <>
            <button
              className="btn btn-secondary btn-sm"
              title="Chỉnh sửa thành viên"
              onClick={() => setOpenEditModal(true)}
            >
              Edit
            </button>
            <button
              className="btn btn-error btn-sm"
              title="Xoá kênh chat"
              onClick={handleDeleteChannel}
            >
              Delete
            </button>
          </>
        )}
        {isGroup && (
          <button
            className="btn btn-warning btn-sm"
            title="Rời khỏi kênh"
            onClick={handleLeaveChannel}
          >
            Leave
          </button>
        )}
        <button
          className="btn btn-secondary btn-sm"
          title="Bắt đầu video call"
          onClick={handleStartCall}
        >
          Call
        </button>
      </div>
      <EditGroupChatModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        channel={channel}
        currentUserId={user?._id}
      />
    </div>
  );
}

export default ChannelHeaderWithCall;
