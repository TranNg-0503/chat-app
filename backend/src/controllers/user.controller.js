import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;
    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        //{isOnboarded: true}
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Lỗi trong getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Server lỗi" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilePic nativeLanguage learningLanguage"
      );

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Lỗi trong getMyFriends controller", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}

export async function searchUsers(req, res) {
  try {
    const { query } = req.query; // /search?query=...
    const userId = req.user._id; // id của user đang đăng nhập
    let users = [];

    if (!query) {
      return res.status(400).json({ message: "Vui lòng nhập query" });
    }

    // Lấy danh sách bạn bè của user hiện tại
    const currentUser = await User.findById(userId).select("friends");
    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    const friendIds = currentUser.friends; // giả sử trường "friends" là array các ObjectId

    if (query.includes("@gmail")) {
      // Tìm trong danh sách bạn bè theo email chính xác
      users = await User.find({
        _id: { $in: friendIds },
        email: query,
      });
    } else {
      // Tìm gần đúng trong danh sách bạn bè theo fullName
      users = await User.find({
        _id: { $in: friendIds },
        fullName: { $regex: query, $options: "i" },
      });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi trong searchUsers controller:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}

export async function searchUsersForAdd(req, res) {
  try {
    const { query } = req.query;
    const userId = req.user?._id || req.user?.id; // tùy middleware bạn set

    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập query" });
    }
    if (!userId) {
      return res.status(401).json({ message: "Không xác thực được user" });
    }

    // Lấy danh sách bạn để loại
    const me = await User.findById(userId).select("friends");
    if (!me) return res.status(404).json({ message: "Không tìm thấy user" });

    const safe = escapeRegex(query.trim());
    const isEmail = query.includes("@");

    const matchCond = isEmail
      ? { email: { $regex: safe, $options: "i" } }
      : { fullName: { $regex: safe, $options: "i" } };

    const baseCond = {
      $and: [
        matchCond,
        { _id: { $ne: me._id } }, // loại chính mình
        { _id: { $nin: me.friends || [] } }, // loại đã là bạn
      ],
    };

    const users = await User.find(baseCond)
      .select("fullName email profilePic location")
      // Optional: bỏ dấu tiếng Việt khi so sánh (nếu Mongo 4.2+)
      .collation({ locale: "vi", strength: 1 }) // có thể bỏ nếu DB không hỗ trợ
      .limit(20);

    return res.status(200).json(users);
  } catch (err) {
    console.error("searchUsersForAdd error:", err);
    return res
      .status(500)
      .json({ message: "Lỗi server", detail: err?.message });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    if (myId === recipientId) {
      return res
        .status(400)
        .json({ message: "Bạn không thể gửi kết bạn đến chính bạn" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(400).json({ message: "Không tìm thấy người dùng" });
    }
    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "Bạn đã là bạn bè với người này" });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Đã tồn tại lời mời kết bạn" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Lỗi trong sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}

export async function unsendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    if (myId === recipientId) {
      return res
        .status(400)
        .json({ message: "Bạn không thể thao tác với chính mình" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Chỉ tìm lời mời do chính mình gửi
    const existingRequest = await FriendRequest.findOne({
      sender: myId,
      recipient: recipientId,
      status: "pending", // Chỉ huỷ lời mời đang chờ
    });

    if (!existingRequest) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn để huỷ" });
    }

    await FriendRequest.findByIdAndDelete(existingRequest._id);

    res.status(200).json({ message: "Đã huỷ lời mời kết bạn" });
  } catch (error) {
    console.error("Lỗi trong unsendFriendRequest controller", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}

export async function unFriend(req, res) {
  try {
    const myId = req.user.id;
    const { id: friendId } = req.params;

    if (myId === friendId) {
      return res
        .status(400)
        .json({ message: "Bạn không thể thao tác với chính mình" });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra xem có phải bạn bè không
    const me = await User.findById(myId);
    if (!me.friends.includes(friendId)) {
      return res
        .status(400)
        .json({ message: "Người này không phải bạn bè của bạn" });
    }

    // Xoá bạn bè khỏi cả 2 user
    await User.findByIdAndUpdate(myId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: myId },
    });

    // Nếu có request đã accept thì xoá luôn để sạch DB
    await FriendRequest.findOneAndDelete({
      $or: [
        { sender: myId, recipient: friendId, status: "accepted" },
        { sender: friendId, recipient: myId, status: "accepted" },
      ],
    });

    res.status(200).json({ message: "Đã huỷ kết bạn thành công" });
  } catch (error) {
    console.error("Lỗi trong unFriend controller", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
    }

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "bạn không có quyền chấp nhận yêu cầu" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Đã chấp nhận lời mời kết bạn" });
  } catch (error) {
    console.log("Lỗi trong hàm acceptFriendRequest", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}

export async function rejectFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu" });
    }

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "bạn không có quyền từ chối yêu cầu" });
    }

    // Xóa lời mời kết bạn
    await FriendRequest.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Đã từ chối và xóa lời mời kết bạn" });
  } catch (error) {
    console.log("Lỗi trong hàm rejectFriendRequest", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic location sex");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Lỗi trong hàm getFiendRequest controller", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic location sex");
    res.status(200).json({ outgoingReqs });
  } catch (error) {
    console.log("Lỗi trong hàm getOutgoingFiendReqs controller", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}
// avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res
        .status(400)
        .json({ success: false, message: "Không có file nào được upload" });
    }

    const user = await User.findById(req.user.id);
    user.profilePic = req.file.path; // Cloudinary trả về URL
    await user.save();

    // ✅ trả lại toàn bộ user để FE cập nhật
    res.json({
      success: true,
      message: "Upload avatar thành công",
      user: user,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi upload ảnh" });
  }
};

// update
export const updateMe = async (req, res) => {
  try {
    const { fullName, profile, location } = req.body;
    const userId = req.user.id; // đồng bộ

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, profile, location },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    res.json({ user: updatedUser });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// đổi pass
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User không tồn tại" });
    }

    // ✅ So sánh mật khẩu cũ
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu cũ không đúng" });
    }

    // ✅ Gán mật khẩu mới
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

export async function findNearbyUsers(req, res) {
  try {
    const userId = req.user._id;
    const { distance } = req.query; // km

    if (!distance) {
      return res.status(400).json({ message: "Thiếu khoảng cách (km)" });
    }

    const currentUser = await User.findById(userId).select("nowlocation");
    if (!currentUser || !currentUser.nowlocation) {
      return res.status(404).json({ message: "Không tìm thấy vị trí của bạn" });
    }

    const maxDistance = parseFloat(distance) * 1000; // km -> m

    const nearbyUsers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: currentUser.nowlocation.coordinates,
          },
          distanceField: "dist.calculated",
          spherical: true,
          maxDistance: maxDistance,
          query: {
            _id: { $ne: currentUser._id }, // loại chính mình
          },
        },
      },
      {
        $project: {
          fullName: 1,
          profilePic: 1,
          sex: 1,
          location: 1,
          "dist.calculated": 1,
        },
      },
    ]);

    res.status(200).json(nearbyUsers);
  } catch (error) {
    console.error("Lỗi trong findNearbyUsers controller:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
}
