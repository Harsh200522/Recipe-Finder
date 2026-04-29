// /api/reminder.js

import { checkAndSendMealPlannerReminders } from "../src/services/mealPlannerReminderService.js";

export default async function handler(req, res) {
  // 🔒 SECURITY: protect your endpoint
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const report = await checkAndSendMealPlannerReminders();

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      report,
    });
  } catch (error) {
    console.error("❌ Reminder API Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}