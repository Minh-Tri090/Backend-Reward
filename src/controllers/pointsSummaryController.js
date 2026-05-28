import mongoose from "mongoose";
import User from "../models/user.js";
import PointEvent from "../models/pointEvent.js";
import { syncUserPointCycles } from "../utils/pointCycles.js";

export const getMyPointsSummary = async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user.id);

  const user = await User.findById(uid).select(
    "points monthlyTransferQuota monthlyEarned totalCycleEarned",
  );
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  await syncUserPointCycles(user);

  const [receivedAgg, spentPeerAgg, spentRedeemAgg] = await Promise.all([
    PointEvent.aggregate([
      {
        $match: {
          toUser: uid,
          type: { $in: ["admin_grant", "peer_transfer"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PointEvent.aggregate([
      {
        $match: {
          fromUser: uid,
          type: "peer_transfer",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PointEvent.aggregate([
      {
        $match: {
          fromUser: uid,
          type: "redeem",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalReceived =
    receivedAgg.length > 0 ? receivedAgg[0].total : 0;
  const totalSentPeer =
    spentPeerAgg.length > 0 ? spentPeerAgg[0].total : 0;
  const totalRedeemed =
    spentRedeemAgg.length > 0 ? spentRedeemAgg[0].total : 0;
  const totalUsed = totalSentPeer + totalRedeemed;

  res.json({
    balance: user.points,
    monthlyTransferQuota: user.monthlyTransferQuota || 0,
    monthlyEarned: user.monthlyEarned || 0,
    totalCycleEarned: user.totalCycleEarned || 0,
    totalReceived,
    totalUsed,
    totalSentPeer,
    totalRedeemed,
  });
};
