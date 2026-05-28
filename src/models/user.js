import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  points: {
    type: Number,
    default: 0
  },

  monthlyTransferQuota: {
    type: Number,
    default: 0,
    min: 0,
  },

  monthlyEarned: {
    type: Number,
    default: 0,
    min: 0,
  },

  totalEarned: {
    type: Number,
    default: 0,
    min: 0,
  },

  totalCycleEarned: {
    type: Number,
    default: 0,
    min: 0,
  },

  pointMonthKey: {
    type: String,
    default: "",
  },

  totalCycleKey: {
    type: String,
    default: "",
  },

  department: {
    type: String,
    default: "Chưa phân phòng",
    trim: true,
  },

  jobTitle: {
    type: String,
    default: "",
    trim: true,
  },

  dateOfBirth: {
    type: Date,
    default: null,
  },

  avatar: {
    type: String
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  // 🔥 Lark fields
  larkOpenId: String,
  unionId: String,

  departmentIds: [String],

  office: String
});

export default mongoose.models.User || mongoose.model("User", userSchema);