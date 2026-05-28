import User from "../models/user.js";
import { getHalfYearKey, getMonthKey } from "../utils/pointCycles.js";

function toTierLabel(points) {
  const p = Number(points) || 0;
  if (p <= 0) return "Unrated";
  if (p <= 500) return "Bronze";
  if (p <= 1000) return "Silver";
  if (p <= 1500) return "Gold";
  if (p <= 2000) return "Platinum";
  // Clamp highest tier to Diamond (matches requested badges)
  return "Diamond";
}

export const getMonthlyRanking = async (req, res) => {
  const me = await User.findById(req.user.id).select("role department").lean();
  if (!me) return res.status(404).json({ message: "User not found" });

  const currentMonthKey = getMonthKey();

  const filter = { isActive: true, role: { $ne: "admin" } };
  if (me.role !== "admin") {
    filter.department = me.department || "Chưa phân phòng";
  }

  const rows = await User.find(filter)
    .select("name avatar department monthlyEarned pointMonthKey")
    .lean();

  const mapped = rows
    .map((u) => {
      const monthlyPoints =
        u.pointMonthKey === currentMonthKey ? u.monthlyEarned || 0 : 0;
      return {
        name: u.name,
        department: u.department || "Chưa phân phòng",
        avatar: u.avatar || "",
        monthlyPoints,
        tier: toTierLabel(monthlyPoints),
      };
    })
    .sort(
      (a, b) =>
        (b.monthlyPoints || 0) - (a.monthlyPoints || 0) ||
        String(a.name).localeCompare(String(b.name), "vi"),
    )
    .map((r, idx) => ({
      ...r,
      rank: idx + 1,
      medal: idx === 0 ? "Top 1" : idx === 1 ? "Top 2" : idx === 2 ? "Top 3" : "",
    }));

  res.json({
    scope: me.role === "admin" ? "all" : "department",
    department: me.role === "admin" ? null : me.department || "Chưa phân phòng",
    rows: mapped,
  });
};

export const getTotalRanking = async (req, res) => {
  const me = await User.findById(req.user.id).select("role").lean();
  if (!me) return res.status(404).json({ message: "User not found" });

  const currentCycleKey = getHalfYearKey();

  const rows = await User.find({ isActive: true, role: { $ne: "admin" } })
    .select("name avatar department totalCycleEarned totalCycleKey")
    .lean();

  const mapped = rows
    .map((u) => {
      const total = u.totalCycleKey === currentCycleKey ? u.totalCycleEarned || 0 : 0;
      return {
        name: u.name,
        department: u.department || "Chưa phân phòng",
        avatar: u.avatar || "",
        totalPoints: total,
        tier: toTierLabel(total),
      };
    })
    .sort(
      (a, b) =>
        (b.totalPoints || 0) - (a.totalPoints || 0) ||
        String(a.name).localeCompare(String(b.name), "vi"),
    )
    .map((r, idx) => ({
      ...r,
      rank: idx + 1,
      medal: idx === 0 ? "Top 1" : idx === 1 ? "Top 2" : idx === 2 ? "Top 3" : "",
    }));

  res.json({ rows: mapped });
};

