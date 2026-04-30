// /api/reminder.js

import { checkAndSendMealPlannerReminders } from "../src/backend/mealPlannerReminderService.js";

export default async function handler(req, res) {
  try {
    // ==============================
    // 🔒 AUTH HANDLING
    // ==============================
    const authHeader = req.headers.authorization || "";
    const querySecret = req.query.secret;

    let token = null;

    // Extract Bearer token
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Validate token OR query secret
    if (
      token !== process.env.CRON_SECRET &&
      querySecret !== process.env.CRON_SECRET
    ) {
      console.warn("❌ Unauthorized access attempt");
      console.log("Received Header:", authHeader);
      console.log("Received Query Secret:", querySecret);

      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    console.log("✅ Authorized cron request");

    // ==============================
    // ⏰ RUN REMINDER SERVICE
    // ==============================
    const report = await checkAndSendMealPlannerReminders();

    // ==============================
    // ✅ SUCCESS RESPONSE
    // ==============================
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      report,
    });

  } catch (error) {
    console.error("❌ Reminder API Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}