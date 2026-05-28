import mongoose from "mongoose";
import PointEvent from "../models/pointEvent.js";

export const getMyPointHistory = async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user.id);

  const events = await PointEvent.find({
    $or: [{ fromUser: uid }, { toUser: uid }],
  })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("fromUser", "name email")
    .populate("toUser", "name email")
    .populate("reward", "title")
    .lean();

  const myId = String(req.user.id);

  const mapped = events.map((ev) => {
    const fromId = ev.fromUser
      ? String(ev.fromUser._id || ev.fromUser)
      : null;
    const toId = ev.toUser ? String(ev.toUser._id || ev.toUser) : null;
    const isOut = fromId === myId;
    const isIn = toId === myId;

    let direction = "other";
    if (isOut && isIn) direction = "both";
    else if (isOut) direction = "out";
    else if (isIn) direction = "in";

    return {
      _id: ev._id,
      type: ev.type,
      amount: ev.amount,
      note: ev.note,
      createdAt: ev.createdAt,
      direction,
      fromUser: ev.fromUser,
      toUser: ev.toUser,
      reward: ev.reward,
    };
  });

  res.json(mapped);
};
