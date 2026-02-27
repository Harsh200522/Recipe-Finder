// src/services/reminderService.js
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../config/firbase.js";

// ✅ Simple dotenv — Vercel injects env vars automatically, this is just for local dev
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
   EMAIL TRANSPORTER
============================== */

// ✅ Create transporter fresh each call — important for serverless (no persistent state)
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "EMAIL_USER or EMAIL_PASS is missing. Please set them in Vercel environment variables."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
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

const toReminderTime = (mealTime, leadMinutes = REMINDER_LEAD_MINUTES) => {
  const match = String(mealTime || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

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
      console.warn(`⚠️ No user document found for uid: ${uid}`);
      return null;
    }

    const userData = userSnap.data() || {};
    const email =
      userData.email ||
      userData.profile?.email ||
      userData.auth?.email ||
      null;

    return email && email.includes("@") ? email : null;
  } catch (error) {
    console.error(`Email lookup error for uid ${uid}:`, error.message);
    return null;
  }
};

const getMealName = (meal) =>
  meal?.strMeal || meal?.title || meal?.name || "Planned Recipe";

const summarizeMailError = (error) => ({
  name: error?.name,
  message: error?.message,
  code: error?.code,
  responseCode: error?.responseCode,
  command: error?.command,
  response: error?.response,
});

/* ==============================
   EMAIL TEMPLATE
============================== */

const buildReminderHtml = ({ mealName, mealType, weekday, timeLabel }) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:20px;background:#f4f7fb;font-family:Arial;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #eee;">
      <h2 style="color:#f97316;margin-top:0;">🍳 It's Time To Cook</h2>
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

  // ✅ Create transporter once per invocation (serverless-safe)
  let transporter;
  try {
    transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email server ready");
  } catch (err) {
    console.error("❌ Email transporter failed:", err.message);
    report.summary.errors++;
    return report;
  }

  // ✅ Fetch all MealPlanner documents
  let plannerSnap;
  try {
    plannerSnap = await getDocs(collection(db, "MealPlanner"));
  } catch (error) {
    console.error("❌ Failed to fetch MealPlanner collection:", error.message);
    return report;
  }

  if (plannerSnap.empty) {
    console.log("ℹ️ No MealPlanner documents found.");
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

    const userEntry = { uid, timeZone, weekday, nowHHmm: hhmm, reminderEnabled };

    if (!reminderEnabled) {
      if (debug) console.log(`⏭️ Reminders disabled for uid: ${uid}`);
      report.summary.skipped++;
      continue;
    }

    if (!dayMeals) {
      if (debug) console.log(`⏭️ No meals planned for ${weekday} — uid: ${uid}`);
      report.summary.skipped++;
      continue;
    }

    for (const mealType of Object.keys(DEFAULT_REMINDER_TIMES)) {
      const plannedMeal = dayMeals?.[mealType];
      const mealTime = reminderTimes?.[mealType];
      const reminderTime = toReminderTime(mealTime);

      if (!plannedMeal || !mealTime || !reminderTime) {
        report.summary.skipped++;
        continue;
      }

      if (!force && reminderTime !== hhmm) {
        report.summary.skipped++;
        continue;
      }

      report.summary.matches++;

      const logId = `${uid}_${dateKey}_${mealType}`;
      const logRef = doc(db, "mealReminderLogs", logId);

      let logSnap;
      try {
        logSnap = await getDoc(logRef);
      } catch (error) {
        console.error(`❌ Failed to check log for ${logId}:`, error.message);
        report.summary.errors++;
        continue;
      }

      if (!force && logSnap.exists()) {
        if (debug) console.log(`⏭️ Already sent: ${logId}`);
        report.summary.skipped++;
        continue;
      }

      const toEmail = await getUserEmail(uid, data);
      if (!toEmail) {
        console.warn(`⚠️ No email for uid: ${uid} — skipping ${mealType}`);
        report.summary.skipped++;
        continue;
      }

      const mealName = getMealName(plannedMeal);

      if (dryRun) {
        console.log(`🧪 DryRun: would send to ${toEmail} | ${mealType} | ${mealName}`);
        continue;
      }

      try {
        if (debug) {
          console.log("📤 Sending:", { uid, to: toEmail, mealType, mealTime, reminderTime, timeZone });
        }

        const info = await transporter.sendMail({
          from: `"Recipe Finder" <${process.env.EMAIL_USER}>`,
          to: toEmail,
          subject: `🍳 Time to cook: ${mealName}`,
          text: `Reminder: ${mealType} (${mealName}) at ${mealTime}.`,
          html: buildReminderHtml({
            mealName,
            mealType,
            weekday,
            timeLabel: `${reminderTime} (meal at ${mealTime})`,
          }),
        });

        console.log(`✅ Email sent to ${toEmail} | ${mealType} | ${info.messageId}`);

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
        console.error("❌ Send failed:", {
          uid,
          to: toEmail,
          mealType,
          error: summarizeMailError(error),
        });
        report.summary.errors++;
      }
    }

    if (debug) report.users.push(userEntry);
  }

  console.log("📊 Run complete:", report.summary);
  return report;
};