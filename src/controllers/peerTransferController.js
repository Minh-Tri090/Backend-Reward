import User from "../models/user.js";
import PointEvent from "../models/pointEvent.js";
import Notification from "../models/notification.js";
import { syncUserPointCycles } from "../utils/pointCycles.js";

export const transferPoints = async (req, res) => {
  const { toUserId, amount, message, badge, action, contribution } = req.body;
  const n = Number(amount);

  if (!toUserId || !Number.isFinite(n) || n < 1) {
    return res.status(400).json({ message: "Invalid recipient or amount" });
  }

  if (String(toUserId) === String(req.user.id)) {
    return res.status(400).json({ message: "Cannot transfer to yourself" });
  }

  const qty = Math.floor(n);
  const from = await User.findById(req.user.id);
  const to = await User.findById(toUserId);

  if (!from || !from.isActive) {
    return res.status(404).json({ message: "Sender not found" });
  }
  if (!to || !to.isActive) {
    return res.status(404).json({ message: "Recipient not found" });
  }

  await syncUserPointCycles(from);
  await syncUserPointCycles(to);

  if (from.monthlyTransferQuota < qty) {
    return res.status(400).json({
      message:
        "Không đủ quota tặng điểm trong tháng hiện tại. Điểm tháng trước không dùng để tặng.",
    });
  }

  from.monthlyTransferQuota -= qty;
  to.points += qty;
  to.monthlyEarned += qty;
  to.totalEarned += qty;
  to.totalCycleEarned += qty;
  await from.save();
  await to.save();

  const event = await PointEvent.create({
    type: "peer_transfer",
    amount: qty,
    fromUser: from._id,
    toUser: to._id,
    note: typeof message === "string" ? message.slice(0, 500) : "",
    badge: badge || "",
    structuredNote: {
      action: action || "",
      contribution: contribution || "",
      message: typeof message === "string" ? message.slice(0, 500) : "",
    }
  });

  // — Notifications —
  try {
    // 1. Notify recipient
    await Notification.create({
      userId: to._id,
      type: "peer_gift",
      message: `🎁 ${from.name} đã tặng bạn ${qty} điểm${message ? ` — "${String(message).slice(0, 60)}"` : ""}`,
      actorName: from.name,
      actorAvatar: from.avatar || "",
      relatedId: event._id,
    });

    // 2. Notify same-department colleagues (team_reward) — exclude sender & recipient
    if (to.department) {
      const teammates = await User.find({
        department: to.department,
        _id: { $nin: [from._id, to._id] },
        isActive: true,
      }).select("_id").lean();

      if (teammates.length > 0) {
        const teamNotifs = teammates.map((tm) => ({
          userId: tm._id,
          type: "team_reward",
          message: `🏆 ${to.name} (${to.department}) vừa được ${from.name} tặng ${qty} điểm!`,
          actorName: from.name,
          actorAvatar: from.avatar || "",
          relatedId: event._id,
        }));
        await Notification.insertMany(teamNotifs, { ordered: false });
      }
    }
  } catch (_) { /* non-critical */ }

  res.json({
    message: "Transfer success",
    points: from.points,
  });
};
