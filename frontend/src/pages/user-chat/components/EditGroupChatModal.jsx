import React, { useEffect, useState, useContext } from "react";
import api from "../../../api";
import { useDebounce } from "../../../utilities/hooks/useDebounce";
import { UserContext } from "../../../components/providers/AuthProvider";

function EditGroupChatModal({ open, onClose, channel }) {
  const { user } = useContext(UserContext);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [members, setMembers] = useState([]);
  const [pendingAdd, setPendingAdd] = useState(new Set());
  const [pendingRemove, setPendingRemove] = useState(new Set());

  // derive members from channel whenever it changes
  useEffect(() => {
    if (!channel || !open) return;
    const mem = Object.values(channel.state.members).map((m) => ({
      _id: m.user_id,
      fullName: m.user?.name || m.user?.fullName || m.user_id,
      email: m.user?.email,
      profilePic: m.user?.image,
    }));

    setMembers(mem);
    setPendingAdd(new Set());
    setPendingRemove(new Set());
    setSearch("");
    setSearchResults([]);
  }, [channel, open]);

  // debounce search
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!debouncedSearch.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await api.get("/users/search", {
          params: { query: debouncedSearch },
        });

        setSearchResults(data.filter((u) => u._id !== user?._id));
      } catch (err) {
        console.error("Error searching users", err);
      }
    };
    fetchUsers();
  }, [debouncedSearch, user]);

  const handleAddUser = (user) => {
    if (members.find((m) => m._id === user._id)) return;
    setMembers((prev) => [...prev, user]);
    setPendingAdd((prev) => new Set(prev).add(String(user._id)));
    // ensure it's not scheduled for removal anymore
    setPendingRemove((prev) => {
      const next = new Set(prev);
      next.delete(String(user._id));
      return next;
    });
  };

  const handleRemoveUserClick = (userId) => {
    if (userId === user?._id) return;
    setMembers((prev) => prev.filter((m) => m._id !== userId));
    setPendingRemove((prev) => new Set(prev).add(String(userId)));
    setPendingAdd((prev) => {
      const next = new Set(prev);
      next.delete(String(userId));
      return next;
    });
  };

  const resetState = () => {
    setSearch("");
    setSearchResults([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const newMembers = Array.from(pendingAdd);
      const removedMembers = Array.from(pendingRemove);

      // Nếu channel là distinct, không thể add member, phải tạo kênh mới
      if (channel?.data?.distinct) {
        // tạo kênh mới với member mới
        const updatedMembers = members.map((m) => m._id); // tất cả member hiện tại
        const newChannel = await channel.client.channel('messaging', {
          members: updatedMembers,
          distinct: true, // tuỳ bạn muốn tạo kênh distinct hay không
        });
        await newChannel.create();
        console.log('✅ Tạo kênh mới thành công cho member mới');
      } else {
        // channel bình thường, có thể thêm/xoá member
        if (newMembers.length > 0) {
          await channel.addMembers(newMembers);
        }
        if (removedMembers.length > 0) {
          await channel.removeMembers(removedMembers);
        }
      }

      // Nếu chỉ còn 1 member, xoá channel
      if (members.length <= 2) {
        await channel.delete();
      }

      handleClose();
    } catch (err) {
      console.error("Error applying member changes", err);
    }
  };


  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-xl">
        <h3 className="font-bold text-lg mb-4">Chỉnh sửa thành viên nhóm</h3>

        {/* Current members */}
        <div className="mb-4">
          <label className="label text-sm font-medium mb-1">
            Thành viên hiện tại
          </label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div
                key={m._id}
                className="badge gap-1 cursor-pointer"
                onClick={() => handleRemoveUserClick(m._id)}
              >
                {m.fullName || m.email}
                {m._id !== user?._id && <span className="ml-1">✕</span>}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Nhấn vào thành viên để xoá. Bạn không thể xoá chính mình.
          </p>
        </div>

        {/* Search to add new */}


        <div className="modal-action mt-4">
          <button className="btn" onClick={handleClose}>
            Huỷ
          </button>
          <button
            className="btn btn-neutral"
            disabled={pendingAdd.size === 0 && pendingRemove.size === 0}
            onClick={handleSubmit}
          >
            Lưu
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  );
}

export default EditGroupChatModal;
