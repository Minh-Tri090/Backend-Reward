import Reward from "../models/reward.js";
import User from "../models/user.js";
import Redemption from "../models/redemption.js";
import PointEvent from "../models/pointEvent.js";

export const redeemReward = async (req, res) => {
  const { rewardId } = req.body;

  const user = await User.findById(req.user.id);
  const reward = await Reward.findById(rewardId);

  if (!user) return res.status(404).json({ message: "User not found" });
  if (!reward) return res.status(404).json({ message: "Reward not found" });

  if (!user.isActive) {
    return res.status(403).json({
      message: "Tài khoản đã bị vô hiệu hóa. Không thể đổi quà.",
      code: "ACCOUNT_DISABLED",
    });
  }

  if (reward.stock <= 0)
    return res.status(400).json({ message: "Out of stock" });

  if (user.points < reward.pointsRequired)
    return res.status(400).json({ message: "Not enough points" });

  // trừ điểm
  user.points -= reward.pointsRequired;

  // trừ stock
  reward.stock -= 1;

  await user.save();
  await reward.save();

  // lưu lịch sử
  await Redemption.create({
    user: user._id,
    reward: reward._id
  });

  await PointEvent.create({
    type: "redeem",
    amount: reward.pointsRequired,
    fromUser: user._id,
    reward: reward._id,
    note: reward.title || "",
  });

  res.json({ message: "Redeem success", points: user.points });
};