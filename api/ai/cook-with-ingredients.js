import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_FALLBACK_MODELS = [
  GEMINI_MODEL,
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash",
];

export const config = {
  runtime: "nodejs",
};

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
const fallbackCursorByPrimary = new Map();

const parseInstructionSteps = (instructions = "") => {
  const cleaned = String(instructions || "").replace(/\r/g, "\n").trim();
  if (!cleaned) return [];

  const chunks = cleaned
    .split(/\n+/)
    .map((line) => line.replace(/^\s*\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);

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

const buildGenericFallbackRecipe = (ingredients = "") => {
  const items = splitIngredients(ingredients);
  const main = items[0] || "mixed ingredients";
  const displayName = main.charAt(0).toUpperCase() + main.slice(1);
  const steps = [
    "Prep all ingredients: wash, chop, and keep them ready.",
    `Heat oil in a pan, then saute ${main} with aromatics like onion/garlic if available.`,
    "Add the remaining ingredients in stages and cook on medium heat.",
    "Season with salt, pepper, and your preferred spices.",
    "Cover and cook until tender, stirring occasionally to avoid sticking.",
    "Taste, adjust seasoning, and finish with herbs or lemon juice if available.",
    "Serve hot with rice, bread, or salad.",
  ];

  const youtubeSearchQuery = `${displayName} easy recipe`;
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

const normalizeRecipePayload = async ({ payload, ingredients }) => {
  const items = splitIngredients(ingredients);
  const steps = Array.isArray(payload?.recipeSteps) ? payload.recipeSteps.filter(Boolean) : [];
  const ingredientCount = Math.max(items.length, 4);

  const normalized = {
    ...payload,
    recipeSteps: steps.length ? steps : buildGenericFallbackRecipe(ingredients).recipeSteps,
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
  return normalized;
};

const fetchMealDbFallbackRecipe = async (ingredients = "") => {
  const items = splitIngredients(ingredients);
  if (!items.length) return buildGenericFallbackRecipe(ingredients);

  const primary = items[0];
  const listRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(primary)}`);
  const listData = await listRes.json();
  const candidates = Array.isArray(listData?.meals) ? listData.meals.slice(0, 8) : [];

  if (!candidates.length) {
    return buildGenericFallbackRecipe(ingredients);
  }

  const detailedMeals = await Promise.all(
    candidates.map(async (meal) => {
      const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(meal.idMeal)}`);
      const detailData = await detailRes.json();
      return detailData?.meals?.[0] || null;
    })
  );

  const validMeals = detailedMeals.filter(Boolean);
  const matchedMeals = validMeals.filter((meal) => mealContainsIngredients(meal, items.slice(1)));
  const pool = matchedMeals.length ? matchedMeals : validMeals;
  const selected = chooseNextRecipe(primary, pool);

  if (!selected) {
    return buildGenericFallbackRecipe(ingredients);
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
    recipeSteps: recipeSteps.length ? recipeSteps : buildGenericFallbackRecipe(ingredients).recipeSteps,
    youtubeSearchQuery,
    youtubeUrl,
    imageUrl: selected.strMealThumb || "",
    source: "fallback-themealdb",
  },
    ingredients,
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let ingredients = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    ingredients = String(body.ingredients || "").trim();

    if (!ingredients) {
      return res.status(400).json({ error: "Please provide ingredients." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallback = await fetchMealDbFallbackRecipe(ingredients);
      return res.status(200).json({
        ...fallback,
        modelUsed: "fallback-themealdb",
        fallbackReason: "gemini_key_missing",
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
    `.trim();

    const genAI = new GoogleGenerativeAI(apiKey);

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
    const parsed = await normalizeRecipePayload({ payload: parsedRaw, ingredients });
    const youtubeUrl = parsed.youtubeSearchQuery
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(parsed.youtubeSearchQuery)}`
      : "";

    return res.status(200).json({
      ...parsed,
      modelUsed,
      response: formattedText,
      youtubeUrl,
    });
  } catch (error) {
    console.error("Gemini cook function error:", error);
    if (error?.status === 429) {
      const retryAfterSeconds = getRetryDelaySeconds(error);
      try {
        const fallback = await fetchMealDbFallbackRecipe(ingredients);
        return res.status(200).json({
          ...fallback,
          modelUsed: "fallback-themealdb",
          fallbackReason: "gemini_quota_exceeded",
          retryAfterSeconds,
          detail: error?.message || "Gemini quota exceeded",
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
}
