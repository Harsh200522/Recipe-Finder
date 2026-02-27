// api/cron/send-reminders.js
// ✅ This file is called automatically by Vercel Cron every minute

import { checkAndSendMealPlannerReminders } from "../../src/backend/mealPlannerReminderService.js";

export const config = {
  // ✅ Required: tells Vercel this is a cron-compatible serverless function
  maxDuration: 60,
};

export default async function handler(req, res) {
  // ✅ SECURITY: Only Vercel Cron (with your secret) can call this
  const authHeader = req.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("❌ CRON_SECRET env variable is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("⛔ Unauthorized cron attempt blocked");
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("⏰ Cron triggered at:", new Date().toISOString());

  try {
    const report = await checkAndSendMealPlannerReminders();
    console.log("📊 Reminder report:", JSON.stringify(report.summary));

    return res.status(200).json({
      success: true,
      report: report.summary,
    });
  } catch (error) {
    console.error("❌ Cron job failed:", error.message);
    return res.status(500).json({ error: error.message });
  }
}