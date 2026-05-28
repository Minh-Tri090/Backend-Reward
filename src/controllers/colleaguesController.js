import User from "../models/user.js";

export const listColleagues = async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user.id },
    isActive: true,
    role: { $ne: "admin" },
    department: { $nin: ["Chưa phân phòng", "", null] },
  })
    .select("name email points avatar jobTitle department office")
    .sort({ name: 1 })
    .lean();
  res.json(users);
};
