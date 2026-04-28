import { checkAndSendMealPlannerReminders } from "./src/backend/mealPlannerReminderService.js ";

(async () => {
  console.log("🚀 Running test reminder...");

  const result = await checkAndSendMealPlannerReminders({
    debug: true,
    force: true,     // ignore time
    dryRun: false    // set true if you DON'T want email
  });

  console.log("✅ RESULT:", result);
})();