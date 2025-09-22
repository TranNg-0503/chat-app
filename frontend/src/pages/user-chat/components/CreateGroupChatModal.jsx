import React, { useState, useEffect } from "react";
import { useDebounce } from "../../../utilities/hooks/useDebounce";
import api from "../../../api";

function CreateGroupChatModal({ open, onClose, onCreateGroup }) {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // debounce search input
  const debouncedSearch = useDebounce(search, 500);

  // fetch users when search term changes
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
        setSearchResults(data);
      } catch (error) {
        console.error("Error searching users", error);
      }
    };

    fetchUsers();
  }, [debouncedSearch]);

  // helper handlers
  const addUser = (user) => {
    if (selectedUsers.find((u) => u._id === user._id)) return;
    setSelectedUsers((prev) => [...prev, user]);
  };

  const removeUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const resetState = () => {
    setGroupName("");
    setSearch("");
    setSearchResults([]);
    setSelectedUsers([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0 || !groupName.trim()) return;
    const memberIds = selectedUsers.map((u) => u._id);
    await onCreateGroup(memberIds, groupName.trim());
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-xl">
        <h3 className="font-bold text-lg mb-4">Tạo nhóm chat mới</h3>

        {/* Group name */}
        <div className="mb-4">
          <label className="label text-sm font-medium mb-1">
            Tên nhóm (bắt buộc)
          </label>
          <input
            type="text"
            placeholder="Nhập tên nhóm"
            className="input input-bordered w-full"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        {/* Selected members */}
        {selectedUsers.length > 0 && (
          <div className="mb-4">
            <label className="label text-sm font-medium mb-1">
              Thành viên đã chọn
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((u) => (
                <div
                  key={u._id}
                  className="badge badge-neutral gap-1 cursor-pointer"
                  onClick={() => removeUser(u._id)}
                >
                  {u.fullName || u.email}
                  <span className="ml-1">✕</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-2">
          <input
            type="text"
            placeholder="Tìm kiếm người dùng theo tên hoặc email"
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
                  onClick={() => addUser(user)}
                  className="flex items-center gap-2"
                  disabled={selectedUsers.find((u) => u._id === user._id)}
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
            onClick={handleCreateGroup}
            disabled={selectedUsers.length === 0 || !groupName.trim()}
          >
            Tạo nhóm
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  );
}

export default CreateGroupChatModal;
