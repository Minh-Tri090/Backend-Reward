import mongoose from "mongoose";

const pointEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["admin_grant", "admin_bonus", "admin_reclaim", "peer_transfer", "redeem"],
    required: true,
  },
  amount: { type: Number, required: true, min: 1 },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  note: { type: String, default: "" },
  badge: { type: String, default: "" },
  structuredNote: {
    action: { type: String, default: "" },
    contribution: { type: String, default: "" },
    message: { type: String, default: "" }
  },
  reward: { type: mongoose.Schema.Types.ObjectId, ref: "Reward" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

pointEventSchema.index({ createdAt: -1 });
pointEventSchema.index({ fromUser: 1, createdAt: -1 });
pointEventSchema.index({ toUser: 1, createdAt: -1 });

export default mongoose.model("PointEvent", pointEventSchema);
