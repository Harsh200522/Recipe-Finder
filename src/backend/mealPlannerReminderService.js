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
  <div style="font-family:Segoe UI,Tahoma,sans-serif;background:#f8fafc;padding:20px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:24px;">
      <h2 style="margin:0 0 12px;color:#111827;">It's Time To Cook</h2>
      <p style="margin:0 0 10px;color:#374151;">
        Reminder for your <b>${mealType}</b> on <b>${weekday}</b> at <b>${timeLabel}</b>.
      </p>
      <p style="margin:0 0 16px;color:#111827;">
        Today's recipe: <b>${mealName}</b>
      </p>
      <p style="margin:0;color:#6b7280;font-size:13px;">
        Sent automatically from your Recipe Finder Meal Planner.
      </p>
    </div>
  </div>
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
