import express from 'express';
import cors from 'cors';
import { doc, updateDoc } from "firebase/firestore";
import { db } from './firebase.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";
import {
    checkAndSendMealPlannerReminders,
    initMealPlannerReminderService,
} from "./mealPlannerReminderService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dirname, "..", "..", ".env"),
  quiet: true,
});

const app = express();

// Enable CORS for React app
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"], // React dev servers
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_FALLBACK_MODELS = [
    GEMINI_MODEL,
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-002",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash",
];

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const CONTACT_RECEIVER = process.env.CONTACT_RECEIVER || EMAIL_USER;

const createGmailTransporter = () =>
    nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });

const parseSections = (text = "") => {
    const title = (text.match(/Recipe Name:\s*(.+)/i)?.[1] || "").trim();
    const cookingTime = (text.match(/Cooking Time:\s*(.+)/i)?.[1] || "").trim();
    const calories = (text.match(/Calories Estimate:\s*(.+)/i)?.[1] || "").trim();
    const youtubeSearchQuery = (text.match(/YouTube Search Suggestion:\s*(.+)/i)?.[1] || "").trim();

    const steps = [];
    const stepRegex = /^\s*\d+\.\s+(.+)$/gm;
    let m = stepRegex.exec(text);
    while (m) {
        steps.push(m[1].trim());
        m = stepRegex.exec(text);
    }

    return {
        title: title || "Custom AI Recipe",
        cookingTime: cookingTime || "N/A",
        calories: calories || "N/A",
        recipeSteps: steps,
        youtubeSearchQuery,
    };
};

const sanitizeRecipeSteps = (steps = []) => {
    if (!Array.isArray(steps)) return [];

    const isNumberingArtifact = (value = "") => {
        const t = String(value || "").trim();
        return !t || /^[\d\s.)\]-]+$/.test(t);
    };

    const flattened = [];
    for (const raw of steps) {
        const line = String(raw || "").replace(/\s+/g, " ").trim();
        if (!line) continue;

        const withoutPrefix = line.replace(/^\s*step\s*\d+\s*[:.)-]\s*/i, "").trim();
        if (!withoutPrefix) continue;

        if (/^step\s*\d+\s*$/i.test(withoutPrefix)) continue;
        if (isNumberingArtifact(withoutPrefix)) continue;

        if (withoutPrefix.length > 220) {
            const parts = withoutPrefix
                .split(/(?<=[.!?])\s+(?=[A-Z])/)
                .map((p) => p.trim())
                .filter(Boolean);
            if (parts.length > 1) {
                flattened.push(...parts);
                continue;
            }
        }

        flattened.push(withoutPrefix);
    }

    const deduped = [];
    for (const step of flattened) {
        const prev = deduped[deduped.length - 1];
        if (prev && prev.toLowerCase() === step.toLowerCase()) continue;
        deduped.push(step);
    }

    return deduped.slice(0, 8);
};

const splitIngredients = (ingredients = "") =>
    String(ingredients)
        .split(/[,\n]/)
        .map((i) => i.trim().toLowerCase())
        .filter(Boolean);

const estimateCookingTime = (stepCount = 0) => {
    const mins = Math.max(20, Math.min(55, stepCount * 4 + 8));
    return `${mins}-${mins + 8} mins`;
};

const estimateCalories = (ingredientCount = 0) => {
    const low = Math.max(180, ingredientCount * 55 + 120);
    const high = low + 120;
    return `${low}-${high} kcal/serving`;
};

const NON_VEG_KEYWORDS = [
    "chicken", "mutton", "pork", "beef", "lamb", "duck", "turkey", "goat",
    "fish", "salmon", "tuna", "prawn", "shrimp", "crab", "lobster", "egg",
    "bacon", "ham", "sausage", "pepperoni", "salami", "anchovy", "sardine",
    "oyster", "mussel", "clam", "squid", "octopus", "gelatin", "lard", "broth", "stock"
];

const textHasNonVeg = (text = "") => {
    const normalized = String(text || "").toLowerCase();
    return NON_VEG_KEYWORDS.some((k) => normalized.includes(k));
};

const mealIsNonVeg = (meal) => {
    const category = String(meal?.strCategory || "").toLowerCase();
    if (category.includes("seafood") || category.includes("chicken") || category.includes("beef") || category.includes("pork") || category.includes("lamb") || category.includes("goat")) {
        return true;
    }
    for (let i = 1; i <= 20; i += 1) {
        const ing = String(meal?.[`strIngredient${i}`] || "").trim().toLowerCase();
        if (ing && textHasNonVeg(ing)) return true;
    }
    return false;
};

