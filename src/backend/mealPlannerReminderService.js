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
const DEFAULT_SERVINGS = 2;

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
  diff = Math.min(diff, 1440 - diff);
  return diff <= windowMin;
};

/* ==============================
   MEAL DATA HELPERS
============================== */

const getMealName = (meal) =>
  meal?.strMeal || meal?.title || meal?.name || "Planned Recipe";

const getMealImage = (meal) =>
  meal?.strMealThumb || meal?.image || meal?.thumbnail || null;

const getMealYoutube = (meal) =>
  meal?.strYoutube || meal?.youtube || meal?.video || null;

/**
 * Unified ingredient extractor.
 * Handles 3 formats:
 *  1. TheMealDB API  →  strIngredient1..20 + strMeasure1..20
 *  2. Array of strings  →  "Flour (2 cups)" or plain "Flour"
 *  3. Array of objects  →  { name, measure }  /  { ingredient, amount }
 *  4. Plain object map  →  { "Flour": "2 cups" }
 */
const getMealIngredients = (meal) => {
  if (!meal) return [];

  // Format 1: TheMealDB strIngredient fields
  if (meal.strIngredient1 !== undefined) {
    const list = [];
    for (let i = 1; i <= 20; i++) {
      const name = meal[`strIngredient${i}`]?.trim();
      const measure = meal[`strMeasure${i}`]?.trim();
      if (name) list.push({ name, measure: measure || "" });
    }
    return list;
  }

  // Format 2 & 3: Array
  if (Array.isArray(meal.ingredients)) {
    return meal.ingredients
      .map((ing) => {
        if (typeof ing === "string") {
          // "Dried Figs (200g)"  →  { name: "Dried Figs", measure: "200g" }
          const parenMatch = ing.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          if (parenMatch) {
            return { name: parenMatch[1].trim(), measure: parenMatch[2].trim() };
          }
          return { name: ing.trim(), measure: "" };
        }
        // Object shape
        return {
          name: ing.name || ing.ingredient || ing.title || "",
          measure: ing.measure || ing.amount || ing.qty || "",
        };
      })
      .filter((ing) => ing.name);
  }

  // Format 4: Plain object map
  if (meal.ingredients && typeof meal.ingredients === "object") {
    return Object.entries(meal.ingredients).map(([key, value]) => ({
      name: key,
      measure: String(value),
    }));
  }

  return [];
};

/**
 * Fetch fresh ingredients from TheMealDB when the stored meal
 * is missing them (e.g. saved before full hydration).
 */
