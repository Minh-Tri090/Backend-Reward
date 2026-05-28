import PointEvent from "../models/pointEvent.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";

export const getFeed = async (req, res) => {
  try {
    const feed = await PointEvent.find({
      type: "peer_transfer"
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("fromUser", "name avatar role")
      .populate("toUser", "name avatar role department")
      .populate("comments.user", "name avatar role");

    res.json(feed);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const event = await PointEvent.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy bài viết." });
    }

    const likeIndex = event.likes.findIndex(
      (id) => String(id) === String(userId)
    );
    const isLiking = likeIndex === -1;

    if (isLiking) {
      event.likes.push(userId);
    } else {
      event.likes.splice(likeIndex, 1);
    }

    await event.save();

    // Create notification for post owner when someone likes (not self, not unlike)
    if (isLiking && event.toUser && String(event.toUser) !== String(userId)) {
      try {
        const actor = await User.findById(userId).select("name avatar").lean();
        await Notification.create({
          userId: event.toUser,
          type: "like",
          message: `💛 ${actor?.name || "Ai đó"} đã thích bài khen của bạn`,
          actorName: actor?.name || "",
          actorAvatar: actor?.avatar || "",
          relatedId: event._id,
        });
      } catch (_) { /* non-critical */ }
    }

    // Return the updated likes array
    res.json({ likes: event.likes });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

export const commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Nội dung bình luận không được rỗng." });
    }

    const event = await PointEvent.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy bài viết." });
    }

    const newComment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    event.comments.push(newComment);
    await event.save();

    // Populate user info before returning
    await event.populate("comments.user", "name avatar role");

    res.json({ comments: event.comments });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};
