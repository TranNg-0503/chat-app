import React, { useEffect, useMemo, useState, useCallback } from "react";
import { StreamChat } from "stream-chat";
import Sidebar from "../components/sidebar";
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  LoadingIndicator,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import api from "../api";

const CHAT_BASE = "/chat";
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export default function UserChatPage() {
  const [client, setClient] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Lấy user hiện tại
  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      try {
        // Lấy thông tin user hiện tại
        const meRes = await api.get(`/me`, {
          credentials: "include",
        });
        if (meRes.status === 401) {
          throw new Error("Bạn cần đăng nhập để sử dụng chat với người dùng.");
        }
        const me = meRes.data.user; // { _id, fullName, profilePic? }
        if (isCancelled) return;

        // Lấy stream token cho user hiện tại
        const tokenRes = await api.get(`${CHAT_BASE}/token`, {
          credentials: "include",
        });
        const token = tokenRes.data?.token;
        if (isCancelled) return;

        if (!STREAM_API_KEY) {
          throw new Error("Thiếu VITE_STREAM_API_KEY ở frontend (.env).");
        }

        //Kết nối Stream client
        const sc = StreamChat.getInstance(STREAM_API_KEY);
        await sc.connectUser(
          {
            id: String(me._id),
            name: me.fullName || `user_${me._id}`,
            image: me.profilePic, // optional
          },
          token
        );

        if (isCancelled) return;
        setCurrentUser({ id: String(me.id), name: me.name || `user_${me.id}` });
        setClient(sc);
      } catch (e) {
        setError(e.message || "Có lỗi khi khởi tạo chat.");
      } finally {
        if (!isCancelled) setIsConnecting(false);
      }
    }

    bootstrap();
    return () => {
      isCancelled = true;
    };
  }, []);

  //Cấu hình filter/sort cho ChannelList (liệt kê các kênh mà user là member)
  const filters = useMemo(() => {
    if (!currentUser) return {};
    return {
      type: "messaging",
      members: { $in: [currentUser.id] },
    };
  }, [currentUser]);

  const sort = useMemo(() => ({ last_message_at: -1 }), []);
  const options = useMemo(() => ({ limit: 20 }), []);

  //Tạo kênh nhanh bằng userId
  const handleCreateDM = useCallback(
    async (otherUserId) => {
      if (!client) return;

      const myId = client.userID;
      if (!myId) {
        console.error("Không tìm thấy userID của client");
        return;
      }

      const members = [myId, String(otherUserId)];
      const channel = client.channel("messaging", { members });

      // chỉ cần watch, sẽ tự tạo nếu chưa có
      await channel.watch();
    },
    [client]
  );

  //Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (client) client.disconnectUser();
    };
  }, [client]);

  if (isConnecting) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingIndicator />
        <span className="ml-2 text-sm">Đang kết nối chat…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar trái */}
      <Sidebar />

      {/* Nội dung chat phải */}
      <div className="flex-1 overflow-hidden">
        <Chat client={client} theme="str-chat__theme-light">
          <div className="str-chat__container">
            <div className="str-chat__channel-list">
              <div style={{ padding: 8 }}>
                <QuickDM onCreateDM={handleCreateDM} />
              </div>
              <ChannelList
                filters={filters}
                sort={sort}
                options={options}
                showChannelSearch
              />
            </div>

            <Channel>
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput focus />
              </Window>
              <Thread />
            </Channel>
          </div>
        </Chat>
      </div>
    </div>
  );
}

function QuickDM({ onCreateDM }) {
  const [otherId, setOtherId] = useState("");

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        border: "1px solid #eee",
        padding: 8,
        borderRadius: 8,
      }}
    >
      <input
        value={otherId}
        onChange={(e) => setOtherId(e.target.value)}
        placeholder="Nhập userId muốn chat 1–1"
        style={{
          flex: 1,
          border: "1px solid #ddd",
          borderRadius: 6,
          padding: "6px 8px",
          fontSize: 14,
        }}
      />
      <button
        onClick={() => {
          if (!otherId.trim()) return;
          onCreateDM(otherId.trim());
          setOtherId("");
        }}
        style={{
          border: "none",
          background: "black",
          color: "white",
          borderRadius: 6,
          padding: "8px 10px",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Tạo chat
      </button>
    </div>
  );
}