const filterMealsByDiet = (meals = [], dietPreference = "any") => {
    if (dietPreference === "veg") {
        return meals.filter((meal) => !mealIsNonVeg(meal));
    }
    if (dietPreference === "nonveg") {
        return meals.filter((meal) => mealIsNonVeg(meal));
    }
    return meals;
};

const fallbackCursorByPrimary = new Map();

const parseInstructionSteps = (instructions = "") => {
    const cleaned = String(instructions || "").replace(/\r/g, "\n").trim();
    if (!cleaned) return [];

    const chunks = cleaned
        .split(/\n+/)
        .map((line) => line.replace(/^\s*\d+[\.\)]\s*/, "").trim())
        .filter((line) => line && !/^[\d\s.)\]-]+$/.test(line));

    if (chunks.length >= 3) {
        return chunks.slice(0, 8);
    }

    const sentences = cleaned
        .split(/[.!?]\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 8);

    return sentences.slice(0, 8);
};

const mealContainsIngredients = (meal, required = []) => {
    const available = [];
    for (let i = 1; i <= 20; i += 1) {
        const ing = String(meal?.[`strIngredient${i}`] || "").trim().toLowerCase();
        if (ing) available.push(ing);
    }
    return required.every((term) => available.some((ing) => ing.includes(term) || term.includes(ing)));
};

