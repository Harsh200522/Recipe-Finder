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
const WINDOW_MINUTES = 1;

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

// ✅ FIXED: Handles midnight wrap correctly
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

/* ==============================
   EMAIL TEMPLATE (UNCHANGED)
============================== */

const buildReminderHtml = ({ mealName, mealType, weekday, timeLabel }) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:20px;background:#f4f7fb;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #eee;">
<h2 style="color:#ff7043;">🍽️ Meal Reminder</h2>
<p>Time to prepare your <b>${mealType}</b> for <b>${weekday}</b>!</p>

<div style="background:#fff7ed;padding:16px;border-radius:8px;margin:16px 0;">
<h3>${mealName}</h3>
<p>⏰ ${timeLabel}</p>
</div>

<div style="text-align:center;margin:20px 0;">
<a href="https://recipe-finder-fmn8.vercel.app" target="_blank"
style="background:#ff7043;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
🍳 Open Recipe Finder
</a>
</div>

</div>
</body>
</html>
`;

/* ==============================
   MAIN FUNCTION (SERVERLESS READY)
============================== */

export const checkAndSendMealPlannerReminders = async () => {
  const start = Date.now();
  const MAX_TIME = 8000; // ⏱️ safety

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
          subject: `${type} Reminder`,
          html: buildReminderHtml({
            mealName: getMealName(meal),
            mealType: type,
            weekday,
            timeLabel: reminderTime,
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