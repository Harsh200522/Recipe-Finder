// src/components/MealPlanner.jsx
import React, { useEffect, useState, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { db, auth } from "../config/firbase";
import { collection, deleteDoc, doc, getDoc, getDocs, query as firestoreQuery, setDoc, where } from "firebase/firestore";
import Swal from "sweetalert2";
import "../style/mealplanner.css";
import videoSrc from "../video/Cartoon.mp4";
import {
  FaHeart,
  FaRegHeart,
  FaRegThumbsDown,
  FaRegThumbsUp,
  FaThumbsDown,
  FaThumbsUp,
  FaUtensils,
} from "react-icons/fa";
import {
  handleLike as applyLikeReaction,
  handleUnlike as applyUnlikeReaction,
} from "../services/recipeReactions";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const meals = ["Breakfast", "Lunch", "Dinner"];
const defaultReminderTimes = {
  Breakfast: "08:00",
  Lunch: "13:00",
  Dinner: "20:00",
};

/* ---------- Helper: create empty planner ---------- */
const createEmptyPlanner = () => {
  const obj = {};
  days.forEach((d) => {
    obj[d] = {};
    meals.forEach((m) => (obj[d][m] = null));
  });
  return obj;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getIngredientsFromApiMeal = (meal) => {
  const items = [];
  for (let i = 1; i <= 20; i += 1) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      items.push(`${ing}${measure && measure.trim() ? ` (${measure})` : ""}`);
    }
  }
  return items;
};

const normalizeIngredientList = (value) => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (!value) return [];

  return String(value)
    .split(/\r?\n|,|;|•|\\n/)
    .map((item) =>
      item
        .replace(/^\s*[-*]\s+/, "")
        .replace(/^\s*\d+[.)]\s+/, "")
        .trim()
    )
    .filter(Boolean);
};