const buildGenericFallbackRecipe = (ingredients = "", dietPreference = "any") => {
    const items = splitIngredients(ingredients);
    const main = items[0] || "mixed ingredients";
    const proteinHint = dietPreference === "nonveg" ? " with Chicken/Egg" : "";
    const displayName = (main.charAt(0).toUpperCase() + main.slice(1)) + proteinHint;
    const steps = [
        "Prep all ingredients: wash, chop, and keep them ready.",
        `Heat oil in a pan, then saute ${main} with aromatics like onion/garlic if available.`,
        "Add the remaining ingredients in stages and cook on medium heat.",
        ...(dietPreference === "nonveg"
            ? ["Add one non-veg protein (chicken/egg/prawns) and cook until fully done."]
            : []),
        "Season with salt, pepper, and your preferred spices.",
        "Cover and cook until tender, stirring occasionally to avoid sticking.",
        "Taste, adjust seasoning, and finish with herbs or lemon juice if available.",
        "Serve hot with rice, bread, or salad.",
    ];

    const youtubeSearchQuery =
        dietPreference === "nonveg"
            ? `${displayName} non veg recipe`
            : `${displayName} easy recipe`;
    return {
        title: `${displayName} Quick Home Recipe`,
        cookingTime: "25-35 mins",
        calories: "260-420 kcal/serving",
        recipeSteps: steps,
        youtubeSearchQuery,
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSearchQuery)}`,
        imageUrl: "",
        source: "fallback-generic",
    };
};

const needsFallbackValue = (value = "") => {
    const v = String(value || "").trim().toLowerCase();
    return !v || v === "n/a" || v.includes("see instructions") || v.includes("not available");
};

const chooseNextRecipe = (primaryKey, meals = []) => {
    if (!meals.length) return null;
    const key = String(primaryKey || "default");
    const prev = fallbackCursorByPrimary.get(key) || 0;
    const next = prev % meals.length;
    fallbackCursorByPrimary.set(key, prev + 1);
    return meals[next];
};

const fetchMealDbImageByTitle = async (title = "") => {
    const q = String(title || "").trim();
    if (!q) return "";
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
        const data = await res.json();
        return data?.meals?.[0]?.strMealThumb || "";
    } catch {
        return "";
    }
};

const normalizeRecipePayload = async ({ payload, ingredients, dietPreference = "any" }) => {
    const items = splitIngredients(ingredients);
    const steps = sanitizeRecipeSteps(payload?.recipeSteps || []);
    const ingredientCount = Math.max(items.length, 4);

    const normalized = {
        ...payload,
        recipeSteps: steps.length ? steps : buildGenericFallbackRecipe(ingredients, dietPreference).recipeSteps,
    };

    if (needsFallbackValue(normalized.cookingTime)) {
        normalized.cookingTime = estimateCookingTime(normalized.recipeSteps.length || 6);
    }
    if (needsFallbackValue(normalized.calories)) {
        normalized.calories = estimateCalories(ingredientCount);
    }
    if (!normalized.imageUrl) {
        normalized.imageUrl = await fetchMealDbImageByTitle(normalized.title);
    }

    const combinedText = `${normalized.title || ""} ${normalized.youtubeSearchQuery || ""} ${(normalized.recipeSteps || []).join(" ")}`;
    const hasNonVeg = textHasNonVeg(combinedText);

    if (dietPreference === "veg" && hasNonVeg) {
        return buildGenericFallbackRecipe(ingredients, "veg");
    }

    if (dietPreference === "nonveg" && !hasNonVeg) {
        normalized.title = normalized.title ? `${normalized.title} (Non-Veg Style)` : "Non-Veg Style Recipe";
        normalized.recipeSteps = [
            ...(normalized.recipeSteps || []),
            "Finish by adding cooked chicken, egg, or prawns and simmer for 3-4 minutes.",
        ];
        if (!textHasNonVeg(normalized.youtubeSearchQuery || "")) {
            normalized.youtubeSearchQuery = `${normalized.title} chicken recipe`;
        }
    }

    return normalized;
};

const fetchMealDbFallbackRecipe = async (
    ingredients = "",
    dietPreference = "any",
    sessionId = "",
    requestIndex = 0
) => {
    const items = splitIngredients(ingredients);
    if (!items.length) return buildGenericFallbackRecipe(ingredients, dietPreference);

    const primary = items[0];
    const listRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(primary)}`);
    const listData = await listRes.json();
    const candidates = Array.isArray(listData?.meals) ? listData.meals.slice(0, 8) : [];

    if (!candidates.length) {
        return buildGenericFallbackRecipe(ingredients, dietPreference);
    }

    const detailedMeals = await Promise.all(
        candidates.map(async (meal) => {
            const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(meal.idMeal)}`);
            const detailData = await detailRes.json();
            return detailData?.meals?.[0] || null;
        })
    );

    const validMeals = filterMealsByDiet(detailedMeals.filter(Boolean), dietPreference);
    const matchedMeals = validMeals.filter((meal) => mealContainsIngredients(meal, items.slice(1)));
    const pool = matchedMeals.length ? matchedMeals : validMeals;
    let selected = null;
    if (requestIndex > 0 && pool.length > 0) {
        selected = pool[(requestIndex - 1) % pool.length];
    }
    if (!selected) {
        selected = chooseNextRecipe(`${sessionId || "default"}|${dietPreference}|${primary}`, pool);
    }

    if (!selected) {
        return buildGenericFallbackRecipe(ingredients, dietPreference);
    }

    const recipeSteps = parseInstructionSteps(selected.strInstructions);
    const ingredientCount = Array.from({ length: 20 }, (_, i) =>
        String(selected?.[`strIngredient${i + 1}`] || "").trim()
    ).filter(Boolean).length;
    const youtubeSearchQuery = selected.strMeal || `${primary} recipe`;
    const youtubeUrl = selected.strYoutube
        ? selected.strYoutube
        : `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeSearchQuery)}`;

    return normalizeRecipePayload({
        payload: {
            title: selected.strMeal || "Suggested Recipe",
            cookingTime: estimateCookingTime(recipeSteps.length || 6),
            calories: estimateCalories(ingredientCount || items.length || 5),
            recipeSteps: recipeSteps.length ? recipeSteps : buildGenericFallbackRecipe(ingredients, dietPreference).recipeSteps,
            youtubeSearchQuery,
            youtubeUrl,
            imageUrl: selected.strMealThumb || "",
            source: "fallback-themealdb",
        },
        ingredients,
        dietPreference,
    });
};

const getRetryDelaySeconds = (error) => {
    const details = error?.errorDetails;
    if (!Array.isArray(details)) return null;

    for (const item of details) {
        const retryDelay = item?.retryDelay;
        if (typeof retryDelay === "string" && retryDelay.endsWith("s")) {
            const n = Number.parseInt(retryDelay.replace("s", ""), 10);
            if (Number.isFinite(n) && n > 0) return n;
        }
    }
    return null;
};

const normalizeDietPreference = (value = "any") => {
    const v = String(value || "").trim().toLowerCase();
    if (v === "veg" || v === "vegetarian") return "veg";
    if (v === "nonveg" || v === "non-veg" || v === "non_veg" || v === "non vegetarian") return "nonveg";
    return "any";
};

const buildDietPromptRule = (dietPreference = "any") => {
    if (dietPreference === "veg") {
        return "- Diet Preference: Vegetarian only. Do not include meat, fish, seafood, egg, or animal stock.";
    }
    if (dietPreference === "nonveg") {
        return "- Diet Preference: Non-Veg. Include at least one non-vegetarian ingredient naturally if possible.";
    }
    return "- Diet Preference: Any.";
};

const normalizeSessionId = (value = "") => String(value || "").trim().slice(0, 80);

const normalizeRequestIndex = (value) => {
    const n = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
};

app.post('/ai/cook-with-ingredients', async (req, res) => {
    let ingredients = "";
    let dietPreference = "any";
    let sessionId = "";
    let requestIndex = 0;
    try {
        ingredients = String(req.body?.ingredients || "").trim();
        dietPreference = normalizeDietPreference(req.body?.dietPreference);
        sessionId = normalizeSessionId(req.body?.sessionId);
        requestIndex = normalizeRequestIndex(req.body?.requestIndex);
        if (!ingredients) {
            return res.status(400).json({ error: "Please provide ingredients." });
        }

        if (!GEMINI_API_KEY) {
            const fallback = await fetchMealDbFallbackRecipe(
                ingredients,
                dietPreference,
                sessionId,
                requestIndex
            );
            return res.status(200).json({
                ...fallback,
                modelUsed: "fallback-themealdb",
                fallbackReason: "gemini_key_missing",
                dietPreference,
                sessionId,
                requestIndex,
            });
        }

        const prompt = `
