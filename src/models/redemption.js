import mongoose from "mongoose";

const redemptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  reward: { type: mongoose.Schema.Types.ObjectId, ref: "Reward" },

  status: { 
    type: String, 
    enum: ["pending", "completed"], 
    default: "completed" 
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Redemption", redemptionSchema);