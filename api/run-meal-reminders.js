import { checkAndSendMealPlannerReminders } from "../src/backend/mealPlannerReminderService.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const url = new URL(req.url, "http://localhost");
  const debug = url.searchParams.get("debug") === "1";
  const dryRun = url.searchParams.get("dryRun") === "1";
  const force = url.searchParams.get("force") === "1";

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
  }

  try {
    const report = await checkAndSendMealPlannerReminders({
      debug,
      dryRun,
      force,
    });
    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error("run-meal-reminders failed:", error);
    return res.status(500).json({ success: false, error: "Failed to run reminders" });
  }
}
