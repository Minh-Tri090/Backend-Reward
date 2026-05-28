import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  type: {
    type: String,
    enum: ["REWARD", "REDEEM"],
  },

  amount: Number, // +10 / -50

  refId: mongoose.Schema.Types.ObjectId,

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Transaction", transactionSchema);