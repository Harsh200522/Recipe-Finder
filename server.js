import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initMealPlannerReminderService } from "./src/backend/mealPlannerReminderService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ CORS configuration (Allow Vercel + Localhost)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://recipe-finder-fmn8.vercel.app" 
  ],
  credentials: true
}));

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("✅ Reminder service is running");
});

app.get("/ping", (req, res) => {
  res.json({ status: "alive", time: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT}`);
  initMealPlannerReminderService();
});