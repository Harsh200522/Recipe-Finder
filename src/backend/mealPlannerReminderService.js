// src/services/mealPlannerReminderService.js

import nodemailer from "nodemailer";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../config/firbase.js";

/* ==============================
   CONFIG
   These must match defaultReminderTimes in MealPlanner.jsx exactly
============================== */

const DEFAULT_REMINDER_TIMES = {
  Breakfast: "08:00",
  Lunch: "13:00",
  Dinner: "20:00",
};

// How many minutes before meal time to send reminder
const REMINDER_LEAD_MINUTES = 30;

// How many minutes either side of reminder time to still fire it
// (cron jobs don't always fire at exact second)
const WINDOW_MINUTES = 2;

/* ==============================
   SMTP EMAIL CLIENT
============================== */

const createSmtpTransporter = () => {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is missing in environment variables.");
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP credentials missing.");
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
};

/* ==============================
   TIME HELPERS
============================== */

/**
 * Returns current weekday name, HH:MM, and YYYY-MM-DD date key
 * in the user's stored timeZone (saved by MealPlanner.jsx savePlanner).
 * Falls back to Asia/Kolkata if no timeZone stored.
 */
const getNowForTimeZone = (timeZone = "Asia/Kolkata") => {
  const now = new Date();

  // "Monday", "Tuesday" … must match the days array in MealPlanner.jsx exactly
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone,
  }).format(now);

  const hhmm = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(now);

  // Used as part of log doc ID to prevent duplicate emails on same day
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return { weekday, hhmm, dateKey };
};

/**
 * Subtracts leadMinutes from a HH:MM string to get reminder fire time.
 * e.g. mealTime="08:00", lead=30 → "07:30"
 */
