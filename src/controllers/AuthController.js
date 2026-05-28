import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getHalfYearKey, getMonthKey, syncUserPointCycles } from "../utils/pointCycles.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, department, dateOfBirth } = req.body;
    const dep = ["VP1", "VP2", "VPC"].includes(String(department).trim())
      ? String(department).trim()
      : "VP1";

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      department: dep,
      dateOfBirth: dateOfBirth || null,
      pointMonthKey: getMonthKey(),
      totalCycleKey: getHalfYearKey(),
    });

    const safe = await User.findById(user._id).select("-password");
    res.status(201).json(safe);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) return res.status(400).json({ message: "Wrong password" });

  if (!user.isActive) {
    return res.status(403).json({
      message:
        "Tài khoản đã bị vô hiệu hóa. Không thể đăng nhập. Liên hệ quản trị viên.",
      code: "ACCOUNT_DISABLED",
    });
  }

  const adminEmail = process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase();
  if (
    adminEmail &&
    user.email.toLowerCase() === adminEmail &&
    user.role !== "admin"
  ) {
    user.role = "admin";
    await user.save();
  }

  const fresh = await User.findById(user._id);
  await syncUserPointCycles(fresh);
  const token = jwt.sign(
    { id: fresh._id, role: fresh.role },
    "SECRET_KEY"
  );

  const safe = fresh.toObject();
  delete safe.password;

  res.json({ token, user: safe });
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  await syncUserPointCycles(user);
  res.json(user);
};

export const updateProfile = async (req, res) => {
  const { name, email, avatar, dateOfBirth, currentPassword, newPassword } = req.body;
  const update = {};
  if (typeof name === "string") update.name = name;
  if (typeof email === "string") update.email = email;
  if (typeof avatar === "string") update.avatar = avatar;
  if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth || null;

  // Password change flow
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: "Cần nhập mật khẩu hiện tại để đổi mật khẩu" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải ít nhất 6 ký tự" });
    }
    const userDoc = await User.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, userDoc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }
    update.password = await bcrypt.hash(newPassword, 10);
  }

  try {
    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
      runValidators: true
    }).select("-password");
    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }
    res.status(500).json({ message: "Cập nhật hồ sơ thất bại" });
  }
};
