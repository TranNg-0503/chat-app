import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/sidebar";
import api from "../api";
import { Users, UserPlus, MailCheck, Search, Loader2 } from "lucide-react";

export default function Friend() {
  const [activeTab, setActiveTab] = useState("friends"); // friends | requests | discover
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);

  const [incomingReqs, setIncomingReqs] = useState([]); // lời mời đến
  const [acceptedReqs, setAcceptedReqs] = useState([]); // đã chấp nhận
  const [outgoingReqs, setOutgoingReqs] = useState([]); // đã gửi

  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [distance, setDistance] = useState(5); // mặc định 5 km
  const [nearby, setNearby] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  // set các id bạn bè để check nhanh
  const friendIds = useMemo(() => new Set(friends.map(f => f._id)), [friends]);


  // ---- helpers
  const requesterIdsPending = useMemo(
    () => new Set(outgoingReqs.map((r) => r.recipient?._id || r.recipient)),
    [outgoingReqs]
  );
  //người gần đây
  const fetchNearby = async () => {
    setNearbyLoading(true);
    try {
      const res = await api.get("/users/find-nearby-users", {
        params: { distance }, // lấy từ state
        withCredentials: true,
      });
      setNearby(res.data || []);
    } catch (e) {
      console.error("GET nearby users error:", e);
    } finally {
      setNearbyLoading(false);
    }
  };

  // ---- load data
  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/friends", { withCredentials: true });
      setFriends(res.data || []);
    } catch (e) {
      console.error("GET friends error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // incoming + accepted
      const res = await api.get("/users/friend-request", {
        withCredentials: true,
      });
      setIncomingReqs(res.data?.incomingReqs || []);
      setAcceptedReqs(res.data?.acceptedReqs || []);

      // outgoing pending
      const out = await api.get("/users/outgoing-friend-request", {
        withCredentials: true,
      });

      setOutgoingReqs(out.data.outgoingReqs || []);
    } catch (e) {
      console.error("GET friend-requests error:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    setDiscoverLoading(true);
    try {
      const res = await api.get("/users", { withCredentials: true });
      setRecommended(res.data || []);
    } catch (e) {
      console.error("GET /users (recommended) error:", e);
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    // load mặc định
    fetchFriends();
    fetchRequests();
    fetchRecommended();
  }, []);

  // ---- actions
  const acceptRequest = async (requestId) => {
    try {
      await api.put(`/users/friend-request/${requestId}/accept`, null, {
        withCredentials: true,
      });
      // refresh
      await Promise.all([fetchFriends(), fetchRequests()]);
    } catch (e) {
      console.error("Accept friend request error:", e);
      alert("Không thể chấp nhận yêu cầu. Vui lòng thử lại.");
    }
  };
  const rejectRequest = async (requestId) => {
    try {
      await api.delete(`/users/friend-request/${requestId}/reject`, {
        withCredentials: true,
      });
      // refresh
      await Promise.all([fetchFriends(), fetchRequests()]);
    } catch (e) {
      console.error("Reject friend request error:", e);
      alert("Không thể từ chối yêu cầu. Vui lòng thử lại.");
    }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post(`/users/friend-request/${userId}`, null, {
        withCredentials: true,
      });
      // refresh outgoing
      await fetchRequests();
    } catch (e) {
      console.error("Send friend request error:", e);
      alert(e?.response?.data?.message || "Gửi lời mời thất bại.");
    }
  };

  const unsendRequest = async (userId) => {
    try {
      await api.delete(`/users/friend-request/${userId}`, {
        withCredentials: true,
      });
      // refresh outgoing
      await fetchRequests();
    } catch (e) {
      console.error("Unsend friend request error:", e);
      alert(e?.response?.data?.message || "Hủy lời mời thất bại.");
    }
  };

  const unFriend = async (userId) => {
    try {
      await api.delete(`/users/friends/${userId}`, {
        withCredentials: true,
      });
      // refresh outgoing
      await fetchFriends();
    } catch (e) {
      console.error("Unfriend request error:", e);
      alert(e?.response?.data?.message || "Hủy kết bạn thất bại.");
    }
  };

  // ---- search (debounce nhẹ)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await api.get(`/users/search`, {
          params: { query },
          withCredentials: true,
        });
        setSearchResults(res.data || []);
      } catch (e) {
        console.error("Search users error:", e);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  // ---- small UI bits
  const Tab = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-xl border ${
        activeTab === id ? "bg-base-100 shadow font-semibold" : "opacity-80"
      } flex items-center gap-2`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  const PersonItem = ({ person, right }) => (
    <li className="card bg-base-100 shadow p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <img
          src={person.profilePic}
          alt={person.fullName}
          className="w-12 h-12 rounded-full border"
        />
        <div className="flex flex-col">
          <span className="font-medium">{person.fullName}</span>
          {person.email && (
            <span className="text-sm opacity-70">{person.email}</span>
          )}
          {person.location && (
            <span className="text-sm opacity-70">{person.location}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </li>
  );

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Header */}
      <header className="flex items-center justify-between bg-base-100 shadow px-6 py-3">
        <h1 className="text-lg font-semibold">Kết bạn & Bạn bè</h1>

        <div className="flex items-center gap-2">
          <Tab id="friends" icon={Users} label="Bạn bè" />
          <Tab id="requests" icon={MailCheck} label="Lời mời" />
          <Tab id="discover" icon={UserPlus} label="Khám phá" />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 p-6 space-y-6">
        {/* Friends */}
        {activeTab === "friends" && (
          <section className="space-y-4">
            <h2 className="font-semibold">Danh sách bạn bè</h2>
            {loading ? (
              <div className="flex items-center gap-2 opacity-80">
                <Loader2 className="animate-spin" size={18} /> Đang tải...
              </div>
            ) : friends.length === 0 ? (
              <p>Chưa có bạn bè nào.</p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((f) => (
                  <PersonItem key={f._id} person={f}
                  right={
                    <button 
                      className="btn btn-sm btn-error"
                      onClick={() => unFriend(f._id)}
                    >
                      Hủy kết bạn
                    </button>
                  } />
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Requests */}
        {activeTab === "requests" && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Incoming */}
            <div className="space-y-4">
              <h2 className="font-semibold">Lời mời đến</h2>
              {loading ? (
                <div className="flex items-center gap-2 opacity-80">
                  <Loader2 className="animate-spin" size={18} /> Đang tải...
                </div>
              ) : incomingReqs.length === 0 ? (
                <p>Không có lời mời nào.</p>
              ) : (
                <ul className="space-y-3">
                  {incomingReqs.map((req) => (
                    <PersonItem
                      key={req._id}
                      person={req.sender}
                      right={
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => acceptRequest(req._id)}
                            className="btn btn-sm btn-primary"
                          >
                            Chấp nhận
                          </button>
                          <button
                            onClick={() => rejectRequest(req._id)}
                            className="btn btn-sm btn-error"
                          >
                            Từ chối
                          </button>
                        </div>
                      }
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Outgoing pending + Accepted (tham khảo) */}
            <div className="space-y-4">
              <h2 className="font-semibold">Đã gửi / Đã kết bạn</h2>

              <div className="space-y-2">
                <h3 className="text-sm opacity-70">Đã gửi (chờ phản hồi)</h3>
                {loading ? (
                  <div className="flex items-center gap-2 opacity-80">
                    <Loader2 className="animate-spin" size={18} /> Đang tải...
                  </div>
                ) : outgoingReqs.length === 0 ? (
                  <p>Không có lời mời đã gửi.</p>
                ) : (
                  <ul className="space-y-3">
                    {outgoingReqs.map((req) => (
                      <PersonItem
                        key={req._id}
                        person={req.recipient}
                        right={<div className="flex items-center gap-2">
                                <span className="badge">Đang chờ</span>
                                <button
                                  onClick={() => unsendRequest(req.recipient._id)}
                                  className="btn btn-sm btn-error"
                                >
                                  Hủy lời mời
                                </button>
                              </div>}
                      />
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm opacity-70">Đã chấp nhận gần đây</h3>
                {acceptedReqs.length === 0 ? (
                  <p>Chưa có bản ghi.</p>
                ) : (
                  <ul className="space-y-3">
                    {acceptedReqs.map((req) => (
                      <PersonItem
                        key={req._id}
                        person={req.recipient}
                        right={
                          <span className="badge badge-success">Đã là bạn</span>
                        }
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Discover */}
        {activeTab === "discover" && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="join w-full max-w-xl">
                <input
                  type="text"
                  className="input input-bordered join-item w-full"
                  placeholder="Tìm theo tên hoặc email (ví dụ: @gmail)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="btn join-item">
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Search results */}
            {query.trim() && (
              <div className="space-y-3">
                <h3 className="font-semibold">Kết quả tìm kiếm</h3>
                {searching ? (
                  <div className="flex items-center gap-2 opacity-80">
                    <Loader2 className="animate-spin" size={18} /> Đang tìm...
                  </div>
                ) : searchResults.length === 0 ? (
                  <p>Không tìm thấy người dùng.</p>
                ) : (
                  <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((u) => (
                      <PersonItem
                        key={u._id}
                        person={u}
                        right={
                          friendIds.has(u._id) ? (
                            <span className="badge badge-success">Bạn bè</span>
                          ) : requesterIdsPending.has(u._id) ? (
                            <span className="badge">Đã gửi</span>
                          ) : (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => sendRequest(u._id)}
                            >
                              Kết bạn
                            </button>
                          )
                        }
                      />
                    ))}
                  </ul>

                )}
              </div>
            )}

             {/* Nearby users */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Người gần bạn</h3>
                <input
                  type="number"
                  min={1}
                  className="input input-bordered w-24"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
                <button className="btn btn-sm btn-primary" onClick={fetchNearby}>
                  Tìm
                </button>
                <span className="text-sm opacity-70">km</span>
              </div>

              {nearbyLoading ? (
                <div className="flex items-center gap-2 opacity-80">
                  <Loader2 className="animate-spin" size={18} /> Đang tải...
                </div>
              ) : nearby.length === 0 ? (
                <p>Không có ai gần bạn trong phạm vi này.</p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearby.map((u) => (
                  <PersonItem
                    key={u._id}
                    person={u}
                    right={
                      friendIds.has(u._id) ? (
                        <span className="badge badge-success">Bạn bè</span>
                      ) : requesterIdsPending.has(u._id) ? (
                        <span className="badge">Đã gửi</span>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => sendRequest(u._id)}
                        >
                          Kết bạn
                        </button>
                      )
                    }
                  />
                ))}
              </ul>

              )}
            </div>


            {/* Recommended */}
            <div className="space-y-3">
              <h3 className="font-semibold">Gợi ý kết bạn</h3>
              {discoverLoading ? (
                <div className="flex items-center gap-2 opacity-80">
                  <Loader2 className="animate-spin" size={18} /> Đang tải...
                </div>
              ) : recommended.length === 0 ? (
                <p>Chưa có gợi ý.</p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommended.map((u) => (
                    <PersonItem
                      key={u._id}
                      person={u}
                      right={
                        requesterIdsPending.has(u._id) ? (
                          <span className="badge">Đã gửi</span>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => sendRequest(u._id)}
                          >
                            Kết bạn
                          </button>
                        )
                      }
                    />
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
