import express from "express";
import { createReward } from "./RewardController.js";
import { redeemGift } from "./RedeemController.js";

const router = express.Router();

router.post("/reward", createReward);
router.post("/redeem", redeemGift);

export default router;