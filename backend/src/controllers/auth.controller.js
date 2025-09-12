import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
export async function signup(req, res) {
  const { email, password, fullName,dateOfBirth,sex } = req.body;

  try {
    if (!email || !password || !fullName || !dateOfBirth || !sex) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Định dạng email không hợp lệ" });
    }
    if (!["Nam", "Nữ", "Khác"].includes(sex)) {
      return res.status(400).json({ message: "Giới tính không hợp lệ" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại, vui lòng dùng email khác" });
    }
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ message: "Ngày sinh không hợp lệ" });
    }
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
    const isBirthdayPassed =
      monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0);

    const realAge = isBirthdayPassed ? age : age - 1;
    if (realAge < 15) {
      return res.status(400).json({ message: "Bạn phải ít nhất 15 tuổi để đăng ký" });
    }
    const idx = Math.floor(Math.random() * 100) + 1; 
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      email,
      fullName,
      password,
      dateOfBirth: dob,
      sex,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Đã tạo Stream user cho ${newUser.fullName}`);
    } catch (error) {
      console.log("Lỗi khi tạo Stream user:", error);
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, 
      sameSite: "strict", 
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log("Lỗi trong hàm signup:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
}

export async  function login (req,res){
    try {
      const {email, password } = req.body;
      if(!email || !password){
        return res.status(400).json({message: "Vui lòng điền đầy đủ thông tin"});
      }
      const user = await User.findOne({email});
      if(!user) return res.status(401).json({message: "Sai email hoặc password"});

      const isPasswordCorrect = await user.matchPassword(password)
      if(!isPasswordCorrect) return res.status(401).json({message: "Sai email hoặc mật khẩu"})
    
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "7d",
      });

      res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, 
        sameSite: "strict", 
        secure: process.env.NODE_ENV === "production",
      });

      res.status(200).json({success: true, user});
    
      } catch (error) {
        console.log("Lỗi trong hàm đăng nhập:", error);
        res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
    }
}
export async function logout (req,res){
    res.clearCookie("jwt")
    res.status(200).json({success: true, message: "Đăng xuất thành công"});

}