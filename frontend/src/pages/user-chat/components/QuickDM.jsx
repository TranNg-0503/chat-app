import { useState, useEffect, useContext } from "react";
import CreateGroupChatModal from "./CreateGroupChatModal";
import { useDebounce } from "../../../utilities/hooks/useDebounce";
import api from "../../../api";
import { UserContext } from "../../../components/providers/AuthProvider";

const searchUserRequest = async (query) => {
  const { data: results } = await api.get(`/users/search`, {
    params: {
      query,
    },
  });

  return results;
};

function QuickDM({ onCreateDM, onCreateGroup, className }) {
  const { user } = useContext(UserContext);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const searchDebounced = useDebounce(search, 500);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchDebounced.trim()) {
        return;
      }

      const results = await searchUserRequest(searchDebounced);

      setSearchResults(results.filter((result) => result._id !== user?._id));
    };

    searchUsers();
  }, [searchDebounced, user]);

  const handleCreateDM = (userId) => {
    setSearchResults([]);
    setSearch("");
    onCreateDM(userId);
  };

  const handleSearchUser = async () => {
    if (!search.trim()) {
      return;
    }

    try {
      const { data: searchResults } = await api.get(`/users/search`, {
        params: {
          query: search,
        },
      });

      handleCreateDM(searchResults[0]._id);
    } catch (error) {
      console.error("Lỗi trong hàm searchUser:", error);
    }
  };

  return (
    <div className={className + " flex gap-2 items-center p-2 bg-base-100"}>
      <div className="dropdown w-full">
        <input
          placeholder="Nhập email của user muốn chat 1 - 1"
          className="input input-bordered w-full "
          type="email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul
          tabIndex="0"
          className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full max-h-80 flex-nowrap overflow-auto"
        >
          {searchResults.length > 0 ? (
            searchResults.map((result) => (
              <li key={result._id}>
                <button
                  className="flex items-center gap-2 w-full"
                  onClick={() => handleCreateDM(result._id)}
                >
                  <img
                    src={result.profilePic}
                    alt={result.fullName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex flex-col">
                    {result.fullName}
                    <span className="text-sm text-gray-500">
                      {result.email}
                    </span>
                  </div>
                </button>
              </li>
            ))
          ) : (
            <li className="flex items-center justify-center w-full">
              <span className="text-sm text-gray-500">Không tìm thấy user</span>
            </li>
          )}
        </ul>
      </div>

      <button onClick={handleSearchUser} className="btn btn-neutral">
        Tạo chat
      </button>

      <button
        onClick={() => setShowGroupModal(true)}
        className="btn btn-neutral"
      >
        Tạo chat nhóm
      </button>

      {/* Group modal */}
      <CreateGroupChatModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreateGroup={onCreateGroup}
      />
    </div>
  );
}
export default QuickDM;
