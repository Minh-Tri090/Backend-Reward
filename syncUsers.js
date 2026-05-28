import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import User from "./src/models/User.js";
import { getLarkUsers } from "./src/services/larkUserService.js";

await mongoose.connect(process.env.MONGO_URI);

const syncUsers = async () => {
  const result = await getLarkUsers();

  const users = result.data.items;

  for (const user of users) {
    await User.findOneAndUpdate(
      {
        larkOpenId: user.open_id
      },
      {
        larkOpenId: user.open_id,
        unionId: user.union_id
      },
      {
        upsert: true,
        new: true
      }
    );
  }

  console.log("✅ USER SYNC DONE");
};

syncUsers();