You are a recipe assistant. Create one practical recipe using these ingredients as the primary base:
${ingredients}

Return plain text in this exact format:
Recipe Name: <name>
Cooking Time: <time>
Calories Estimate: <estimate>
Steps:
1. <step one>
2. <step two>
3. <step three>
4. <step four>
5. <step five>
YouTube Search Suggestion: <search text only, no URL>

Rules:
- Keep steps concise and actionable (5-8 steps).
- Calories can be an estimate per serving.
- Do not use markdown or code blocks.
- Do not output placeholder text like "step 1" or "step 2".
${buildDietPromptRule(dietPreference)}
- Session Id: ${sessionId || "default"}
- Request Number In Session: ${requestIndex || 1}
- Variation Rule: For identical ingredients in the same session, return a different recipe concept each request.
        `.trim();

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        let result = null;
        let modelUsed = "";
        let lastErr = null;

        for (const modelName of GEMINI_FALLBACK_MODELS) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                modelUsed = modelName;
                break;
            } catch (err) {
                lastErr = err;
                if (err?.status === 404 || String(err?.message || "").includes("not found")) {
                    continue;
                }
                throw err;
            }
        }

        if (!result) {
            throw new Error(
                `No compatible Gemini model found. Tried: ${GEMINI_FALLBACK_MODELS.join(", ")}. Last error: ${lastErr?.message || "unknown"}`
            );
        }

        const formattedText = result?.response?.text?.()?.trim();

        if (!formattedText) {
            return res.status(502).json({ error: "Gemini returned empty response." });
        }

        const parsedRaw = parseSections(formattedText);
        const parsed = await normalizeRecipePayload({ payload: parsedRaw, ingredients, dietPreference });
        const youtubeUrl = parsed.youtubeSearchQuery
            ? `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.youtubeSearchQuery)}`
            : "";

        return res.json({
            ...parsed,
            modelUsed,
            response: formattedText,
            youtubeUrl,
            dietPreference,
            sessionId,
            requestIndex,
        });
    } catch (error) {
        console.error("Gemini cook endpoint error:", error);
        if (error?.status === 429) {
            const retryAfterSeconds = getRetryDelaySeconds(error);
            try {
                const fallback = await fetchMealDbFallbackRecipe(
                    ingredients,
                    dietPreference,
                    sessionId,
                    requestIndex
                );
                return res.status(200).json({
                    ...fallback,
                    modelUsed: "fallback-themealdb",
                    fallbackReason: "gemini_quota_exceeded",
                    retryAfterSeconds,
                    detail: error?.message || "Gemini quota exceeded",
                    dietPreference,
                    sessionId,
                    requestIndex,
                });
            } catch (fallbackError) {
                console.error("Fallback recipe fetch failed:", fallbackError);
                return res.status(429).json({
                    error: "Gemini quota exceeded. Please check billing/limits and retry later.",
                    detail: error?.message || "Too Many Requests",
                    retryAfterSeconds,
                });
            }
        }
        return res.status(500).json({
            error: "Internal server error.",
            detail: error?.message || "Unknown server error",
        });
    }
});

app.post("/run-meal-reminders", async (_req, res) => {
    try {
        await checkAndSendMealPlannerReminders();
        res.json({ success: true });
    } catch (error) {
        console.error("Manual reminder trigger failed:", error);
        res.status(500).json({ success: false, error: "Failed to run reminders" });
    }
});

app.post("/contact", async (req, res) => {
    try {
        if (!EMAIL_USER || !EMAIL_PASS) {
            return res.status(500).json({ error: "Email service not configured." });
        }

        const name = String(req.body?.name || "").trim();
        const email = String(req.body?.email || "").trim();
        const subject = String(req.body?.subject || "").trim();
        const message = String(req.body?.message || "").trim();
        const category = String(req.body?.category || "general").trim();

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const safeSubject = subject ? subject.slice(0, 120) : "No subject";
        const safeCategory = category ? category.slice(0, 60) : "general";

        const htmlEmail = `
            <div style="font-family: Arial, sans-serif; color: #111827;">
                <h2 style="margin: 0 0 12px;">New Contact Message</h2>
                <p style="margin: 0 0 8px;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 0 0 8px;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0 0 8px;"><strong>Category:</strong> ${safeCategory}</p>
                <p style="margin: 0 0 12px;"><strong>Subject:</strong> ${safeSubject}</p>
                <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
                    <pre style="white-space: pre-wrap; margin: 0; font-family: Arial, sans-serif;">${message}</pre>
                </div>
            </div>
        `;

        const textEmail = `
