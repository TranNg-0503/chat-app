import bcrypt from "bcryptjs";
import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true, 
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  profile: {
    type: String, 
    default: "",
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    trim: true,
  },
  profilePic: {
  type: String,
  default: "",
   },

  sex: {
    type: String,
    enum: ["Nam", "Nữ", "Khác"], 
  },
   isOnboarded: {
      type: Boolean,
      default: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
}, { timestamps: true });
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
const User = mongoose.model("User", userSchema);
export default User;