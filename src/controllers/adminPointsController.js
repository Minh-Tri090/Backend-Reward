import User from "../models/user.js";
import PointEvent from "../models/pointEvent.js";
import Notification from "../models/notification.js";
import { syncUserPointCycles } from "../utils/pointCycles.js";

export const listUsersForAdmin = async (req, res) => {
  const all =
    req.query.all === "1" ||
    req.query.all === "true" ||
    req.query.all === "yes";
  const filter = all ? {} : { isActive: true };
  const users = await User.find(filter)
    .select(
      "name email points role isActive createdAt department monthlyTransferQuota monthlyEarned totalCycleEarned jobTitle dateOfBirth",
    )
    .sort({ name: 1 })
    .lean();
  res.json(users);
};

export const grantPoints = async (req, res) => {
  const { userId, amount, note, grantKind } = req.body;
  const n = Number(amount);
  const kind = grantKind === "monthly" ? "monthly" : "bonus";

  if (!userId || !Number.isFinite(n) || n < 1) {
    return res.status(400).json({ message: "Invalid userId or amount" });
  }

  const target = await User.findById(userId);
  if (!target || !target.isActive) {
    return res.status(404).json({ message: "User not found" });
  }

  await syncUserPointCycles(target);

  const qty = Math.floor(n);
  target.points += qty;
  if (kind === "monthly") {
    target.monthlyTransferQuota += qty;
  }
  target.monthlyEarned += qty;
  target.totalEarned += qty;
  target.totalCycleEarned += qty;
  await target.save();

  await PointEvent.create({
    type: kind === "monthly" ? "admin_grant" : "admin_bonus",
    amount: qty,
    fromUser: req.user.id,
    toUser: target._id,
    note: typeof note === "string" ? note.slice(0, 500) : "",
  });

  // — Notifications —
  try {
    const admin = await User.findById(req.user.id).select("name").lean();
    const adminName = admin?.name || "Quản trị viên";
    const kindLabel = kind === "monthly" ? "hàng tháng" : "thưởng";

    // 1. Notify recipient
    await Notification.create({
      userId: target._id,
      type: "admin_grant",
      message: `⭐ Bạn được ${adminName} cấp ${qty} điểm ${kindLabel}${note ? ` — "${String(note).slice(0, 60)}"` : ""}`,
      actorName: adminName,
      actorAvatar: "",
      relatedId: target._id,
    });

    // 2. Notify same-department teammates (team_reward)
    if (target.department) {
      const teammates = await User.find({
        department: target.department,
        _id: { $ne: target._id },
        isActive: true,
      }).select("_id").lean();

      if (teammates.length > 0) {
        const teamNotifs = teammates.map((tm) => ({
          userId: tm._id,
          type: "team_reward",
          message: `🏆 ${target.name} (${target.department}) vừa được ${adminName} cấp ${qty} điểm ${kindLabel}!`,
          actorName: adminName,
          actorAvatar: "",
          relatedId: target._id,
        }));
        await Notification.insertMany(teamNotifs, { ordered: false });
      }
    }
  } catch (_) { /* non-critical */ }

  const fresh = await User.findById(target._id).select(
    "name email points role department monthlyTransferQuota monthlyEarned totalCycleEarned",
  );
  res.json({ message: "Granted", user: fresh });
};

export const reclaimPoints = async (req, res) => {
  const { userId, amount, note } = req.body;
  const n = Number(amount);
  if (!userId || !Number.isFinite(n) || n < 1) {
    return res.status(400).json({ message: "Invalid userId or amount" });
  }

  const target = await User.findById(userId);
  if (!target) {
    return res.status(404).json({ message: "User not found" });
  }
  await syncUserPointCycles(target);

  const qty = Math.floor(n);
  if (target.points < qty) {
    return res.status(400).json({ message: "Điểm hiện có không đủ để thu hồi" });
  }

  target.points -= qty;
  target.monthlyTransferQuota = Math.max(0, target.monthlyTransferQuota - qty);
  await target.save();

  await PointEvent.create({
    type: "admin_reclaim",
    amount: qty,
    fromUser: req.user.id,
    toUser: target._id,
    note: typeof note === "string" ? note.slice(0, 500) : "",
  });

  const fresh = await User.findById(target._id).select(
    "name email points role department monthlyTransferQuota monthlyEarned totalCycleEarned",
  );
  res.json({ message: "Reclaimed", user: fresh });
};
