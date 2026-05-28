import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["like", "peer_gift", "admin_grant", "new_member", "team_reward"],
    required: true,
  },
  message: { type: String, required: true },
  // relatedId: PointEvent id (for like/peer_gift/admin_grant/team_reward) or User id (for new_member)
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  // actorName: who triggered the notification
  actorName: { type: String, default: "" },
  actorAvatar: { type: String, default: "" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
