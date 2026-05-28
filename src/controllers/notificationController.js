import Notification from "../models/notification.js";
import User from "../models/user.js";

/**
 * GET /notifications
 * Returns the 30 most recent notifications for the current user,
 * prepending on-the-fly "new_member" entries (users joined in last 7 days).
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Persisted notifications
    const persisted = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    // 2. On-the-fly: new members in the last 7 days (excluding self)
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newMembers = await User.find({
      createdAt: { $gte: since7 },
      _id: { $ne: userId },
      isActive: true,
    })
      .select("name avatar createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const memberNotifs = newMembers.map((m) => ({
      _id: `nm_${m._id}`,
      userId,
      type: "new_member",
      message: `👋 ${m.name} vừa tham gia hệ thống!`,
      actorName: m.name,
      actorAvatar: m.avatar || "",
      relatedId: m._id,
      isRead: false, // always unread-looking; client uses localStorage to track
      createdAt: m.createdAt,
    }));

    // 3. Merge & sort
    const all = [...memberNotifs, ...persisted].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // 4. Unread count (persisted only — member notifs are handled client-side)
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    // Add member notif count to unread (simple approach: always count them)
    const totalUnread = unreadCount + memberNotifs.length;

    res.json({ notifications: all.slice(0, 30), unreadCount: totalUnread });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

/**
 * POST /notifications/read-all
 * Mark all persisted notifications as read for current user.
 */
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

/**
 * POST /notifications/:id/read
 * Mark a single notification as read.
 */
export const markOneRead = async (req, res) => {
  try {
    const { id } = req.params;
    // Ignore synthetic new_member ids
    if (String(id).startsWith("nm_")) {
      return res.json({ ok: true });
    }
    await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: { isRead: true } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};