const toReminderTime = (mealTime, leadMinutes = REMINDER_LEAD_MINUTES) => {
  const match = String(mealTime ?? "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const total = Number(match[1]) * 60 + Number(match[2]) - leadMinutes;
  const normalized = ((total % 1440) + 1440) % 1440;

  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(
    normalized % 60
  ).padStart(2, "0")}`;
};

const isWithinWindow = (target, current, windowMin = WINDOW_MINUTES) => {
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  let diff = Math.abs(toMin(current) - toMin(target));
  diff = Math.min(diff, 1440 - diff); // handle midnight wraparound
  return diff <= windowMin;
};

/* ==============================
   MEAL DATA HELPERS
   These match the shape saved by MealPlanner.jsx exactly:
   - API meals:       { strMeal, strMealThumb, strIngredient1..20, strMeasure1..20, source:"api" }
   - Community meals: { strMeal, strMealThumb, ingredients: string[]|object, source:"community" }
============================== */

const getMealName = (meal) =>
  meal?.strMeal || meal?.title || meal?.name || "Planned Recipe";

const getMealImage = (meal) =>
  meal?.strMealThumb || meal?.image || meal?.thumbnail || null;

/**
 * Handles all three ingredient shapes that MealPlanner.jsx can produce:
 * 1. MealDB API format  → strIngredient1/strMeasure1 … strIngredient20/strMeasure20
 * 2. Array format       → ["ing (measure)", ...] or [{name, measure}, ...]
 * 3. Object format      → { ingredientName: measure, ... }
 */
const getMealIngredients = (meal) => {
  if (!meal) return [];

  // 1. MealDB API format (saved directly from fetchApiMeals in MealPlanner.jsx)
  if (meal.strIngredient1 !== undefined) {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      const name = meal[`strIngredient${i}`]?.trim();
      const measure = meal[`strMeasure${i}`]?.trim();
      if (name) list.push({ name, measure: measure || "" });
    }
    return list;
  }

  // 2. Array format (from fetchPublishedCommunityMeals / normalizeIngredientList)
  if (Array.isArray(meal.ingredients)) {
    return meal.ingredients.map((ing) => {
      if (typeof ing === "string") {
        // "Chicken (200g)" → split into name + measure
        const parenMatch = ing.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
        if (parenMatch) {
          return { name: parenMatch[1].trim(), measure: parenMatch[2].trim() };
        }
        return { name: ing.trim(), measure: "" };
      }
      return {
        name: ing.name || ing.ingredient || ing.title || "",
        measure: ing.measure || ing.amount || ing.qty || "",
      };
    });
  }

  // 3. Object format  { "Chicken": "200g", "Salt": "1 tsp" }
  if (meal.ingredients && typeof meal.ingredients === "object") {
    return Object.entries(meal.ingredients).map(([key, value]) => ({
      name: key,
      measure: String(value),
    }));
  }

  return [];
};

/* ==============================
   EMOJI HELPER
============================== */

const getMealEmoji = (type) =>
  ({ Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙" }[type] || "🍽️");

/* ==============================
   EMAIL TEMPLATE
============================== */

const buildReminderHtml = ({
  mealName,
  mealType,
  weekday,
  timeLabel,
  image,
  ingredients,
  ownerName,
}) => {
  const emoji = getMealEmoji(mealType);

  const ingredientRows =
    Array.isArray(ingredients) && ingredients.length
      ? ingredients
          .map(
            (ing) => `
          <tr>
            <td style="padding:7px 12px;border-bottom:1px solid #fde8d8;font-size:14px;color:#444;">
              ${ing.name || ing}
            </td>
            <td style="padding:7px 12px;border-bottom:1px solid #fde8d8;font-size:14px;
                       color:#888;text-align:right;white-space:nowrap;">
              ${ing.measure || ""}
            </td>
          </tr>`
          )
          .join("")
      : `<tr>
           <td colspan="2" style="padding:10px 12px;font-size:14px;color:#bbb;text-align:center;">
             No ingredients listed
           </td>
         </tr>`;

  // Greeting uses ownerName saved by MealPlanner.jsx savePlanner()
  const greeting = ownerName ? `Hi ${ownerName},` : "Hi there,";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${mealType} Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f4f0eb;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f4f0eb;padding:32px 16px;">
    <tr><td align="center">

      <table width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;
                    overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

        <!-- ── BANNER ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#f97316 0%,#fb923c 100%);
                     padding:30px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.85);
                      font-weight:500;">
              ${greeting}
            </p>
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.8);
                      letter-spacing:2.5px;text-transform:uppercase;font-weight:600;">
              Meal Reminder
            </p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;line-height:1.2;">
              ${emoji}&nbsp;${mealType} is coming up!
            </h1>
            <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.92);">
              <b>${weekday}</b>&nbsp;&nbsp;·&nbsp;&nbsp;Start preparing at&nbsp;<b>${timeLabel}</b>
            </p>
          </td>
        </tr>

        <!-- ── RECIPE IMAGE ── -->
        ${
          image
            ? `<tr>
                 <td style="padding:0;line-height:0;">
                   <img src="${image}" alt="${mealName}"
                        width="600"
                        style="width:100%;max-height:300px;object-fit:cover;display:block;"/>
                 </td>
               </tr>`
            : ""
        }

        <!-- ── RECIPE NAME ── -->
        <tr>
          <td style="padding:26px 32px 6px;">
            <p style="margin:0 0 5px;font-size:11px;color:#f97316;font-weight:700;
                      letter-spacing:2px;text-transform:uppercase;">
              Today's Recipe
            </p>
            <h2 style="margin:0;font-size:22px;font-weight:800;color:#1a1a1a;line-height:1.3;">
              ${mealName}
            </h2>
          </td>
        </tr>

        <!-- ── DIVIDER ── -->
        <tr>
          <td style="padding:0 32px;">
            <hr style="border:none;border-top:2px solid #fde8d8;margin:14px 0;"/>
          </td>
        </tr>

        <!-- ── INGREDIENTS ── -->
        <tr>
          <td style="padding:4px 32px 28px;">
            <p style="margin:0 0 12px;font-size:11px;color:#f97316;font-weight:700;
                      letter-spacing:2px;text-transform:uppercase;">
              🧾&nbsp;Ingredients
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border-radius:10px;overflow:hidden;border:1px solid #fde8d8;">
              <thead>
                <tr style="background:#fff7ed;">
                  <th style="padding:9px 12px;font-size:11px;color:#f97316;text-align:left;
                             font-weight:700;letter-spacing:1px;text-transform:uppercase;
                             border-bottom:1px solid #fde8d8;">
                    Ingredient
                  </th>
                  <th style="padding:9px 12px;font-size:11px;color:#f97316;text-align:right;
                             font-weight:700;letter-spacing:1px;text-transform:uppercase;
                             border-bottom:1px solid #fde8d8;">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                ${ingredientRows}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- ── CTA BUTTON ── -->
        <tr>
          <td style="padding:0 32px 36px;text-align:center;">
            <a href="https://recipe-finder-fmn8.vercel.app/meal-planner"
               target="_blank"
               style="display:inline-block;
                      background:linear-gradient(135deg,#f97316 0%,#fb923c 100%);
                      color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;
                      padding:14px 40px;border-radius:50px;
                      box-shadow:0 4px 16px rgba(249,115,22,0.38);
                      letter-spacing:0.4px;">
              🍳&nbsp;View My Meal Planner
            </a>
            <p style="margin:10px 0 0;font-size:12px;color:#bbb;">
              Click to open your full meal plan for the week
            </p>
          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#fff7ed;padding:16px 32px;text-align:center;
                     border-top:1px solid #fde8d8;">
            <p style="margin:0;font-size:12px;color:#c0a898;">
              You're receiving this because meal reminders are enabled on your account.
              <br/>To stop these emails, turn off <b>Meal Reminder</b> in your Profile Settings.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
};

/* ==============================
   MAIN EXPORT
============================== */

export const checkAndSendMealPlannerReminders = async () => {
  const start = Date.now();
  const MAX_TIME = 8000; // bail out before serverless timeout

  const report = {
    usersChecked: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  // --- 1. Create transporter ---
  let transporter;
  try {
    transporter = createSmtpTransporter();
  } catch (err) {
    console.error("[MealReminder] Transporter creation failed:", err.message);
    return report;
  }

  // --- 2. Load all MealPlanner docs (one per user, keyed by uid) ---
  let snap;
  try {
    snap = await getDocs(collection(db, "MealPlanner"));
  } catch (err) {
    console.error("[MealReminder] Failed to read MealPlanner collection:", err.message);
    return report;
  }

  if (snap.empty) return report;

  // --- 3. Process each user ---
  for (const docSnap of snap.docs) {
    if (Date.now() - start > MAX_TIME) break;

    // plannerDoc fields written by MealPlanner.jsx → savePlanner()
    const uid = docSnap.id;
    const plannerDoc = docSnap.data();
    report.usersChecked++;

    // ✅ STEP A: Fetch user preferences from users/{uid}
    // This is where ProfileSettings saves mealReminder + emailNotifications
    let userData = null;
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        report.skipped++;
        continue;
      }
      userData = userSnap.data();
    } catch (err) {
      console.error(`[MealReminder] Failed to fetch user doc for uid ${uid}:`, err.message);
      report.errors++;
      continue;
    }

    // ✅ STEP B: Check emailNotifications preference
    // Saved by ProfileSettings.jsx → handleSave() → preferences.emailNotifications
    if (userData?.preferences?.emailNotifications === false) {
      report.skipped++;
      continue;
    }

    // ✅ STEP C: Check mealReminder preference
    // Saved by ProfileSettings.jsx → handleSave() → preferences.mealReminder
    if (userData?.preferences?.mealReminder === false) {
      report.skipped++;
      continue;
    }

    // ✅ STEP D: Resolve email
    // Priority: plannerDoc.ownerEmail (saved by savePlanner) → users doc email → profile email
    const email =
      plannerDoc.ownerEmail ||
      userData?.email ||
      userData?.profile?.email ||
      userData?.auth?.email ||
      null;

    if (!email || !email.includes("@")) {
      console.warn(`[MealReminder] No valid email for uid ${uid}`);
      report.skipped++;
      continue;
    }

    // ✅ STEP E: Resolve display name
    // plannerDoc.ownerName is saved by savePlanner() in MealPlanner.jsx
    const ownerName =
      plannerDoc.ownerName ||
      userData?.profile?.name ||
      userData?.displayName ||
      email.split("@")[0] ||
      "there";

    // ✅ STEP F: Get current time in user's timezone
    // plannerDoc.timeZone is saved by savePlanner() using Intl.DateTimeFormat().resolvedOptions().timeZone
    const { weekday, hhmm, dateKey } = getNowForTimeZone(
      plannerDoc.timeZone || "Asia/Kolkata"
    );

    // ✅ STEP G: Get today's meals from planner[weekday]
    // planner shape from MealPlanner.jsx:
    // { Monday: { Breakfast: mealObj|null, Lunch: mealObj|null, Dinner: mealObj|null }, ... }
    const todaysMeals = plannerDoc.planner?.[weekday];
    if (!todaysMeals) continue;

    // ✅ STEP H: Loop Breakfast / Lunch / Dinner
    for (const mealType of Object.keys(DEFAULT_REMINDER_TIMES)) {
      const meal = todaysMeals[mealType];

      // Skip if no meal assigned for this slot
      if (!meal) continue;

      // ✅ STEP I: Resolve reminder fire time
      // plannerDoc.reminderTimes saved by savePlanner: { Breakfast:"08:00", Lunch:"13:00", Dinner:"20:00" }
      const rawMealTime =
        plannerDoc.reminderTimes?.[mealType] || DEFAULT_REMINDER_TIMES[mealType];

      const reminderTime = toReminderTime(rawMealTime);
      if (!reminderTime) continue;

      // Is it time to fire the reminder?
      if (!isWithinWindow(reminderTime, hhmm)) continue;

      // ✅ STEP J: Dedup — don't send twice for same user + date + meal type
      const logId = `${uid}_${dateKey}_${mealType}`;
      const logRef = doc(db, "mealReminderLogs", logId);

      try {
        const logSnap = await getDoc(logRef);
        if (logSnap.exists()) continue; // already sent today
      } catch (err) {
        console.error(`[MealReminder] Failed to check log ${logId}:`, err.message);
        continue;
      }

      // ✅ STEP K: Build and send email
      const mealEmoji = getMealEmoji(mealType);
      const mealName = getMealName(meal);
      const mealImage = getMealImage(meal);
      const ingredients = getMealIngredients(meal);

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: `${mealEmoji} ${mealType} Reminder — ${mealName}`,
          html: buildReminderHtml({
            mealName,
            mealType,
            weekday,
            timeLabel: reminderTime,
            image: mealImage,
            ingredients,
            ownerName,
          }),
        });

        // Mark as sent so we don't send again today
        await setDoc(logRef, {
          sentAt: new Date(),
          uid,
          email,
          mealType,
          mealName,
          weekday,
          dateKey,
        });

        report.sent++;
        console.log(
          `[MealReminder] ✅ Sent ${mealType} reminder to ${email} (${mealName})`
        );
      } catch (err) {
        console.error(
          `[MealReminder] ❌ Failed to send to ${email}:`,
          err.message
        );
        report.errors++;
      }
    }
  }

  console.log("[MealReminder] Report:", report);
  return report;
};