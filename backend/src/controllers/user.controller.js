import User from "../models/User.js";

export async function getRecommendedUsers(req, res) {
    
    try {
        const currentUserId = req.user.id;
        const currentUser = req.user;
        const recommendedUsers = await User.find({
            $and: [
                {_id: {$ne: currentUserId}},
                {_id: {$nin: currentUser.friends}}
                //{isOnboarded: true}
            ]
        })
        res.status(200).json(recommendedUsers);
    }   catch (error) {
        console.error("Lỗi trong getRecommendedUsers controller", error.message);
        res.status(500).json({message: "Server lỗi"});
    }
}

export async function getMyFriends(req, res){
    try{
        const user = await User.findById(req.user.id)
        .select("friends")
        .populate("friends", "fullName profilePic nativeLanguage learningLanguage");
        
        res.status(200).json(user.friends)
    } catch (error){
        console.error("Lỗi trong getMyFriends controller", error.message);
        res.status(500).json({message: "Lỗi server"});
    }
}

export async function searchUsers(req, res) {
    try {
        const { query } = req.query; // Lấy input từ query param, vd: /search?query=...
        let users = [];

        if (!query) {
            return res.status(400).json({ message: "Vui lòng nhập query" });
        }

        if (query.includes("@gmail")) {
            // Tìm chính xác email
            users = await User.find({ email: query });
        } else {
            // Tìm gần đúng fullName, case-insensitive
            users = await User.find({ fullName: { $regex: query, $options: "i" } });
        }

        res.status(200).json(users);
    } catch (error) {
        console.error("Lỗi trong searchUsers controller:", error.message);
        res.status(500).json({ message: "Lỗi server" });
    }
}
