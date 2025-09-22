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
      if (pendingAdd.size > 0) {
        await channel.addMembers(Array.from(pendingAdd));
      }
      if (pendingRemove.size > 0) {
        await channel.removeMembers(Array.from(pendingRemove));
      }
      const finalCount = members.length;
      if (finalCount <= 1) {
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
        <div className="mb-2">
          <input
            type="text"
            placeholder="Tìm người dùng để thêm vào nhóm"
            className="input input-bordered w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ul className="menu bg-base-200 max-h-56 overflow-auto rounded-box">
          {searchResults.length > 0 ? (
            searchResults.map((user) => (
              <li key={user._id}>
                <button
                  onClick={() => handleAddUser(user)}
                  className="flex items-center gap-2"
                  disabled={!!members.find((m) => m._id === user._id)}
                >
                  <img
                    src={user.profilePic}
                    className="w-8 h-8 rounded-full"
                    alt={user.fullName}
                  />
                  <span>{user.fullName}</span>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="text-center text-sm text-gray-500 py-2">
              {search.trim()
                ? "Không tìm thấy người dùng"
                : "Nhập từ khoá để tìm"}
            </li>
          )}
        </ul>

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
