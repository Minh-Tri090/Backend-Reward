import express from "express";
import { register, login, getProfile, updateProfile } from "../controllers/AuthController.js";
import { getTopUsers } from "../controllers/LeaderboardController.js";
import { createReward, getRewards, updateReward, deleteReward } from "../controllers/RewardController.js";
import { redeemReward } from "../controllers/RedeemController.js";
import {
  grantPoints,
  listUsersForAdmin,
  reclaimPoints,
} from "../controllers/adminPointsController.js";
import { createEmployee, patchEmployee } from "../controllers/adminEmployeesController.js";
import { listColleagues } from "../controllers/colleaguesController.js";
import { transferPoints } from "../controllers/peerTransferController.js";
import { getMyPointHistory } from "../controllers/pointsHistoryController.js";
import { getMyPointsSummary } from "../controllers/pointsSummaryController.js";
import { getTransferStats } from "../controllers/transferStatsController.js";
import {
  getMonthlyRanking,
  getTotalRanking,
} from "../controllers/rankingsController.js";
import { getFeed, likePost, commentPost } from "../controllers/feedController.js";
import { getNotifications, markAllRead, markOneRead } from "../controllers/notificationController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

router.get("/leaderboard", getTopUsers);

router.get("/rewards", authMiddleware, getRewards);
router.post("/rewards", authMiddleware, isAdmin, createReward);
router.put("/rewards/:id", authMiddleware, isAdmin, updateReward);
router.delete("/rewards/:id", authMiddleware, isAdmin, deleteReward);

router.post("/redeem", authMiddleware, redeemReward);

router.get("/colleagues", authMiddleware, listColleagues);
router.post("/points/transfer", authMiddleware, transferPoints);
router.get("/points/history", authMiddleware, getMyPointHistory);
router.get("/points/summary", authMiddleware, getMyPointsSummary);
router.get("/points/transfer-stats", authMiddleware, getTransferStats);
router.get("/rankings/monthly", authMiddleware, getMonthlyRanking);
router.get("/rankings/total", authMiddleware, getTotalRanking);

router.get("/feed", authMiddleware, getFeed);
router.post("/feed/:id/like", authMiddleware, likePost);
router.post("/feed/:id/comment", authMiddleware, commentPost);

router.get("/admin/users", authMiddleware, isAdmin, listUsersForAdmin);
router.post("/admin/points/grant", authMiddleware, isAdmin, grantPoints);
router.post("/admin/points/reclaim", authMiddleware, isAdmin, reclaimPoints);
router.post("/admin/employees", authMiddleware, isAdmin, createEmployee);
router.patch("/admin/employees/:id", authMiddleware, isAdmin, patchEmployee);

// Notification routes
router.get("/notifications", authMiddleware, getNotifications);
router.post("/notifications/read-all", authMiddleware, markAllRead);
router.post("/notifications/:id/read", authMiddleware, markOneRead);

export default router;