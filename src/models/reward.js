import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },

  description: String,

  imageUrl: String,

  pointsRequired: { 
    type: Number,
     required: true },

  stock: { 
    type: Number, 
    default: 0 },

  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("Reward", rewardSchema);