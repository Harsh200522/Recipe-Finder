// src/services/mealPlannerReminderService.js

import dotenv from "dotenv";
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

const REMINDER_LEAD_MINUTES = 30;

/* ==============================
   SMTP EMAIL CLIENT
============================== */

const createSmtpTransporter = () => {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is missing. Please set it in environment variables.");
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error(
      "SMTP credentials are missing. Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS."
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

/* ==============================
   TIME HELPERS
============================== */

const getNowForTimeZone = (timeZone = "UTC") => {
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

// FIX 1: Updated regex to allow single-digit hours (e.g. "8:00")
// FIX 2: Use global isNaN() instead of Number.isNaN() for better string coercion handling
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

/* ==============================
   EMAIL HELPERS
============================== */

const getUserEmail = async (uid, plannerDocData) => {
  if (plannerDocData?.ownerEmail && plannerDocData.ownerEmail.includes("@")) {
    return plannerDocData.ownerEmail;
  }

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) {
      console.warn(`No user document found for uid: ${uid}`);
      return null;
    }

    const userData = userSnap.data() || {};
    const email = userData.email || userData.profile?.email || userData.auth?.email || null;

    return email && email.includes("@") ? email : null;
  } catch (error) {
    console.error(`Email lookup error for uid ${uid}:`, error.message);
    return null;
  }
};

const getMealName = (meal) => meal?.strMeal || meal?.title || meal?.name || "Planned Recipe";

/* ==============================
   EMAIL TEMPLATE
============================== */

const buildReminderHtml = ({ mealName, mealType, weekday, timeLabel }) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:20px;background:#f4f7fb;font-family:Arial;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #eee;">
      <h2 style="color:#f97316;margin-top:0;">It's Time To Cook</h2>
      <p>Reminder for your <b>${mealType}</b> on <b>${weekday}</b>.</p>
      <div style="background:#fff7ed;padding:14px;border-radius:8px;margin:16px 0;">
        <h3 style="margin:0;color:#9a3412;">${mealName}</h3>
        <p style="margin:6px 0 0;font-size:14px;color:#7c2d12;">
          Reminder time: ${timeLabel}
        </p>
      </div>
      <p style="font-size:14px;color:#555;">
        Open Recipe Finder and start preparing your meal.
      </p>
      <hr />
      <p style="font-size:12px;color:#999;">
        Sent automatically from your planner settings.
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
    users: [],
    summary: {
      usersChecked: 0,
      matches: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
    },
  };

  let smtpTransporter;
  try {
    smtpTransporter = createSmtpTransporter();
    console.log("SMTP email client ready");
  } catch (err) {
    console.error("SMTP client failed:", err.message);
    report.summary.errors++;
    return report;
  }

  let plannerSnap;
  try {
    plannerSnap = await getDocs(collection(db, "MealPlanner"));
  } catch (error) {
    console.error("Failed to fetch MealPlanner collection:", error.message);
    return report;
  }

  if (plannerSnap.empty) {
    console.log("No MealPlanner documents found.");
    return report;
  }

  for (const plannerDoc of plannerSnap.docs) {
    const uid = plannerDoc.id;
    const data = plannerDoc.data() || {};
    const planner = data.planner || {};
    const reminderEnabled = data.reminderEnabled !== false;

    report.summary.usersChecked++;

    const timeZone = data.timeZone || "UTC";
    const reminderTimes = {
      ...DEFAULT_REMINDER_TIMES,
      ...(data.reminderTimes || {}),
    };

    const { weekday, hhmm, dateKey } = getNowForTimeZone(timeZone);
    const dayMeals = planner?.[weekday];

    if (debug) {
      console.log(`\n[DEBUG] User: ${uid}`);
      console.log(`  - Reminder Enabled: ${reminderEnabled}`);
      console.log(`  - TimeZone: ${timeZone}`);
      console.log(`  - Current Time: ${hhmm} on ${weekday}`);
      console.log(`  - Has meals for ${weekday}?: ${!!dayMeals}`);
      if (dayMeals) {
        console.log(`  - Meals keys: ${Object.keys(dayMeals).join(", ")}`);
      }
    }

    if (!reminderEnabled || !dayMeals) {
      if (debug) {
        console.log(`  → SKIPPED: ${!reminderEnabled ? "Reminders disabled" : "No meals for today"}`);
      }
      report.summary.skipped++;
      continue;
    }

    for (const mealType of Object.keys(DEFAULT_REMINDER_TIMES)) {
      const plannedMeal = dayMeals?.[mealType];
      const mealTime = reminderTimes?.[mealType];
      const reminderTime = toReminderTime(mealTime);

      if (debug) {
        console.log(`    [${mealType}] mealTime=${mealTime}, reminderTime=${reminderTime}, currentTime=${hhmm}`);
      }

      if (!plannedMeal || !mealTime || !reminderTime) {
        if (debug) {
          console.log(`      → SKIPPED: ${!plannedMeal ? "no meal" : !mealTime ? "no time" : "invalid time"}`);
        }
        report.summary.skipped++;
        continue;
      }

      if (!force && reminderTime !== hhmm) {
        if (debug) {
          console.log(`      → SKIPPED: time mismatch (${reminderTime} !== ${hhmm})`);
        }
        report.summary.skipped++;
        continue;
      }

      report.summary.matches++;
      if (debug) {
        console.log(`      ✅ MATCH FOUND!`);
      }

      const logId = `${uid}_${dateKey}_${mealType}`;
      const logRef = doc(db, "mealReminderLogs", logId);

      try {
        const logSnap = await getDoc(logRef);
        if (!force && logSnap.exists()) {
          if (debug) {
            console.log(`      ⏭️  ALREADY SENT: Log exists (${logId})`);
          }
          report.summary.skipped++;
          continue;
        }
        if (debug && !logSnap.exists()) {
          console.log(`      📝 New log entry needed (${logId})`);
        }
      } catch (logError) {
        if (debug) {
          console.log(`      ⚠️  Log check failed: ${logError.message}`);
        }
      }

      const toEmail = await getUserEmail(uid, data);
      if (!toEmail) {
        if (debug) {
          console.log(`      ❌ NO EMAIL FOUND for user ${uid}`);
          console.log(`         - ownerEmail: ${data.ownerEmail || "not set"}`);
        }
        report.summary.skipped++;
        continue;
      }
      if (debug) {
        console.log(`      📧 Email found: ${toEmail}`);
      }

      const mealName = getMealName(plannedMeal);

      if (dryRun) {
        if (debug) {
          console.log(`      🔄 DRY RUN: Would send email to ${toEmail}`);
        }
        continue;
      }

      try {
        if (debug) {
          console.log(`      🚀 Sending email...`);
        }
        const mailOptions = {
          from: `"Recipe Finder" <${process.env.EMAIL_FROM}>`,
          to: toEmail,
          subject: `Time to cook: ${mealName}`,
          text: `Reminder: ${mealType} (${mealName}) at ${mealTime}.`,
          html: buildReminderHtml({
            mealName,
            mealType,
            weekday,
            timeLabel: `${reminderTime} (meal at ${mealTime})`,
          }),
        };

        const info = await smtpTransporter.sendMail(mailOptions);

        console.log(
          `✉️  Email sent to ${toEmail} | ${mealType} | messageId: ${info?.messageId || "N/A"}`
        );
        if (debug) {
          console.log(`      ✅ SUCCESS: Email delivered`);
        }

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
        console.error(`❌ Send FAILED to ${toEmail}:`, error?.message);
        if (debug) {
          console.log(`      Error details:`, error);
        }
        report.summary.errors++;
      }
    }
  }

  console.log("Run complete:", report.summary);
  return report;
};

/* ==============================
   AUTO RUNNER
============================== */

// FIX 3: Align interval to the top of the minute so hhmm comparisons always match.
// Old code fired at arbitrary seconds (e.g. 05:06:36, 05:07:36) and never hit 07:30 exactly.
// New code waits until the next clean :00 second, then ticks every 60s from there.
export const initMealPlannerReminderService = () => {
  let isRunning = false;

  const run = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await checkAndSendMealPlannerReminders();
    } catch (error) {
      console.error("Reminder error:", error);
    } finally {
      isRunning = false;
    }
  };

  // Calculate ms remaining until the next whole minute
  const now = new Date();
  const msUntilNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  console.log(
    `Reminder service: first run in ${(msUntilNextMinute / 1000).toFixed(1)}s (aligning to minute boundary)`
  );

  setTimeout(() => {
    run(); // Fire exactly at the top of the minute
    setInterval(run, 60 * 1000); // Then every 60s, always aligned
  }, msUntilNextMinute);

  console.log("Reminder service started. Aligned to minute boundary.");
};