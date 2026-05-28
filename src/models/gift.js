import mongoose from "mongoose";

const giftSchema = new mongoose.Schema({
  name: String,
  cost: Number,
  stock: Number,
});

export default mongoose.model("Gift", giftSchema);