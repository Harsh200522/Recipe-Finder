import express from "express";
import { initMealPlannerReminderService } from "./src/backend/mealPlannerReminderService.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => res.send("✅ Reminder service is running"));

app.get("/ping", (req, res) => {
  res.json({ status: "alive", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT}`);
  initMealPlannerReminderService();
});