const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([^&?/]+)/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const fetchPublishedCommunityMeals = async (searchText) => {
  const terms = searchText.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const q = firestoreQuery(
    collection(db, "recipes"),
    where("isUploaded", "==", true)
  );
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((recipe) => {
      const haystack = `${recipe.title || ""} ${recipe.ingredients || ""} ${recipe.category || ""}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, 6)
    .map((recipe) => ({
      idMeal: `community_${recipe.id}`,
      strMeal: recipe.title || "Untitled Recipe",
      strMealThumb: recipe.image || "",
      category: recipe.category || "N/A",
      country: recipe.creatorCountry || "N/A",
      ingredients: normalizeIngredientList(recipe.ingredients),
      steps: recipe.steps || "",
      strYoutube: recipe.video || "",
      chefName: recipe.createdBy || "Unknown Chef",
      source: "community",
    }));
};

const fetchApiMeals = async (searchText) => {
  const res = await fetch(
    `https://www.themealdb.com/api/json/v1/1/search.php?s=${searchText}`
  );
  const data = await res.json();
  return (data.meals || []).slice(0, 6).map((m) => ({
    idMeal: m.idMeal,
    strMeal: m.strMeal,
    strMealThumb: m.strMealThumb,
    category: m.strCategory || "N/A",
    country: m.strArea || "N/A",
    ingredients: getIngredientsFromApiMeal(m),
    steps: m.strInstructions || "",
    strYoutube: m.strYoutube || "",
    chefName: "System",
    source: "api",
  }));
};

export default function MealPlanner() {
  const [planner, setPlanner] = useState(createEmptyPlanner());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  const initialPlannerRef = useRef(null);

  const getCommunityRecipeId = (meal) => {
    if (!meal?.idMeal) return null;
    const id = String(meal.idMeal);
    return id.startsWith("community_") ? id.replace("community_", "") : null;
  };

  const getReactionDocId = (meal) => {
    const communityId = getCommunityRecipeId(meal);
    return communityId ? `chef_${communityId}` : meal?.idMeal;
  };

  const getFavoriteDocIds = (meal) => {
    const communityId = getCommunityRecipeId(meal);
    if (communityId) {
      return [`chef_${communityId}`, `community_${communityId}`, communityId];
    }
    const apiId = meal?.idMeal;
    return apiId ? [apiId] : [];
  };

  const getPreferredFavoriteDocId = (meal) => {
    const communityId = getCommunityRecipeId(meal);
    return communityId ? `chef_${communityId}` : meal?.idMeal;
  };

  const buildFavoritePayload = (meal) => ({
    id: getPreferredFavoriteDocId(meal),
    title: meal?.strMeal || "Untitled Recipe",
    category: meal?.category || "N/A",
    country: meal?.country || "N/A",
    chefName: meal?.chefName || "System",
    isChefRecipe: Boolean(getCommunityRecipeId(meal)),
    image: meal?.strMealThumb || "",
    youtube: meal?.strYoutube || null,
    ingredients: normalizeIngredientList(meal?.ingredients),
    createdAt: new Date(),
  });

  const ensureMealDetails = async (meal) => {
    if (!meal) return meal;

    const isCommunity = String(meal.idMeal || "").startsWith("community_");
    const hasCategory = meal.category && meal.category !== "N/A";
    const hasCountry = meal.country && meal.country !== "N/A";
    const hasIngredients = Array.isArray(meal.ingredients)
      ? meal.ingredients.length > 0
      : Boolean(meal.ingredients && meal.ingredients !== "N/A");

    if (!isCommunity && hasCategory && hasCountry && hasIngredients) {
      return meal;
    }

    if (isCommunity) {
      const recipeId = String(meal.idMeal).replace("community_", "");
      const snap = await getDoc(doc(db, "recipes", recipeId));
      if (!snap.exists()) return meal;
      const data = snap.data();
      return {
        ...meal,
        category: data.category || meal.category || "N/A",
        country: data.creatorCountry || meal.country || "N/A",
        ingredients: normalizeIngredientList(data.ingredients || meal.ingredients),
        chefName: data.createdBy || meal.chefName || "Unknown Chef",
        strMealThumb: data.image || meal.strMealThumb || "",
        strYoutube: data.video || meal.strYoutube || "",
        source: "community",
      };
    }

    if (meal.idMeal) {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
      );
      const data = await res.json();
      const found = data?.meals?.[0];
      if (!found) return meal;
      return {
        ...meal,
        category: found.strCategory || meal.category || "N/A",
        country: found.strArea || meal.country || "N/A",
        ingredients: getIngredientsFromApiMeal(found),
        chefName: meal.chefName || "System",
        strMealThumb: found.strMealThumb || meal.strMealThumb || "",
        strYoutube: found.strYoutube || meal.strYoutube || "",
        source: "api",
      };
    }

    return meal;
  };

  const openMealInfo = async (meal, day, mealType) => {
    if (!meal) return;

    let details = meal;
    try {
      details = await ensureMealDetails(meal);
      if (details !== meal && day && mealType) {
        setPlanner((prev) => ({
          ...prev,
          [day]: {
            ...prev[day],
            [mealType]: details,
          },
        }));
      }
    } catch {
      details = meal;
    }

    const ingredientItems = normalizeIngredientList(details.ingredients);
    const ingredientsHtml = ingredientItems.length
      ? ingredientItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>N/A</li>";

    const infoHtml = `
      <div style="text-align:left;">
        <p><b>Category:</b> ${escapeHtml(details.category || "N/A")}</p>
        <p><b>Chef:</b> ${escapeHtml(details.chefName || "System")}</p>
        <p><b>Country:</b> ${escapeHtml(details.country || "N/A")}</p>
        <p><b>Ingredients:</b></p>
        <ul style="margin:0 0 10px 18px;max-height:140px;overflow:auto;">${ingredientsHtml}</ul>
      </div>
    `;

    const likeOutlineIcon = renderToStaticMarkup(<FaRegThumbsUp style={{ fontSize: "20px" }} />);
    const likeFilledIcon = renderToStaticMarkup(<FaThumbsUp style={{ color: "green", fontSize: "20px" }} />);
    const unlikeOutlineIcon = renderToStaticMarkup(<FaRegThumbsDown style={{ fontSize: "20px" }} />);
    const unlikeFilledIcon = renderToStaticMarkup(<FaThumbsDown style={{ color: "red", fontSize: "20px" }} />);
    const heartOutlineIcon = renderToStaticMarkup(<FaRegHeart style={{ fontSize: "20px" }} />);
    const heartFilledIcon = renderToStaticMarkup(<FaHeart style={{ color: "crimson", fontSize: "20px" }} />);

    Swal.fire({
      title: escapeHtml(details.strMeal || "Meal Details"),
      imageUrl: details.strMealThumb || "",
      imageWidth: 260,
      imageHeight: 180,
      imageAlt: details.strMeal || "Meal",
      html: `
        ${infoHtml}
        <div class="meal-alert-actions">
          <button id="swal-video-btn" type="button" class="watch-video-btn">▶ Watch Video</button>
          <div class="reaction-buttons">
            <button id="swal-like-btn" type="button" class="like-btn">${likeOutlineIcon}<span id="swal-like-count"> 0</span></button>
            <button id="swal-unlike-btn" type="button" class="unlike-btn">${unlikeOutlineIcon}<span id="swal-unlike-count"> 0</span></button>
            <button id="swal-fav-btn" type="button" class="heart-btn">${heartOutlineIcon}</button>
          </div>
        </div>
      `,
      width: 560,
      confirmButtonText: "Close",
      didOpen: async () => {
        const likeBtn = document.getElementById("swal-like-btn");
        const unlikeBtn = document.getElementById("swal-unlike-btn");
        const favBtn = document.getElementById("swal-fav-btn");
        const videoBtn = document.getElementById("swal-video-btn");

        const loadActionState = async () => {
          const reactionId = getReactionDocId(details);
          const defaultState = { likes: 0, unlikes: 0, userReaction: "none", favorite: false };

          if (!reactionId) return defaultState;

          const reactionSnap = await getDoc(doc(db, "recipeReactions", reactionId));
          const reactionData = reactionSnap.exists() ? reactionSnap.data() : {};
          const likes = Number.isFinite(reactionData.likeCount) ? reactionData.likeCount : 0;
          const unlikes = Number.isFinite(reactionData.unlikeCount) ? reactionData.unlikeCount : 0;

          const likedBy = Array.isArray(reactionData.likedBy) ? reactionData.likedBy : [];
          const unlikedBy = Array.isArray(reactionData.unlikedBy) ? reactionData.unlikedBy : [];
          const userReaction = user?.uid
            ? (likedBy.includes(user.uid) ? "like" : unlikedBy.includes(user.uid) ? "unlike" : "none")
            : "none";

          let favorite = false;
          let favoriteDocId = null;
          if (user?.uid) {
            const candidateIds = getFavoriteDocIds(details);
            for (const favId of candidateIds) {
              const favSnap = await getDoc(doc(db, "users", user.uid, "favorites", favId));
              if (favSnap.exists()) {
                favorite = true;
                favoriteDocId = favId;
                break;
              }
            }
          }

          return { likes, unlikes, userReaction, favorite, favoriteDocId };
        };

        const renderActionState = (state) => {
          if (likeBtn) {
            likeBtn.innerHTML = `${state.userReaction === "like" ? likeFilledIcon : likeOutlineIcon}<span id="swal-like-count"> ${state.likes}</span>`;
            likeBtn.classList.toggle("active", state.userReaction === "like");
          }
          if (unlikeBtn) {
            unlikeBtn.innerHTML = `${state.userReaction === "unlike" ? unlikeFilledIcon : unlikeOutlineIcon}<span id="swal-unlike-count"> ${state.unlikes}</span>`;
            unlikeBtn.classList.toggle("active", state.userReaction === "unlike");
          }
          if (favBtn) {
            favBtn.innerHTML = state.favorite ? heartFilledIcon : heartOutlineIcon;
            favBtn.classList.toggle("active", state.favorite);
          }
          if (videoBtn) videoBtn.style.opacity = details.strYoutube ? "1" : "0.5";
          if (videoBtn) videoBtn.style.cursor = details.strYoutube ? "pointer" : "not-allowed";
        };

        const runTapAnimation = (btn) => {
          if (!btn) return;
          btn.classList.remove("tap");
          void btn.offsetWidth;
          btn.classList.add("tap");
          setTimeout(() => btn.classList.remove("tap"), 160);
        };

        const initialState = await loadActionState();
        let state = { ...initialState };
        renderActionState(state);

        likeBtn?.addEventListener("click", async () => {
          if (!user?.uid) {
            Swal.fire("Login Required", "Please login first", "warning");
            return;
          }
          const reactionId = getReactionDocId(details);
          if (!reactionId) return;
          const prevState = { ...state };
          runTapAnimation(likeBtn);

          if (state.userReaction === "like") {
            state = { ...state, userReaction: "none", likes: Math.max(0, state.likes - 1) };
          } else if (state.userReaction === "unlike") {
            state = {
              ...state,
              userReaction: "like",
              unlikes: Math.max(0, state.unlikes - 1),
              likes: state.likes + 1,
            };
          } else {
            state = { ...state, userReaction: "like", likes: state.likes + 1 };
          }
          renderActionState(state);

          try {
            await applyLikeReaction({ recipeId: reactionId, userId: user.uid });
          } catch {
            state = prevState;
            renderActionState(state);
          }
        });

        unlikeBtn?.addEventListener("click", async () => {
          if (!user?.uid) {
            Swal.fire("Login Required", "Please login first", "warning");
            return;
          }
          const reactionId = getReactionDocId(details);
          if (!reactionId) return;
          const prevState = { ...state };
          runTapAnimation(unlikeBtn);

          if (state.userReaction === "unlike") {
            state = { ...state, userReaction: "none", unlikes: Math.max(0, state.unlikes - 1) };
          } else if (state.userReaction === "like") {
            state = {
              ...state,
              userReaction: "unlike",
              likes: Math.max(0, state.likes - 1),
              unlikes: state.unlikes + 1,
            };
          } else {
            state = { ...state, userReaction: "unlike", unlikes: state.unlikes + 1 };
          }
          renderActionState(state);

          try {
            await applyUnlikeReaction({ recipeId: reactionId, userId: user.uid });
          } catch {
            state = prevState;
            renderActionState(state);
          }
        });

        favBtn?.addEventListener("click", async () => {
          if (!user?.uid) {
            Swal.fire("Login Required", "Please login first", "warning");
            return;
          }
          runTapAnimation(favBtn);
          const prevState = { ...state };
          const nextFavorite = !state.favorite;
          const nextFavoriteDocId = nextFavorite
            ? getPreferredFavoriteDocId(details)
            : null;
          state = { ...state, favorite: nextFavorite, favoriteDocId: nextFavoriteDocId };
          renderActionState(state);
          const favId = nextFavorite ? nextFavoriteDocId : (prevState.favoriteDocId || getPreferredFavoriteDocId(details));
          const favRef = doc(db, "users", user.uid, "favorites", favId);

          try {
            if (nextFavorite) {
              await setDoc(favRef, buildFavoritePayload(details));
            } else {
              await deleteDoc(favRef);
            }
          } catch {
            state = prevState;
            renderActionState(state);
          }
        });

        videoBtn?.addEventListener("click", () => {
          if (!details.strYoutube) return;
          const embedUrl = getYoutubeEmbedUrl(details.strYoutube);
          if (!embedUrl) {
            Swal.fire("Invalid Video", "Unable to load this video.", "warning");
            return;
          }

          Swal.fire({
            title: escapeHtml(details.strMeal || "Recipe Video"),
            html: `
              <div class="meal-alert-video-wrapper">
                <iframe
                  src="${embedUrl}"
                  title="Recipe Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              </div>
            `,
            width: 780,
            confirmButtonText: "Close",
          });
        });
      },
    });
  };

  /* =========================================================
     🚀 BLOCK REACT ROUTER NAVIGATION (REAL BLOCKER)
     ========================================================= */
  useEffect(() => {
    const handleRouteBlock = (e) => {
      if (!hasUnsavedChanges) return;

      const link = e.target.closest("a");

      // only block internal router links
      if (link && link.getAttribute("href")) {
        e.preventDefault();
        e.stopPropagation();

        Swal.fire({
          icon: "warning",
          title: "Unsaved Changes ⚠️",
          text: "Please save your planner before leaving.",
          confirmButtonText: "OK",
        });
      }
    };

    // IMPORTANT: capture phase = true (blocks BEFORE router)
    document.addEventListener("click", handleRouteBlock, true);

    return () => {
      document.removeEventListener("click", handleRouteBlock, true);
    };
  }, [hasUnsavedChanges]);

  /* =========================================================
     🚀 BLOCK REFRESH / CLOSE TAB
     ========================================================= */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!hasUnsavedChanges) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  /* ---------- Listen auth safely ---------- */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  /* ---------- Fetch planner ---------- */
  useEffect(() => {
    const fetchPlanner = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "MealPlanner", user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const fetchedPlanner = snap.data().planner;
          setPlanner(fetchedPlanner);
          initialPlannerRef.current = JSON.parse(JSON.stringify(fetchedPlanner));
        } else {
          const emptyPlanner = createEmptyPlanner();
          setPlanner(emptyPlanner);
          initialPlannerRef.current = JSON.parse(JSON.stringify(emptyPlanner));
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load planner", "error");
      }

      setLoading(false);
    };

    fetchPlanner();
  }, [user]);

  /* ---------- Check for unsaved changes ---------- */
  useEffect(() => {
    if (!initialPlannerRef.current) return;

    const currentPlannerStr = JSON.stringify(planner);
    const initialPlannerStr = JSON.stringify(initialPlannerRef.current);

    setHasUnsavedChanges(currentPlannerStr !== initialPlannerStr);
  }, [planner]);

  /* ---------- Save planner ---------- */
  const savePlanner = async () => {
    if (!user) {
      Swal.fire("Login Required", "Please login first", "warning");
      return;
    }

    setIsSaving(true);

    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const plannerRef = doc(db, "MealPlanner", user.uid);
      const existingSnap = await getDoc(plannerRef);
      const existingData = existingSnap.exists() ? existingSnap.data() : {};

      await setDoc(plannerRef, {
        planner,
        uid: user.uid,
        ownerEmail: existingData.ownerEmail || user.email || "",
        ownerName:
          existingData.ownerName ||
          user.displayName ||
          user.email?.split("@")[0] ||
          "User",
        reminderEnabled:
          typeof existingData.reminderEnabled === "boolean"
            ? existingData.reminderEnabled
            : true,
        reminderTimes:
          existingData.reminderTimes && typeof existingData.reminderTimes === "object"
            ? existingData.reminderTimes
            : defaultReminderTimes,
        timeZone: existingData.timeZone || userTimeZone,
        updatedAt: new Date(),
      });

      initialPlannerRef.current = JSON.parse(JSON.stringify(planner));
      setHasUnsavedChanges(false);
      setLastSavedTime(new Date());

      Swal.fire({
        title: "Saved Successfully! ✅",
        text: "Your meal plan has been saved.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire("Error", "Failed to save planner", "error");
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- Add / Change meal ---------- */
 const assignMeal = async (day, meal) => {
  let selectedMeal = null;

  await Swal.fire({
    title: `🍴 ${day} - ${meal}`,
    html: `
      <input id="mealInput" class="swal2-input" placeholder="Search meal...">
      <div id="suggestions" style="
        max-height:200px;
        overflow-y:auto;
        text-align:left;
        margin-top:10px;
      "></div>
    `,
    showCancelButton: true,
    confirmButtonText: "Add",
    didOpen: () => {
      const input = document.getElementById("mealInput");
      const suggestionsDiv = document.getElementById("suggestions");

      let debounceTimer;

      input.addEventListener("input", () => {
        const query = input.value.trim();

        clearTimeout(debounceTimer);

        // small debounce (better UX)
        debounceTimer = setTimeout(async () => {
          if (!query) {
            suggestionsDiv.innerHTML = "";
            return;
          }

          try {
            const [communityMeals, apiMeals] = await Promise.all([
              fetchPublishedCommunityMeals(query).catch(() => []),
              fetchApiMeals(query).catch(() => []),
            ]);

            const seenNames = new Set();
            const mergedMeals = [...communityMeals, ...apiMeals].filter((m) => {
              const key = (m.strMeal || "").toLowerCase();
              if (!key || seenNames.has(key)) return false;
              seenNames.add(key);
              return true;
            });

            if (!mergedMeals.length) {
              suggestionsDiv.innerHTML = "<p>No results</p>";
              return;
            }

            suggestionsDiv.innerHTML = "";

            mergedMeals.forEach((m) => {
              const item = document.createElement("div");
              const thumb = m.strMealThumb
                ? `<img src="${m.strMealThumb}" width="40" height="40" style="border-radius:6px"/>`
                : `<div style="width:40px;height:40px;border-radius:6px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:11px;color:#666;">N/A</div>`;
              const sourceBadge = m.source === "community"
                ? `<span style="margin-left:6px;padding:2px 6px;border-radius:10px;background:#16a34a;color:#fff;font-size:10px;">Chef: ${m.chefName || "Unknown Chef"}</span>`
                : "";

              item.style.cssText = `
                display:flex;
                align-items:center;
                gap:10px;
                padding:6px;
                cursor:pointer;
                border-radius:6px;
              `;

              item.innerHTML = `
                ${thumb}
                <span>${m.strMeal}${sourceBadge}</span>
              `;

              item.onclick = () => {
                selectedMeal = { ...m };

                input.value = m.strMeal;
                suggestionsDiv.innerHTML = "";
              };

              suggestionsDiv.appendChild(item);
            });
          } catch {
            suggestionsDiv.innerHTML = "Error loading results";
          }
        }, 300);
      });
    },
    preConfirm: () => {
      if (!selectedMeal) {
        Swal.showValidationMessage("Please select a meal from suggestions");
      }
      return selectedMeal;
    },
  }).then((result) => {
    if (!result.isConfirmed) return;

    const m = result.value;

    setPlanner((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: m,
      },
    }));

    Swal.fire("Added ✅", `${m.strMeal} added successfully`, "success");
  });
};

  /* ---------- Remove meal ---------- */
  const removeMeal = (day, meal) => {
    Swal.fire({
      title: "Remove meal?",
      icon: "warning",
      showCancelButton: true,
    }).then((res) => {
      if (!res.isConfirmed) return;

      setPlanner((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [meal]: null,
        },
      }));
    });
  };

  /* ---------- Reset all changes ---------- */
  const resetChanges = () => {
    Swal.fire({
      title: "Reset all changes?",
      text: "This will revert all unsaved changes.",
      icon: "warning",
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setPlanner(JSON.parse(JSON.stringify(initialPlannerRef.current)));
        setHasUnsavedChanges(false);
        Swal.fire("Reset!", "All changes have been reverted.", "success");
      }
    });
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return <div className="loading">Loading planner...</div>;
  }

  return (
    <div className="meal-planner">
      <div className="video-banner">
        <video autoPlay loop muted playsInline className="top-video">
          <source src={videoSrc} type="video/mp4" />
        </video>

        <div className="video-overlay">
          <h1 className="planner-title">
            <FaUtensils className="planner-icon" />
              Weekly Meal Planner
          </h1>
        </div>
      </div>

      <div className="meal-content">

        <div className="save-status-bar">
          <div className="save-status-left">
            {hasUnsavedChanges && (
              <div className="unsaved-changes">
                <span className="unsaved-dot">●</span>
                Unsaved Changes
              </div>
            )}

            {lastSavedTime && !hasUnsavedChanges && (
              <div className="last-saved">
                Last saved:{" "}
                {lastSavedTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>

          <div className="save-actions">
            {hasUnsavedChanges && (
              <button onClick={resetChanges} className="reset-btn">
                Reset
              </button>
            )}

            <button
              onClick={savePlanner}
              className="save-btn"
              disabled={!hasUnsavedChanges || isSaving}
            >
              {isSaving ? "Saving..." : "Save Planner"}
            </button>
          </div>
        </div>

        <div className="meal-grid">
          {days.map((day) => (
            <div key={day} className="day-card">
              <h3>{day}</h3>

              {meals.map((meal) => (
                <div key={meal} className="meal-row">
                  <span className="meal-label">{meal}</span>

                  {planner[day]?.[meal] ? (
                    <div className="meal-details">
                      <img
                        src={planner[day][meal].strMealThumb}
                        alt={planner[day][meal].strMeal}
                        onClick={() => openMealInfo(planner[day][meal], day, meal)}
                        style={{ cursor: "pointer" }}
                        title="Click to view details"
                      />
                      <span className="meal-name">
                        {planner[day][meal].strMeal}
                      </span>
                      <button
                        className="remove-btn"
                        onClick={() => removeMeal(day, meal)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="not-set">Not set</span>
                  )}

                  <button
                    className="add-btn"
                    onClick={() => assignMeal(day, meal)}
                  >
                    {planner[day]?.[meal] ? "Change" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
