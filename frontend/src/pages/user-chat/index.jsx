import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
} from "react";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  LoadingIndicator,
} from "stream-chat-react";
import ChannelHeaderWithCall from "./components/ChannelHeaderWithCall";
import api from "../../api";
import { ThemeContext } from "../../components/providers/ThemeProvider";
import { THEMES } from "../../../theme.config";
import QuickDM from "./components/QuickDM";
import { UserContext } from "../../components/providers/AuthProvider";
import ChannelInfoSidebar from "./components/ChannelInfoSidebar";

const CHAT_BASE = "/chat";
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export default function UserChatPage() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(UserContext);
  const [client, setClient] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const chatColorTheme = useMemo(
    () =>
      theme === THEMES.Night ? "str-chat__theme-dark" : "str-chat__theme-light",
    [theme]
  );

  // Lấy user hiện tại
  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      try {
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
            id: String(user._id),
            name: user.fullName || `user_${user._id}`,
            image: user.profilePic, // optional
          },
          token
        );

        if (isCancelled) return;
        setCurrentUser({
          id: String(user._id),
          name: user.name || `user_${user._id}`,
        });
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
  }, [user]);

  //Cấu hình filter/sort cho ChannelList (liệt kê các kênh mà user là member)
  const filters = useMemo(() => {
    if (!currentUser) return {};
    return {
      type: { $in: ["messaging"] },
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

  // Tạo nhóm chat
  const handleCreateGroup = useCallback(
    async (memberIds, groupName) => {
      if (!client) return;

      const myId = client.userID;
      if (!myId) return;

      const finalMembers = Array.from(
        new Set([...memberIds.map(String), myId])
      );

      const channel = client.channel("messaging", null, {
        name: groupName || undefined,
        members: finalMembers,
      });

      await channel.create();
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

  // Placeholder for call
  const handleStartCall = (channel) => {
    console.log("Start video call with channel", channel?.id);
    // Later integrate @stream-io/video-react-sdk here
  };

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
    <div className="flex-1 flex flex-col min-h-0">
      <Chat client={client} theme={chatColorTheme}>
        <QuickDM
          className="flex-none"
          onCreateDM={handleCreateDM}
          onCreateGroup={handleCreateGroup}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Cột trái: danh sách kênh */}
          <div className="flex-1 max-w-80 min-w-56">
            <ChannelList filters={filters} sort={sort} options={options} />
          </div>

          {/* Cột giữa + phải: đặt trong <Channel> để có context */}
          <div className="flex-[3] min-w-0">
            <Channel>
              <div className="flex h-full">
                {/* Khung chat */}
                <div className="flex-1 min-w-0 h-full pr-200">
                  <Window>
                    <ChannelHeaderWithCall onStartCall={handleStartCall} />
                    <MessageList />
                    <MessageInput focus />
                  </Window>
                  <Thread />
                </div>

                {/* Cột phải: thông tin hội thoại (PHẢI ở trong <Channel>) */}
                <div className="w-80">
                  <ChannelInfoSidebar />
                </div>
              </div>
            </Channel>
          </div>
        </div>
      </Chat>
    </div>
  );
}
