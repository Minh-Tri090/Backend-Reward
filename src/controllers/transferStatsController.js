import mongoose from "mongoose";
import PointEvent from "../models/pointEvent.js";

export const getTransferStats = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const [sent, received] = await Promise.all([
    PointEvent.aggregate([
      { $match: { fromUser: userId, type: "peer_transfer" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PointEvent.aggregate([
      { $match: { toUser: userId, type: "peer_transfer" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);
  res.json({
    totalSent: sent[0]?.total || 0,
    totalReceived: received[0]?.total || 0,
  });
};
