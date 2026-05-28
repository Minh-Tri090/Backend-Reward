import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { syncUserPointCycles } from "../utils/pointCycles.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    const user = await User.findById(decoded.id).select(
      "isActive pointMonthKey totalCycleKey monthlyTransferQuota monthlyEarned totalCycleEarned",
    );

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Tài khoản đã bị vô hiệu hóa. Không thể sử dụng hệ thống.",
        code: "ACCOUNT_DISABLED",
      });
    }

    await syncUserPointCycles(user);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
