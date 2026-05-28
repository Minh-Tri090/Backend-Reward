import express from "express";
import { redeemGift } from "../controllers/RedeemController.js";

const router = express.Router();

router.post("/", redeemGift);

export default router;