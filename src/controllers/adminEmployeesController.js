import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import PointEvent from "../models/pointEvent.js";
import { getHalfYearKey, getMonthKey } from "../utils/pointCycles.js";

const ALLOWED_DEPARTMENTS = new Set(["VP1", "VP2", "VPC"]);

export const createEmployee = async (req, res) => {
  const { name, email, password, initialPoints, department, jobTitle, dateOfBirth } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ message: "Cần họ tên và email" });
  }

  let pwd = password;
  let temporaryPassword = null;
  if (!pwd || String(pwd).length < 6) {
    temporaryPassword = crypto.randomBytes(9).toString("base64url").slice(0, 14);
    pwd = temporaryPassword;
  }

  const hashed = await bcrypt.hash(pwd, 10);
  const initial = Math.max(0, Math.floor(Number(initialPoints) || 0));

  try {
    const user = await User.create({
      name: name.trim(),
      email: String(email).trim().toLowerCase(),
      password: hashed,
      role: "user",
      points: initial,
      department: ALLOWED_DEPARTMENTS.has(String(department).trim())
        ? String(department).trim()
        : "VP1",
      jobTitle: typeof jobTitle === "string" ? jobTitle.trim() : "",
      dateOfBirth: dateOfBirth || null,
      pointMonthKey: getMonthKey(),
      totalCycleKey: getHalfYearKey(),
    });

    if (initial > 0) {
      await PointEvent.create({
        type: "admin_bonus",
        amount: initial,
        fromUser: req.user.id,
        toUser: user._id,
        note: "Điểm khởi tạo khi tạo nhân viên",
      });
    }

    const safe = await User.findById(user._id).select("-password");
    res.status(201).json({
      user: safe,
      ...(temporaryPassword && { temporaryPassword }),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }
    res.status(500).json({ message: "Không tạo được nhân viên" });
  }
};

export const patchEmployee = async (req, res) => {
  const { id } = req.params;
  const { isActive, department, jobTitle, dateOfBirth, name, email } = req.body;
  const hasIsActive = typeof isActive === "boolean";
  const hasDepartment = typeof department === "string";
  const hasJobTitle = typeof jobTitle === "string";
  const hasDOB = dateOfBirth !== undefined;
  const hasName = typeof name === "string" && name.trim();
  const hasEmail = typeof email === "string" && email.trim();

  if (!hasIsActive && !hasDepartment && !hasJobTitle && !hasDOB && !hasName && !hasEmail) {
    return res.status(400).json({
      message: "Không có trường nào để cập nhật",
    });
  }

  if (String(id) === String(req.user.id)) {
    return res
      .status(400)
      .json({ message: "Không thể thay trạng thái chính tài khoản của bạn" });
  }

  const target = await User.findById(id);
  if (!target) {
    return res.status(404).json({ message: "Không tìm thấy nhân viên" });
  }

  if (hasIsActive) target.isActive = isActive;
  if (hasDepartment) {
    const next = String(department).trim();
    if (!ALLOWED_DEPARTMENTS.has(next)) {
      return res.status(400).json({ message: "Department không hợp lệ (VP1/VP2/VPC)" });
    }
    target.department = next;
  }
  if (hasJobTitle) target.jobTitle = String(jobTitle).trim();
  if (hasDOB) target.dateOfBirth = dateOfBirth || null;
  if (hasName) target.name = String(name).trim();
  if (hasEmail) target.email = String(email).trim().toLowerCase();
  await target.save();


  const safe = await User.findById(id).select("-password");
  res.json(safe);
};
