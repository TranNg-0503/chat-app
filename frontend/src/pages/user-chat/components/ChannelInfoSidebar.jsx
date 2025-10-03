import React, { useMemo, useState } from "react";
import { useChannelStateContext, useChatContext } from "stream-chat-react";

export default function ChannelInfoSidebar() {
  const { channel, messages } = useChannelStateContext();
  const { client } = useChatContext();

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

  const members = useMemo(() => {
    return Object.values(channel?.state?.members || {}).map((m) => m.user);
  }, [channel?.cid]);

  const [mediaQuick, filesQuick] = useMemo(() => {
    const media = [], files = [];
    (messages || []).forEach((msg) => {
      (msg.attachments || []).forEach((att, i) => {
        if (att.type === "image") {
          media.push({
            id: `${msg.id}-${i}`,
            type: "image",
            url: att.thumb_url || att.image_url || att.asset_url,
          });
        } else if (att.type === "video") {
          media.push({
            id: `${msg.id}-${i}`,
            type: "video",
            url: att.asset_url || att.video_url,
            thumb: att.thumb_url,
            title: att.title,
          });
        } else if (att.type === "file") {
          files.push({
            id: `${msg.id}-${i}`,
            url: att.asset_url || att.image_url,
            title: att.title,
          });
        }
      });
    });
    return [media, files];
  }, [messages]);


  const [loadingAll, setLoadingAll] = useState(false);

  return (
    <aside className="basis-80 grow-0 shrink-0 border border-blue-400 flex flex-col overflow-auto rounded-lg">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <img
            src={avatar || "https://placehold.co/64x64?text=Chat"}
            className="h-12 w-12 rounded-full object-cover border border-blue-400"
          />
          <div className="min-w-0">
            <div className="font-semibold truncate">{title}</div>
            <div className="text-xs text-gray-500">
              {members.length} thành viên
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="p-4 border-b">
        <div className="font-medium mb-2">Thành viên</div>
        <div className="space-y-2">
          {members.map((u) => (
            <div key={u.id} className="flex items-center gap-2">
              <img
                src={u.image}
                className="h-6 w-6 rounded-full object-cover border border-blue-300"
              />
              <span className="text-sm truncate">{u.name || u.id}</span>
            </div>
          ))}
        </div>
      </div>

     
      {/* Images & Videos */}
      <div className="p-4 border-b">
        <div className="font-medium mb-2">Ảnh/Video</div>
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {mediaQuick.map((m) =>
            m.type === "image" ? (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <img
                  src={m.url}
                  className="w-20 h-20 object-cover rounded-md border border-blue-300 hover:opacity-80 transition"
                />
              </a>
            ) : (
              <video
                key={m.id}
                src={m.url}
                controls
                className="w-20 h-20 object-cover rounded-md border border-blue-300"
              />
            )
          )}
          {mediaQuick.length === 0 && (
            <div className="text-xs text-gray-500 col-span-3">Chưa có ảnh hoặc video</div>
          )}
        </div>
      </div>


      {/* Files */}
      <div className="p-4">
        <div className="font-medium mb-2">Tệp</div>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {filesQuick.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 p-2 rounded-md border border-blue-400 text-sm truncate hover:bg-blue-50 transition"
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
