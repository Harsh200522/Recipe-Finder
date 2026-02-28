import express from "express";
import { initMealPlannerReminderService } from "./backend/mealPlannerReminderService.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => res.send("✅ Reminder service is running"));

app.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT}`);
  initMealPlannerReminderService();
});