New Contact Message

Name: ${name}
Email: ${email}
Category: ${safeCategory}
Subject: ${safeSubject}

Message:
${message}
        `.trim();

        const transporter = createGmailTransporter();

        await transporter.sendMail({
            from: `"Recipe Finder Contact" <${EMAIL_USER}>`,
            to: CONTACT_RECEIVER,
            replyTo: email,
            subject: `[Contact] ${safeCategory} - ${safeSubject}`,
            text: textEmail,
            html: htmlEmail,
        });

        return res.json({ success: true });
    } catch (error) {
        console.error("Contact form email failed:", error);
        return res.status(500).json({ error: "Failed to send message." });
    }
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

app.post('/generate-2fa-otp', async (req, res) => {
    const { email, uid } = req.body;
    if (!email || !uid) return res.status(400).json({ error: "Missing email or uid" });
    if (!EMAIL_USER || !EMAIL_PASS) {
        return res.status(500).json({ error: "Email service not configured." });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // expires in 5 minutes

    // Store OTP in Firebase
    await updateDoc(doc(db, "users", uid), {
        twoFactorOTP: otp,
        twoFactorOTPExpires: expiresAt
    });

    // Send OTP via Gmail with HTML styling
    const transporter = createGmailTransporter();

    // HTML email template with CSS
    const htmlEmail = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recipe Finder OTP Verification</title>
            <style>
                /* Reset styles */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                /* Main container */
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                /* Content card */
                .email-card {
                    background: white;
                    border-radius: 20px;
                    padding: 40px 30px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 500px;
                    margin: 0 auto;
                }
                
                /* Header */
                .email-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 10px;
                }
                
                .header-title {
                    color: #333;
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                
                .header-subtitle {
                    color: #666;
                    font-size: 16px;
                    line-height: 1.5;
                }
                
                /* OTP Section */
                .otp-section {
                    background: #f8f9fa;
                    border-radius: 15px;
                    padding: 30px 20px;
                    text-align: center;
                    margin: 25px 0;
                    border: 2px dashed #667eea;
                }
                
                .otp-label {
                    color: #555;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 15px;
                }
                
                .otp-code {
                    font-size: 48px;
                    font-weight: bold;
                    letter-spacing: 10px;
                    color: #764ba2;
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    display: inline-block;
                    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.2);
                    font-family: 'Courier New', monospace;
                    margin: 15px 0;
                }
                
                .otp-expiry {
                    color: #ff6b6b;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                }
                
                .otp-expiry svg {
                    width: 16px;
                    height: 16px;
                    fill: #ff6b6b;
                }
                
                /* Warning Section */
                .warning-section {
                    background: #fff3cd;
                    border: 1px solid #ffeeba;
                    border-radius: 10px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .warning-icon {
                    font-size: 20px;
                }
                
                /* Info Section */
                .info-section {
                    background: #e3f2fd;
                    border-radius: 10px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #1565c0;
                    font-size: 14px;
                }
                
                /* Button (if needed for verification links) */
                .verify-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    padding: 15px 40px;
                    border-radius: 30px;
                    font-weight: 600;
                    margin: 20px 0;
                    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                }
                
                /* Footer */
                .email-footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #eee;
                }
                
                .footer-text {
                    color: #999;
                    font-size: 13px;
                    line-height: 1.6;
                    margin-bottom: 10px;
                }
                
                .footer-links {
                    margin: 15px 0;
                }
                
                .footer-links a {
                    color: #667eea;
                    text-decoration: none;
                    margin: 0 10px;
                    font-size: 13px;
                }
                
                .footer-copyright {
                    color: #bbb;
                    font-size: 12px;
                }
                
                /* Social Icons */
                .social-icons {
                    margin: 20px 0;
                }
                
                .social-icon {
                    display: inline-block;
                    width: 32px;
                    height: 32px;
                    background: #f0f0f0;
                    border-radius: 50%;
                    line-height: 32px;
                    text-align: center;
                    margin: 0 5px;
                    color: #667eea;
                    font-size: 16px;
                }
                
                /* Responsive */
                @media (max-width: 480px) {
                    .email-card {
                        padding: 20px 15px;
                    }
                    
                    .otp-code {
                        font-size: 32px;
                        letter-spacing: 5px;
                    }
                    
                    .header-title {
                        font-size: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-card">
                    <!-- Header -->
                    <div class="email-header">
                        <div class="logo">🍳 Recipe Finder</div>
                        <div class="header-title">Two-Factor Authentication</div>
                        <div class="header-subtitle">Secure your account with 2FA</div>
                    </div>
                    
                    <!-- OTP Section -->
                    <div class="otp-section">
                        <div class="otp-label">Your Verification Code</div>
                        <div class="otp-code">${otp}</div>
                        <div class="otp-expiry">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                            </svg>
                            Expires in 5 minutes
                        </div>
                    </div>
                    
                    <!-- Warning Message -->
                    <div class="warning-section">
                        <span class="warning-icon">⚠️</span>
                        <span>If you didn't request this code, please ignore this email or contact support immediately.</span>
                    </div>
                    
                    <!-- Additional Info -->
                    <div class="info-section">
                        <strong>🔒 Security Tips:</strong>
                        <ul style="margin-top: 8px; margin-left: 20px;">
                            <li>Never share this code with anyone</li>
                            <li>Recipe Finder will never ask for your code via phone</li>
                            <li>This code expires in 5 minutes for security</li>
                        </ul>
                    </div>
                    
                    <!-- Alternative verification link (optional) -->
                    <!--
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/verify-2fa?uid=${uid}&code=${otp}" class="verify-button">
                            Verify Account
                        </a>
                    </div>
                    -->
                    
                    <!-- Footer -->
                    <div class="email-footer">
                        <div class="footer-text">
                            This email was sent to ${email}<br>
                            Please do not reply to this email.
                        </div>
                        
                        <div class="footer-links">
                            <a href="#">Help Center</a> •
                            <a href="#">Privacy Policy</a> •
                            <a href="#">Terms of Service</a>
                        </div>
                        
                        <div class="social-icons">
                            <span class="social-icon">f</span>
                            <span class="social-icon">t</span>
                            <span class="social-icon">ig</span>
                        </div>
                        
                        <div class="footer-copyright">
                            © ${new Date().getFullYear()} Recipe Finder. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    // Plain text fallback
    const textEmail = `
        Recipe Finder - Two-Factor Authentication
        
        Hello!
        
        You (or someone using your email) requested to enable 2-Step Verification for your Recipe Finder account.
        
        Your verification code is: ${otp}
        
        This code will expire in 5 minutes.
        
        If you did not request this, please ignore this email.
        
        Security Tips:
        - Never share this code with anyone
        - Recipe Finder will never ask for your code via phone
        - This code expires in 5 minutes for security
        
        Thanks,
        The Recipe Finder Team
        
        This email was sent to ${email}
        Please do not reply to this email.
    `;

    const mailOptions = {
        from: `"Recipe Finder" <${EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your Recipe Finder 2FA Verification Code',
        text: textEmail,
        html: htmlEmail
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
initMealPlannerReminderService();
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
