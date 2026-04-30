// src/services/mealPlannerReminderService.js

import nodemailer from "nodemailer";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../config/firbase.js";

/* ==============================
   CONFIG
============================== */

const DEFAULT_REMINDER_TIMES = {
  Breakfast: "08:00",
  Lunch: "13:00",
  Dinner: "20:00",
};

const REMINDER_LEAD_MINUTES = 30;
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

const getNowForTimeZone = (timeZone = "Asia/Kolkata") => {
  const now = new Date();

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

  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return { weekday, hhmm, dateKey };
};

const toReminderTime = (mealTime, leadMinutes = REMINDER_LEAD_MINUTES) => {
  const match = String(mealTime ?? "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const total = Number(match[1]) * 60 + Number(match[2]) - leadMinutes;
  const normalized = ((total % 1440) + 1440) % 1440;

  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
};

const isWithinWindow = (target, current, windowMin = WINDOW_MINUTES) => {
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const t = toMin(target);
  const c = toMin(current);

  let diff = Math.abs(c - t);
  diff = Math.min(diff, 1440 - diff);

  return diff <= windowMin;
};

/* ==============================
   EMAIL HELPERS
============================== */

const getUserEmail = async (uid, data) => {
  if (data?.ownerEmail?.includes("@")) return data.ownerEmail;

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;

    const d = snap.data();
    return d.email || d.profile?.email || d.auth?.email || null;
  } catch {
    return null;
  }
};

const getMealName = (meal) =>
  meal?.strMeal || meal?.title || meal?.name || "Planned Recipe";

const getMealImage = (meal) =>
  meal?.strMealThumb || meal?.image || meal?.thumbnail || null;

// Extracts ingredients from various meal data shapes:
// - MealDB format: { strIngredient1, strMeasure1, ... }
// - Array format:  [{ name, measure }, ...] or ["ingredient", ...]
const getMealIngredients = (meal) => {
  if (!meal) return [];

  // 1. MealDB API format
  if (meal.strIngredient1 !== undefined) {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      const name = meal[`strIngredient${i}`]?.trim();
      const measure = meal[`strMeasure${i}`]?.trim();
      if (name) list.push({ name, measure: measure || "" });
    }
    return list;
  }

  // 2. Array format
  if (Array.isArray(meal.ingredients)) {
    return meal.ingredients.map((ing) =>
      typeof ing === "string"
        ? { name: ing, measure: "" }
        : {
            name: ing.name || ing.ingredient || ing.title || "",
            measure: ing.measure || ing.amount || ing.qty || "",
          }
    );
  }

  // 3. 🔥 Object format (THIS WAS MISSING)
  if (meal.ingredients && typeof meal.ingredients === "object") {
    return Object.entries(meal.ingredients).map(([key, value]) => ({
      name: key,
      measure: value,
    }));
  }

  return [];
};
/* ==============================
   EMAIL TEMPLATE
============================== */

const buildReminderHtml = ({ mealName, mealType, weekday, timeLabel, image, ingredients }) => {
  const mealTypeEmoji = { Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙" };
  const emoji = mealTypeEmoji[mealType] || "🍽️";

  const ingredientRows = Array.isArray(ingredients) && ingredients.length
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
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.8);
                      letter-spacing:2.5px;text-transform:uppercase;font-weight:600;">
              Meal Reminder
            </p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;
                       line-height:1.2;">
              ${emoji}&nbsp;${mealType} is coming up!
            </h1>
            <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.92);">
              <b>${weekday}</b>&nbsp;&nbsp;·&nbsp;&nbsp;Start preparing at&nbsp;<b>${timeLabel}</b>
            </p>
          </td>
        </tr>

        <!-- ── RECIPE IMAGE ── -->
        ${image ? `
        <tr>
          <td style="padding:0;line-height:0;">
            <img src="${image}" alt="${mealName}"
                 width="600"
                 style="width:100%;max-height:300px;object-fit:cover;display:block;"/>
          </td>
        </tr>` : ""}

        <!-- ── RECIPE NAME ── -->
        <tr>
          <td style="padding:26px 32px 6px;">
            <p style="margin:0 0 5px;font-size:11px;color:#f97316;font-weight:700;
                      letter-spacing:2px;text-transform:uppercase;">
              Today's Recipe
            </p>
            <h2 style="margin:0;font-size:22px;font-weight:800;color:#1a1a1a;
                       line-height:1.3;">
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
                   style="border-radius:10px;overflow:hidden;
                          border:1px solid #fde8d8;">
              <thead>
                <tr style="background:#fff7ed;">
                  <th style="padding:9px 12px;font-size:11px;color:#f97316;
                             text-align:left;font-weight:700;letter-spacing:1px;
                             text-transform:uppercase;border-bottom:1px solid #fde8d8;">
                    Ingredient
                  </th>
                  <th style="padding:9px 12px;font-size:11px;color:#f97316;
                             text-align:right;font-weight:700;letter-spacing:1px;
                             text-transform:uppercase;border-bottom:1px solid #fde8d8;">
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
   MAIN FUNCTION (SERVERLESS READY)
============================== */

export const checkAndSendMealPlannerReminders = async () => {
  const start = Date.now();
  const MAX_TIME = 8000;

  const report = {
    usersChecked: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  let transporter;
  try {
    transporter = createSmtpTransporter();
  } catch {
    return report;
  }

  const snap = await getDocs(collection(db, "MealPlanner"));
  if (snap.empty) return report;

  for (const docSnap of snap.docs) {
    if (Date.now() - start > MAX_TIME) break;

    const uid = docSnap.id;
    const data = docSnap.data();
    report.usersChecked++;

    if (data.reminderEnabled === false) continue;

    const { weekday, hhmm, dateKey } = getNowForTimeZone(data.timeZone);
    const meals = data.planner?.[weekday];
    if (!meals) continue;

    for (const type of Object.keys(DEFAULT_REMINDER_TIMES)) {
      const meal = meals[type];
      if (!meal) continue;

      const reminderTime = toReminderTime(
        data.reminderTimes?.[type] || DEFAULT_REMINDER_TIMES[type]
      );

      if (!isWithinWindow(reminderTime, hhmm)) continue;

      const logId = `${uid}_${dateKey}_${type}`;
      const logRef = doc(db, "mealReminderLogs", logId);

      if ((await getDoc(logRef)).exists()) continue;

      const email = await getUserEmail(uid, data);
      if (!email) continue;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: `${emoji(type)} ${type} Reminder — ${getMealName(meal)}`,
          html: buildReminderHtml({
            mealName: getMealName(meal),
            mealType: type,
            weekday,
            timeLabel: reminderTime,
            image: getMealImage(meal),
            ingredients: getMealIngredients(meal),
          }),
        });

        await setDoc(logRef, { sentAt: new Date() });
        report.sent++;
      } catch {
        report.errors++;
      }
    }
  }

  return report;
};

// small helper used in subject line
const emoji = (type) => ({ Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙" }[type] || "🍽️");