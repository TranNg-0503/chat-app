import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { transporter } from "../lib/mailer.js";

export async function signup(req, res) {
  const { email, password, fullName, dateOfBirth, sex } = req.body;

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
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ message: "Ngày sinh không hợp lệ" });
    }

    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const isBirthdayPassed =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    const realAge = isBirthdayPassed ? age : age - 1;
    if (realAge < 15) {
      return res.status(400).json({ message: "Bạn phải ít nhất 15 tuổi để đăng ký" });
    }

    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    // tạo token xác minh
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await User.create({
      email,
      fullName,
      password,
      dateOfBirth: dob,
      sex,
      profilePic: randomAvatar,
      isVerified: false,
      verificationToken,
      verificationExpires: Date.now() + 60 * 60 * 1000, // 1 giờ
    });

    const verifyLink = `http://localhost:5001/verify?token=${verificationToken}`;

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Xác nhận đăng ký tài khoản",
      html: `<p>Xin chào ${fullName},</p>
             <p>Bạn hãy nhấn vào link sau để xác nhận email:</p>
             <a href="${verifyLink}">${verifyLink}</a>
             <p>Link có hiệu lực trong 1 giờ.</p>`,
    });

    res.status(200).json({ message: "Vui lòng kiểm tra email để xác nhận đăng ký" });
  } catch (error) {
    console.log("Lỗi trong hàm signup:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
}

export async function verifyEmail(req, res) {
  const { token } = req.query;

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send("Token không hợp lệ hoặc đã hết hạn");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    await upsertStreamUser({
      id: user._id.toString(),
      name: user.fullName,
      image: user.profilePic || "",
    });

    // 👉 Redirect về trang login frontend
    return res.redirect("http://localhost:5173/login");
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).send("Lỗi máy chủ");
  }
}


export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Vui lòng xác minh email trước khi đăng nhập" });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Lỗi trong hàm đăng nhập:", error);
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại sau" });
  }
}

export async function logout(req, res) {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production", // thêm lại cho khớp
    path: "/", // quan trọng
  });
  return res.status(200).json({ success: true, message: "Đăng xuất thành công" });
}



export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, profile, location } = req.body;
    if (!fullName || !profile || !location) {
      return res.status(400).json({
        message: "Thiếu thông tin",
        missingFields: [
          !fullName && "fullName",
          !profile && "profile",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...req.body, isOnboarded: true },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user update after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Error updating Stream user:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
