import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  checkAndSendMealPlannerReminders,
  initMealPlannerReminderService,
} from "./src/backend/mealPlannerReminderService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS for local + deployed frontend(s).
app.use(
  cors({
    origin: ["http://localhost:5173", "https://recipe-finder-fmn8.vercel.app"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Reminder service is running");
});

app.get("/ping", (_req, res) => {
  res.json({ status: "alive", time: new Date().toISOString() });
});

// Manual trigger for debugging (Render, local, etc.).
// Protect it with: Authorization: Bearer <CRON_SECRET>
app.post("/run-meal-reminders", async (req, res) => {
  const authHeader = String(req.headers["authorization"] || "");
  const cronSecret = String(process.env.CRON_SECRET || "");

  if (!cronSecret) {
    return res
      .status(500)
      .json({ success: false, error: "CRON_SECRET is not set" });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const debug = String(req.query?.debug || "") === "1";
  const dryRun = String(req.query?.dryRun || "") === "1";
  const force = String(req.query?.force || "") === "1";

  try {
    const report = await checkAndSendMealPlannerReminders({
      debug,
      dryRun,
      force,
    });
    return res.json({ success: true, report: report.summary });
  } catch (error) {
    console.error("Manual reminder trigger failed:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to run reminders" });
  }
});

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
  initMealPlannerReminderService();
});

