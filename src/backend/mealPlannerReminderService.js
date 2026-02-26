import nodemailer from "nodemailer";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";

const DEFAULT_REMINDER_TIMES = {
  Breakfast: "08:00",
  Lunch: "13:00",
  Dinner: "20:00",
};
const REMINDER_LEAD_MINUTES = 30;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

const getUserEmail = async (uid, plannerDocData) => {
  if (plannerDocData?.ownerEmail) return plannerDocData.ownerEmail;

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) return null;

    const userData = userSnap.data() || {};
    return (
      userData.email ||
      userData.profile?.email ||
      userData.auth?.email ||
      null
    );
  } catch {
    return null;
  }
};

const getMealName = (meal) =>
  meal?.strMeal || meal?.title || meal?.name || "Planned Recipe";

const buildReminderHtml = ({ mealName, mealType, weekday, timeLabel }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meal Reminder</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background: #f4f7fb;
        font-family: Segoe UI, Tahoma, Arial, sans-serif;
      }
      .wrapper {
        width: 100%;
        padding: 24px 12px;
      }
      .card {
        max-width: 620px;
        margin: 0 auto;
        border-radius: 18px;
        overflow: hidden;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 10px 28px rgba(17, 24, 39, 0.08);
      }
      .header {
        padding: 28px 24px;
        background: linear-gradient(135deg, #f97316, #fb923c);
        color: #ffffff;
      }
      .brand {
        font-size: 13px;
        letter-spacing: 0.3px;
        opacity: 0.95;
      }
      .title {
        margin: 8px 0 0;
        font-size: 28px;
        line-height: 1.2;
        font-weight: 700;
      }
      .content {
        padding: 24px;
      }
      .recipe-box {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 14px;
        padding: 16px;
        margin: 14px 0 16px;
      }
      .recipe-name {
        margin: 0;
        font-size: 22px;
        line-height: 1.3;
        font-weight: 700;
        color: #9a3412;
      }
      .meta {
        margin: 6px 0 0;
        color: #7c2d12;
        font-size: 14px;
      }
      .note {
        margin: 16px 0 0;
        color: #4b5563;
        font-size: 14px;
        line-height: 1.55;
      }
      .footer {
        padding: 16px 24px 22px;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 12px;
        text-align: center;
      }
      @media only screen and (max-width: 600px) {
        .wrapper {
          padding: 10px;
        }
        .header {
          padding: 22px 16px;
        }
        .title {
          font-size: 22px;
        }
        .content {
          padding: 16px;
        }
        .recipe-name {
          font-size: 18px;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <div class="header">
          <div class="brand">Recipe Finder Meal Planner</div>
          <h1 class="title">It's Time To Cook</h1>
        </div>
        <div class="content">
          <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">
            Friendly reminder for your <b>${mealType}</b> on <b>${weekday}</b>.
          </p>
          <div class="recipe-box">
            <p class="recipe-name">${mealName}</p>
            <p class="meta">Reminder time: ${timeLabel}</p>
          </div>
          <p class="note">
            Open Recipe Finder and start preparing your meal now so everything is ready on time.
          </p>
        </div>
        <div class="footer">
          Sent automatically from your planner settings. You received this because reminders are enabled.
        </div>
      </div>
    </div>
  </body>
</html>
`;

export const checkAndSendMealPlannerReminders = async () => {
  const plannerSnap = await getDocs(collection(db, "MealPlanner"));
  if (plannerSnap.empty) return;

  for (const plannerDoc of plannerSnap.docs) {
    const uid = plannerDoc.id;
    const data = plannerDoc.data() || {};
    const planner = data.planner || {};
    const reminderEnabled = data.reminderEnabled !== false;
    if (!reminderEnabled) continue;

    const timeZone = data.timeZone || "UTC";
    const reminderTimes = { ...DEFAULT_REMINDER_TIMES, ...(data.reminderTimes || {}) };
    const { weekday, hhmm, dateKey } = getNowForTimeZone(timeZone);
    const dayMeals = planner?.[weekday];
    if (!dayMeals || typeof dayMeals !== "object") continue;

    for (const mealType of Object.keys(DEFAULT_REMINDER_TIMES)) {
      const plannedMeal = dayMeals?.[mealType];
      const mealTime = reminderTimes?.[mealType];
      const reminderTime = toReminderTime(mealTime);
      if (!plannedMeal || !mealTime || !reminderTime || reminderTime !== hhmm) continue;

      const logId = `${uid}_${dateKey}_${mealType}`;
      const logRef = doc(db, "mealReminderLogs", logId);
      const logSnap = await getDoc(logRef);
      if (logSnap.exists()) continue;

      const toEmail = await getUserEmail(uid, data);
      if (!toEmail) continue;

      const mealName = getMealName(plannedMeal);
      await transporter.sendMail({
        from: `"Recipe Finder" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `🍳 Time to cook: ${mealName}`,
        text: `Reminder: ${mealType} for ${weekday} is at ${mealTime}. This reminder is sent at ${reminderTime}. Recipe: ${mealName}`,
        html: buildReminderHtml({
          mealName,
          mealType,
          weekday,
          timeLabel: `${reminderTime} (for meal at ${mealTime})`,
        }),
      });

      await setDoc(logRef, {
        uid,
        dateKey,
        mealType,
        mealName,
        timeZone,
        sentAt: new Date(),
      });
    }
  }
};

export const initMealPlannerReminderService = () => {
  let isRunning = false;

  const run = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await checkAndSendMealPlannerReminders();
    } catch (error) {
      console.error("Meal planner reminder error:", error);
    } finally {
      isRunning = false;
    }
  };

  setTimeout(run, 10000);
  setInterval(run, 60 * 1000);
};