const fetchIngredientsFromApi = async (mealId) => {
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(mealId)}`
    );
    const data = await res.json();
    const found = data?.meals?.[0];
    if (!found) return [];
    return getMealIngredients(found);
  } catch (err) {
    console.warn(`[MealReminder] Could not fetch API ingredients for ${mealId}:`, err.message);
    return [];
  }
};

const getMealEmoji = (type) =>
  ({ Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙" }[type] || "🍽️");

/* ==============================
   SERVING SCALE HELPER
============================== */

/**
 * Parses a measure string and scales it by a multiplier.
 * Returns the scaled string, or the original if it can't parse a number.
 * Examples:
 *   scaleMeasure("200g", 2)    → "400g"
 *   scaleMeasure("1/2 cup", 2) → "1 cup"
 *   scaleMeasure("to taste", 2)→ "to taste"
 */
const scaleMeasure = (measure, multiplier) => {
  if (!measure || multiplier === 1) return measure;

  // Handle fractions like "1/2", "3/4"
  const fracMatch = measure.match(/^(\d+)\/(\d+)(.*)/);
  if (fracMatch) {
    const val = Number(fracMatch[1]) / Number(fracMatch[2]) * multiplier;
    const suffix = fracMatch[3].trim();
    // Format nicely: if whole number, no decimal; else 1 decimal
    const formatted = Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, "");
    return `${formatted}${suffix ? " " + suffix : ""}`;
  }

  // Handle leading number like "200g", "1.5 cup", "2 tbsp"
  const numMatch = measure.match(/^(\d+(?:\.\d+)?)(.*)/);
  if (numMatch) {
    const val = Number(numMatch[1]) * multiplier;
    const suffix = numMatch[2].trim();
    const formatted = Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, "");
    return `${formatted}${suffix ? " " + suffix : ""}`;
  }

  // Can't parse — return as-is
  return measure;
};

/* ==============================
   EMAIL TEMPLATE
============================== */

/**
 * Builds the reminder HTML email.
 *
 * Interactive serving selector uses the CSS radio-button trick:
 * hidden <input type="radio"> elements + <label> buttons control
 * which set of ingredient rows is shown via sibling CSS selectors.
 * This works in Gmail (web), Apple Mail, and most modern clients
 * without any JavaScript.
 *
 * For clients that strip <style> (Outlook), the default serving
 * rows (baseServings) are always shown as a fallback.
 */
const buildReminderHtml = ({
  mealName,
  mealType,
  weekday,
  timeLabel,
  image,
  ingredients,
  ownerName,
  youtubeUrl,
  baseServings = DEFAULT_SERVINGS,
}) => {
  const emoji = getMealEmoji(mealType);
  const greeting = ownerName ? `Hi ${ownerName},` : "Hi there,";
  const maxServings = 8;
  const servingOptions = [1, 2, 3, 4, 6, 8];

  // ── Pre-compute scaled ingredient rows for every serving option ──
  const buildIngredientRows = (servings) => {
    if (!Array.isArray(ingredients) || !ingredients.length) {
      return `<tr>
        <td colspan="2" style="padding:10px 12px;font-size:14px;color:#bbb;text-align:center;">
          No ingredients listed
        </td>
      </tr>`;
    }

    const multiplier = servings / baseServings;

    return ingredients
      .map((ing) => {
        const scaledMeasure = scaleMeasure(ing.measure, multiplier);
        return `
        <tr>
          <td style="padding:7px 12px;border-bottom:1px solid #fde8d8;font-size:14px;color:#444;">
            ${ing.name || ing}
          </td>
          <td style="padding:7px 12px;border-bottom:1px solid #fde8d8;font-size:14px;
                     color:#f97316;font-weight:600;text-align:right;white-space:nowrap;">
            ${scaledMeasure || "—"}
          </td>
        </tr>`;
      })
      .join("");
  };

  // ── CSS: show/hide ingredient blocks per selected radio ──
  // Each serving option has a radio input with id="srv-N"
  // When checked, we show the table with class "ing-N" and hide others.
  const servingCss = servingOptions
    .map(
      (s) => `
  #srv-${s}:checked ~ * .ing-block { display: none !important; }
  #srv-${s}:checked ~ * .ing-${s}  { display: table !important; }`
    )
    .join("");

  // ── Radio inputs (outside visible table flow) ──
  const radioInputs = servingOptions
    .map(
      (s) =>
        `<input type="radio" name="servings" id="srv-${s}"
               style="position:absolute;opacity:0;pointer-events:none;"
               ${s === baseServings ? "checked" : ""}/>`
    )
    .join("\n");

  // ── Serving selector label buttons ──
  const servingLabels = servingOptions
    .map(
      (s) => `
    <label for="srv-${s}"
           style="display:inline-block;padding:5px 13px;margin:3px;border-radius:20px;
                  font-size:13px;font-weight:700;cursor:pointer;
                  border:2px solid #f97316;color:#f97316;background:#fff;
                  transition:all 0.2s;">
      ${s}
    </label>`
    )
    .join("");

  // ── Ingredient table blocks (one per serving option) ──
  const ingredientBlocks = servingOptions
    .map(
      (s) => `
  <table class="ing-block ing-${s}" width="100%" cellpadding="0" cellspacing="0"
         style="border-radius:10px;overflow:hidden;border:1px solid #fde8d8;
                ${s === baseServings ? "" : "display:none !important;"}">
    <thead>
      <tr style="background:#fff7ed;">
        <th style="padding:9px 12px;font-size:11px;color:#f97316;text-align:left;
                   font-weight:700;letter-spacing:1px;text-transform:uppercase;
                   border-bottom:1px solid #fde8d8;">Ingredient</th>
        <th style="padding:9px 12px;font-size:11px;color:#f97316;text-align:right;
                   font-weight:700;letter-spacing:1px;text-transform:uppercase;
                   border-bottom:1px solid #fde8d8;">Amount</th>
      </tr>
    </thead>
    <tbody>${buildIngredientRows(s)}</tbody>
  </table>`
    )
    .join("\n");

  // ── YouTube button ──
  const videoButton = youtubeUrl
    ? `
  <tr>
    <td style="padding:0 32px 18px;text-align:center;">
      <a href="${youtubeUrl}"
         target="_blank"
         style="display:inline-block;
                background:#ffffff;
                color:#f97316;
                text-decoration:none;
                font-size:14px;
                font-weight:700;
                padding:12px 32px;
                border-radius:50px;
                border:2px solid #f97316;
                letter-spacing:0.3px;">
        ▶&nbsp;&nbsp;Watch Recipe Video
      </a>
    </td>
  </tr>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${mealType} Reminder</title>
  <style>
    /* ── Serving selector active state ── */
    ${servingOptions
      .map(
        (s) => `
    #srv-${s}:checked ~ * label[for="srv-${s}"] {
      background: #f97316 !important;
      color: #fff !important;
    }`
      )
      .join("")}

    /* ── Serving block visibility ── */
    ${servingCss}

    /* ── Hover on serving labels ── */
    label[for^="srv-"]:hover {
      background: #fff7ed !important;
    }

    /* ── Mobile ── */
    @media only screen and (max-width: 600px) {
      .email-wrap { padding: 16px 8px !important; }
      .email-card { border-radius: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f0eb;font-family:'Segoe UI',Arial,sans-serif;">

  ${radioInputs}

  <table class="email-wrap" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f4f0eb;padding:32px 16px;">
    <tr><td align="center">

      <table class="email-card" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;
                    overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10);">

        <!-- ═══ BANNER ═══ -->
        <tr>
          <td style="background:linear-gradient(135deg,#f97316 0%,#fb923c 100%);
                     padding:30px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;">
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

        <!-- ═══ RECIPE IMAGE ═══ -->
        ${
          image
            ? `<tr>
               <td style="padding:0;line-height:0;">
                 <img src="${image}" alt="${mealName}" width="600"
                      style="width:100%;max-height:300px;object-fit:cover;display:block;"/>
               </td>
             </tr>`
            : ""
        }

        <!-- ═══ RECIPE NAME ═══ -->
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

        <!-- ═══ DIVIDER ═══ -->
        <tr>
          <td style="padding:0 32px;">
            <hr style="border:none;border-top:2px solid #fde8d8;margin:14px 0;"/>
          </td>
        </tr>

        <!-- ═══ SERVING SELECTOR ═══ -->
        <tr>
          <td style="padding:4px 32px 16px;">
            <p style="margin:0 0 10px;font-size:11px;color:#f97316;font-weight:700;
                      letter-spacing:2px;text-transform:uppercase;">
              👥&nbsp;Servings
            </p>
            <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
              ${servingLabels}
            </div>
            <p style="margin:8px 0 0;font-size:11px;color:#bbb;">
              Tap a number to scale ingredient amounts automatically
            </p>
          </td>
        </tr>

        <!-- ═══ INGREDIENTS ═══ -->
        <tr>
          <td style="padding:4px 32px 28px;">
            <p style="margin:0 0 12px;font-size:11px;color:#f97316;font-weight:700;
                      letter-spacing:2px;text-transform:uppercase;">
              🧾&nbsp;Ingredients
            </p>
            ${ingredientBlocks}
          </td>
        </tr>

        <!-- ═══ VIDEO BUTTON ═══ -->
        ${videoButton}

        <!-- ═══ CTA ═══ -->
        <tr>
          <td style="padding:0 32px 36px;text-align:center;">
            <a href="https://recipe-finder-fmn8.vercel.app/meal-planner"
               target="_blank"
               style="display:inline-block;
                      background:linear-gradient(135deg,#f97316 0%,#fb923c 100%);
                      color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;
                      padding:14px 40px;border-radius:50px;
                      box-shadow:0 4px 16px rgba(249,115,22,0.38);letter-spacing:0.4px;">
              🍳&nbsp;View My Meal Planner
            </a>
            <p style="margin:10px 0 0;font-size:12px;color:#bbb;">
              Click to open your full meal plan for the week
            </p>
          </td>
        </tr>

        <!-- ═══ FOOTER ═══ -->
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
  } catch (err) {
    console.error("[MealReminder] Transporter creation failed:", err.message);
    return report;
  }

  let snap;
  try {
    snap = await getDocs(collection(db, "MealPlanner"));
  } catch (err) {
    console.error("[MealReminder] Failed to read MealPlanner collection:", err.message);
    return report;
  }

  if (snap.empty) {
    console.log("[MealReminder] MealPlanner collection is empty.");
    return report;
  }

  console.log(`[MealReminder] Found ${snap.docs.length} MealPlanner doc(s).`);

  for (const docSnap of snap.docs) {
    if (Date.now() - start > MAX_TIME) break;

    const uid = docSnap.id;
    const plannerDoc = docSnap.data();
    report.usersChecked++;

    console.log(`\n[MealReminder] ── Processing uid: ${uid} ──`);

    // STEP A: Fetch user preferences
    let userData = null;
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        console.log(`[MealReminder] SKIP uid=${uid} → no users/{uid} doc found`);
        report.skipped++;
        continue;
      }
      userData = userSnap.data();
      console.log(`[MealReminder] User preferences:`, {
        emailNotifications: userData?.preferences?.emailNotifications,
        mealReminder: userData?.preferences?.mealReminder,
      });
    } catch (err) {
      console.error(`[MealReminder] ERROR fetching user doc uid=${uid}:`, err.message);
      report.errors++;
      continue;
    }

    // STEP B: Check emailNotifications
    if (userData?.preferences?.emailNotifications === false) {
      console.log(`[MealReminder] SKIP uid=${uid} → emailNotifications is false`);
      report.skipped++;
      continue;
    }

    // STEP C: Check mealReminder
    if (userData?.preferences?.mealReminder === false) {
      console.log(`[MealReminder] SKIP uid=${uid} → mealReminder is false`);
      report.skipped++;
      continue;
    }

    // STEP D: Resolve email
    const email =
      plannerDoc.ownerEmail ||
      userData?.email ||
      userData?.profile?.email ||
      userData?.auth?.email ||
      null;

    console.log(`[MealReminder] Email resolved: "${email}"`);

    if (!email || !email.includes("@")) {
      console.log(`[MealReminder] SKIP uid=${uid} → no valid email found`);
      report.skipped++;
      continue;
    }

    // STEP E: Resolve display name
    const ownerName =
      plannerDoc.ownerName ||
      userData?.profile?.name ||
      userData?.displayName ||
      email.split("@")[0] ||
      "there";

    // STEP F: Time in user's timezone
    const timeZone = plannerDoc.timeZone || "Asia/Kolkata";
    const { weekday, hhmm, dateKey } = getNowForTimeZone(timeZone);

    console.log(
      `[MealReminder] Time info: timeZone="${timeZone}", weekday="${weekday}", now="${hhmm}", dateKey="${dateKey}"`
    );

    // STEP G: Today's meals
    const todaysMeals = plannerDoc.planner?.[weekday];
    console.log(`[MealReminder] planner["${weekday}"] =`, JSON.stringify(todaysMeals));

    if (!todaysMeals) {
      console.log(`[MealReminder] SKIP uid=${uid} → no meals found for "${weekday}"`);
      continue;
    }

    // STEP H: Loop each meal type
    for (const mealType of Object.keys(DEFAULT_REMINDER_TIMES)) {
      const meal = todaysMeals[mealType];

      console.log(
        `[MealReminder]   ${mealType}: meal=${meal ? `"${getMealName(meal)}"` : "null"}`
      );

      if (!meal) {
        console.log(`[MealReminder]   SKIP ${mealType} → not assigned`);
        continue;
      }

      // STEP I: Reminder fire time
      const rawMealTime =
        plannerDoc.reminderTimes?.[mealType] || DEFAULT_REMINDER_TIMES[mealType];
      const reminderTime = toReminderTime(rawMealTime);

      console.log(
        `[MealReminder]   ${mealType}: rawMealTime="${rawMealTime}", reminderTime="${reminderTime}", currentTime="${hhmm}", window=±${WINDOW_MINUTES}min`
      );

      if (!reminderTime) {
        console.log(`[MealReminder]   SKIP ${mealType} → could not parse reminderTime`);
        continue;
      }

      if (!isWithinWindow(reminderTime, hhmm)) {
        console.log(
          `[MealReminder]   SKIP ${mealType} → not in time window (reminder="${reminderTime}", now="${hhmm}")`
        );
        continue;
      }

      // STEP J: Dedup check
      const logId = `${uid}_${dateKey}_${mealType}`;
      const logRef = doc(db, "mealReminderLogs", logId);

      try {
        const logSnap = await getDoc(logRef);
        if (logSnap.exists()) {
          console.log(
            `[MealReminder]   SKIP ${mealType} → already sent today (logId=${logId})`
          );
          continue;
        }
      } catch (err) {
        console.error(`[MealReminder]   ERROR checking log ${logId}:`, err.message);
        continue;
      }

      // STEP K: Resolve ingredients (with live API fallback for API meals)
      const mealEmoji = getMealEmoji(mealType);
      const mealName = getMealName(meal);
      const mealImage = getMealImage(meal);
      const youtubeUrl = getMealYoutube(meal);

      let ingredients = getMealIngredients(meal);

      // Fallback: fetch from TheMealDB if stored meal has no ingredients
      const isCommunityMeal = String(meal.idMeal || "").startsWith("community_");
      if (!ingredients.length && meal.idMeal && !isCommunityMeal) {
        console.log(
          `[MealReminder]   Ingredients missing for API meal "${mealName}", fetching from TheMealDB...`
        );
        ingredients = await fetchIngredientsFromApi(meal.idMeal);
      }

      // Resolve base servings (saved per-meal in planner, or fall back to default)
      const baseServings =
        typeof meal.servings === "number" && meal.servings > 0
          ? meal.servings
          : DEFAULT_SERVINGS;

      console.log(
        `[MealReminder]   SENDING to ${email}: ${mealType} — ${mealName} (${ingredients.length} ingredients, baseServings=${baseServings}, youtube=${youtubeUrl ? "yes" : "no"})`
      );

      // STEP L: Send email
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
            youtubeUrl,
            baseServings,
          }),
        });

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
        console.log(`[MealReminder]   ✅ Sent ${mealType} reminder to ${email}`);
      } catch (err) {
        console.error(`[MealReminder]   ❌ Failed to send to ${email}:`, err.message);
        report.errors++;
      }
    }
  }

  console.log("\n[MealReminder] Final Report:", report);
  return report;
};