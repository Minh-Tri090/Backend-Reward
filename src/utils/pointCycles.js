export function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// "totalCycle" is treated as a quarter leaderboard cycle: Q1..Q4
export function getHalfYearKey(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-11
  const quarter = m < 3 ? "Q1" : m < 6 ? "Q2" : m < 9 ? "Q3" : "Q4";
  return `${y}-${quarter}`;
}

export async function syncUserPointCycles(user) {
  let changed = false;
  const monthKey = getMonthKey();
  const totalCycleKey = getHalfYearKey();

  if (user.pointMonthKey !== monthKey) {
    user.pointMonthKey = monthKey;
    user.monthlyTransferQuota = 0;
    user.monthlyEarned = 0;
    changed = true;
  }

  if (user.totalCycleKey !== totalCycleKey) {
    user.totalCycleKey = totalCycleKey;
    user.totalCycleEarned = 0;
    changed = true;
  }

  if (changed) {
    await user.save();
  }
}

