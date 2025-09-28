import React, { useMemo, useState } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";

export default function ChannelInfoSidebar() {
  const { channel, messages } = useChannelStateContext();
  const { client } = useChatContext();

  // Title & avatar (group/DM)
  const title = useMemo(() => {
    if (channel?.data?.name) return channel.data.name;
    const me = client.userID;
    const others =
      Object.values(channel?.state?.members || {})
        .map((m) => m.user)
        .filter((u) => u?.id !== me) || [];
    return others[0]?.name || others[0]?.id || "Direct Message";
  }, [channel?.cid]);

  const avatar = useMemo(() => {
    if (channel?.data?.image) return channel.data.image;
    const me = client.userID;
    const others =
      Object.values(channel?.state?.members || {})
        .map((m) => m.user)
        .filter((u) => u?.id !== me) || [];
    return others[0]?.image;
  }, [channel?.cid]);

  // Members
  const members = useMemo(() => {
    return Object.values(channel?.state?.members || {}).map((m) => m.user);
  }, [channel?.cid]);

  // Ảnh & tệp “nhanh” từ messages đã load
  const [imagesQuick, filesQuick] = useMemo(() => {
    const imgs = [],
      files = [];
    (messages || []).forEach((msg) => {
      (msg.attachments || []).forEach((att, i) => {
        if (att.type === "image") {
          imgs.push({
            id: `${msg.id}-${i}`,
            url: att.thumb_url || att.image_url || att.asset_url,
          });
        }
        if (att.type === "file") {
          files.push({
            id: `${msg.id}-${i}`,
            url: att.asset_url || att.image_url,
            title: att.title,
          });
        }
      });
    });
    return [imgs, files];
  }, [messages]);

  // (tùy chọn) “Xem tất cả” – có thể gắn hàm search phân trang sau
  const [loadingAll, setLoadingAll] = useState(false);

  return (
    <aside className="basis-80 grow-0 shrink-0 border-l flex flex-col overflow-auto">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <img
            src={avatar || "https://placehold.co/64x64?text=Chat"}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="font-semibold truncate">{title}</div>
            <div className="text-xs text-gray-500">
              {members.length} thành viên
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b">
        <div className="font-medium mb-2">Thành viên</div>
        <div className="space-y-2">
          {members.map((u) => (
            <div key={u.id} className="flex items-center gap-2">
              <img
                src={u.image}
                className="h-6 w-6 rounded-full object-cover"
              />
              <span className="text-sm truncate">{u.name || u.id}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-b">
        <div className="font-medium mb-2">Ảnh/Video</div>
        <div className="grid grid-cols-3 gap-2">
          {imagesQuick.slice(0, 9).map((m) => (
            <img
              key={m.id}
              src={m.url}
              className="aspect-square object-cover rounded"
            />
          ))}
          {imagesQuick.length === 0 && (
            <div className="text-xs text-gray-500 col-span-3">Chưa có ảnh</div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="font-medium mb-2">Tệp</div>
        <div className="space-y-2">
          {filesQuick.slice(0, 8).map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm truncate block"
            >
              📎 {f.title || f.url}
            </a>
          ))}
          {filesQuick.length === 0 && (
            <div className="text-xs text-gray-500">Chưa có tệp</div>
          )}
        </div>
        {loadingAll && (
          <div className="text-xs text-gray-500 mt-2">Đang tải…</div>
        )}
      </div>
    </aside>
  );
}
