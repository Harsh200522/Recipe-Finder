import { checkAndSendMealPlannerReminders } from "../src/backend/mealPlannerReminderService.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
  }

  try {
    await checkAndSendMealPlannerReminders();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("run-meal-reminders failed:", error);
    return res.status(500).json({ success: false, error: "Failed to run reminders" });
  }
}

