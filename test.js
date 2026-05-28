import dotenv from "dotenv";
dotenv.config();

import { getLarkUsers } from "./src/services/larkUserService.js";

const run = async () => {
  const users = await getLarkUsers();

  console.log(JSON.stringify(users, null, 2));
};

run();