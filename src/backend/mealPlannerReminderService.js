// src/services/mealPlannerReminderService.js

import dotenv from "dotenv";
import http from "http";
import nodemailer from "nodemailer";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../config/firbase.js";

dotenv.config();

/* ==============================
   CONFIG
============================== */

const DEFAULT_REMINDER_TIMES = {
  Breakfast: "08:00",
  Lunch: "13:00",
  Dinner: "20:00",
};

// How many minutes BEFORE meal time to send the reminder
const REMINDER_LEAD_MINUTES = 30;

// How many minutes either side of reminder time to still send (cron window)
const WINDOW_MINUTES = 4;

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
    throw new Error(
      "SMTP credentials missing. Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS."
    );
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
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(now);

  return { weekday, hhmm, dateKey };
};

const toReminderTime = (mealTime, leadMinutes = REMINDER_LEAD_MINUTES) => {
  const match = String(mealTime ?? "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (isNaN(hours) || isNaN(minutes)) return null;

  const total = hours * 60 + minutes - leadMinutes;
  const normalized = ((total % 1440) + 1440) % 1440;

  const hh = String(Math.floor(normalized / 60)).padStart(2, "0");
  const mm = String(normalized % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

const isWithinWindow = (target, current, windowMin = WINDOW_MINUTES) => {
  const parseMinutes = (str) => {
    const parts = String(str).trim().split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };
  const targetMin = parseMinutes(target);
  const currentMin = parseMinutes(current);
  if (targetMin === null || currentMin === null) return false;
  return Math.abs(currentMin - targetMin) <= windowMin;
};

/* ==============================
   EMAIL HELPERS
============================== */

const getUserEmail = async (uid, plannerDocData) => {
  if (plannerDocData?.ownerEmail?.includes("@")) {
    return plannerDocData.ownerEmail;
  }

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) {
      console.warn(`[EMAIL] No users doc for uid: ${uid}`);
      return null;
    }
    const d = userSnap.data() || {};
    const email = d.email || d.profile?.email || d.auth?.email || null;

    if (email?.includes("@")) return email;

    console.warn(`[EMAIL] No valid email field found for uid: ${uid}`, Object.keys(d));
    return null;
  } catch (error) {
    console.error(`[EMAIL] Lookup error for uid ${uid}:`, error.message);
    return null;
  }
};

const getMealName = (meal) =>
  meal?.strMeal || meal?.title || meal?.name || "Planned Recipe";

/* ==============================
   EMAIL TEMPLATE
============================== */

const buildReminderHtml = ({ mealName, mealType, weekday, timeLabel }) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:20px;background:#f4f7fb;font-family:Arial,sans-serif;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #eee;">
      <h2 style="color:#ff7043;margin-top:0;">🍽️ Meal Reminder</h2>
      <p style="color:#555;">Time to prepare your <b>${mealType}</b> for <b>${weekday}</b>!</p>
      <div style="background:#fff7ed;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #ff7043;">
        <h3 style="margin:0;color:#9a3412;">${mealName}</h3>
        <p style="margin:8px 0 0;font-size:14px;color:#7c2d12;">
          ⏰ Reminder sent at: ${timeLabel}
        </p>
      </div>
      <p style="font-size:14px;color:#555;">
        Open Recipe Finder and start preparing — your meal is coming up soon!
      </p>

      <!-- ✅ Added app button -->
      <div style="text-align:center;margin:24px 0;">
        
          href="https://recipe-finder-fmn8.vercel.app"
          target="_blank"
          style="
            display:inline-block;
            background:#ff7043;
            color:#fff;
            text-decoration:none;
            padding:12px 28px;
            border-radius:8px;
            font-size:15px;
            font-weight:bold;
            letter-spacing:0.3px;
          "
        >
          🍳 Open Recipe Finder
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
      <p style="font-size:12px;color:#aaa;">
        You are receiving this because you have meal reminders enabled in Recipe Finder.
      </p>
    </div>
  </body>
</html>
`;

/* ==============================
   MAIN REMINDER ENGINE
============================== */

export const checkAndSendMealPlannerReminders = async (options = {}) => {
  const { debug = false, dryRun = false, force = false } = options;

  const report = {
    runAt: new Date().toISOString(),
    options: { debug, dryRun, force, leadMinutes: REMINDER_LEAD_MINUTES },
    summary: { usersChecked: 0, matches: 0, sent: 0, skipped: 0, errors: 0 },
  };

  // ── SMTP setup ──
  let smtpTransporter;
  try {
    smtpTransporter = createSmtpTransporter();
    if (debug) console.log("[SMTP] Transporter ready");
  } catch (err) {
    console.error("[SMTP] Setup failed:", err.message);
    report.summary.errors++;
    return report;
  }

  // ── Fetch all planner docs ──
  let plannerSnap;
  try {
    plannerSnap = await getDocs(collection(db, "MealPlanner"));
  } catch (error) {
    console.error("[DB] Failed to fetch MealPlanner:", error.message);
    return report;
  }

  if (plannerSnap.empty) {
    console.log("[DB] No MealPlanner documents found.");
    return report;
  }

  console.log(`[RUN] Checking ${plannerSnap.docs.length} planner docs...`);

  for (const plannerDoc of plannerSnap.docs) {
    const uid = plannerDoc.id;
    const data = plannerDoc.data() || {};
    const planner = data.planner || {};
    const reminderEnabled = data.reminderEnabled !== false;

    report.summary.usersChecked++;

    const timeZone = data.timeZone || "Asia/Kolkata";

    const reminderTimes = {
      ...DEFAULT_REMINDER_TIMES,
      ...(data.reminderTimes || {}),
    };

    const { weekday, hhmm, dateKey } = getNowForTimeZone(timeZone);
    const dayMeals = planner?.[weekday];

    if (debug) {
      console.log(`\n[USER] uid=${uid}`);
      console.log(`  reminderEnabled=${reminderEnabled}, timeZone=${timeZone}`);
      console.log(`  currentTime=${hhmm}, weekday=${weekday}, dateKey=${dateKey}`);
      console.log(`  hasMealsToday=${!!dayMeals}`);
      if (dayMeals) console.log(`  mealKeys=${Object.keys(dayMeals).join(", ")}`);
    }

    if (!reminderEnabled) {
      if (debug) console.log(`  → SKIP: reminders disabled`);
      report.summary.skipped++;
      continue;
    }

    if (!dayMeals) {
      if (debug) console.log(`  → SKIP: no meals planned for ${weekday}`);
      report.summary.skipped++;
      continue;
    }

    for (const mealType of Object.keys(DEFAULT_REMINDER_TIMES)) {
      const plannedMeal = dayMeals?.[mealType];
      const mealTime = reminderTimes?.[mealType];
      const reminderTime = toReminderTime(mealTime);

      if (debug) {
        console.log(`\n  [MEAL] ${mealType}`);
        console.log(`    mealTime=${mealTime} → reminderTime=${reminderTime}, now=${hhmm}`);
        console.log(`    hasMeal=${!!plannedMeal}`);
      }

      if (!plannedMeal) {
        if (debug) console.log(`    → SKIP: no meal planned`);
        report.summary.skipped++;
        continue;
      }

      if (!mealTime || !reminderTime) {
        if (debug) console.log(`    → SKIP: invalid time config`);
        report.summary.skipped++;
        continue;
      }

      // Time window check
      if (!force && !isWithinWindow(reminderTime, hhmm)) {
        if (debug) console.log(`    → SKIP: not in window (need ${reminderTime} ± ${WINDOW_MINUTES}min, got ${hhmm})`);
        continue;
      }

      report.summary.matches++;
      if (debug) console.log(`    ✅ TIME MATCH`);

      // ✅ FIX 1: Dedup check — always enforced regardless of force flag
      const logId = `${uid}_${dateKey}_${mealType}`;
      const logRef = doc(db, "mealReminderLogs", logId);

      try {
        const logSnap = await getDoc(logRef);
        if (logSnap.exists()) {
          if (debug) console.log(`    → SKIP: already sent (logId=${logId})`);
          report.summary.skipped++;
          continue; // ← always skip if already sent, force or not
        }
      } catch (logError) {
        console.warn(`    [LOG] Check failed (will proceed): ${logError.message}`);
      }

      // Get email
      const toEmail = await getUserEmail(uid, data);
      if (!toEmail) {
        console.warn(`    [EMAIL] No email for uid=${uid} — skipping`);
        report.summary.skipped++;
        continue;
      }

      const mealName = getMealName(plannedMeal);

      if (dryRun) {
        console.log(`    [DRY RUN] Would send "${mealName}" reminder to ${toEmail}`);
        report.summary.sent++;
        continue;
      }

      // Send email
      try {
        const info = await smtpTransporter.sendMail({
          from: `"Recipe Finder" <${process.env.EMAIL_FROM}>`,
          to: toEmail,
          subject: `⏰ ${mealType} Reminder: ${mealName}`,
          text: `Reminder: Your ${mealType} (${mealName}) is coming up at ${mealTime}.`,
          html: buildReminderHtml({
            mealName,
            mealType,
            weekday,
            timeLabel: `${reminderTime} (meal at ${mealTime})`,
          }),
        });

        console.log(`✉️  Sent to ${toEmail} | ${mealType} | ${mealName} | id=${info?.messageId}`);

        // ✅ FIX 2: Always write dedup log after a successful send
        await setDoc(logRef, {
          uid,
          dateKey,
          mealType,
          mealName,
          toEmail,
          timeZone,
          sentAt: new Date(),
        });

        report.summary.sent++;
      } catch (error) {
        console.error(`❌ Send failed to ${toEmail}:`, error?.message);
        report.summary.errors++;
      }
    }
  }

  console.log("\n[DONE] Summary:", report.summary);
  return report;
};

/* ==============================
   INIT — runs every 60 seconds
============================== */

export const initMealPlannerReminderService = () => {
  console.log("🍽️  Meal Planner Reminder Service started");
  console.log(`   Reminder times: Breakfast 07:30 | Lunch 12:30 | Dinner 19:30`);
  console.log(`   (${REMINDER_LEAD_MINUTES} min before meal, checking every 60s within ±${WINDOW_MINUTES}min window)`);

  // ✅ FIX 3: Render keep-alive HTTP server — required so Render doesn't kill the process
  const PORT = process.env.PORT || 3000;
  http
    .createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Meal Reminder Service is running\n");
    })
    .listen(PORT, () => {
      console.log(`🌐 Keep-alive server listening on port ${PORT}`);
    });

  // ✅ FIX 4: No longer runs immediately with debug/force on startup — clean production start
  checkAndSendMealPlannerReminders({ debug: false }).catch(console.error);

  // Poll every 60 seconds
  setInterval(async () => {
    try {
      await checkAndSendMealPlannerReminders({ debug: false });
    } catch (err) {
      console.error("[INTERVAL] Error:", err);
    }
  }, 60 * 1000);
};