import Reward from "../models/reward.js";

export const createReward = async (req, res) => {
  const reward = await Reward.create({
    ...req.body,
    createdBy: req.user.id
  });

  res.json(reward);
};

export const getRewards = async (req, res) => {
  const rewards = await Reward.find();
  res.json(rewards);
};

export const updateReward = async (req, res) => {
  const { id } = req.params;
  const reward = await Reward.findByIdAndUpdate(id, req.body, { new: true });
  if (!reward) return res.status(404).json({ message: "Reward not found" });
  res.json(reward);
};

export const deleteReward = async (req, res) => {
  const { id } = req.params;
  const reward = await Reward.findByIdAndDelete(id);
  if (!reward) return res.status(404).json({ message: "Reward not found" });
  res.json({ message: "Reward deleted" });
};