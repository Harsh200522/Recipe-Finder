// src/components/RecipeFinder.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import "../style/home.css";
import { FaComment } from "react-icons/fa";
import NoodleAnimation from "./NoodleAnimation";
import GoogleAd from "./GoogleAd";
import ServingCalculator from "./ServingCalculator";
import { FaMicrophone, FaStop } from "react-icons/fa";
import {
  FaThumbsUp,
  FaRegThumbsUp,
  FaThumbsDown,
  FaRegThumbsDown,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaLeaf,
  FaClock,
  FaGlobeAmericas,
  FaFire,
  FaBrain,
  FaChevronDown,
} from "react-icons/fa";

// ✅ Firebase
import { db, auth } from "../config/firbase";
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  getDoc,
  onSnapshot,
  query as firestoreQuery,
  where,
} from "firebase/firestore";
import { updateDoc, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  handleLike as applyLikeReaction,
  handleUnlike as applyUnlikeReaction,
  subscribeRecipeReactions,
} from "../services/recipeReactions";
import { openAmazonIndiaIngredientsSearch } from "../utils/amazonAffiliate";


export default function RecipeFinder() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servingRecipe, setServingRecipe] = useState(null);
  const [shoppingRecipe, setShoppingRecipe] = useState(null);
  const [videoRecipe, setVideoRecipe] = useState(null);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCommentMeal, setActiveCommentMeal] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [pantryInput, setPantryInput] = useState("");
  const [aiCookOpen, setAiCookOpen] = useState(false);
  const [aiCookMessages, setAiCookMessages] = useState([]);
  const [aiCookLoading, setAiCookLoading] = useState(false);
  const [aiCookError, setAiCookError] = useState("");
  const [aiCookDiet, setAiCookDiet] = useState("any");
  const [aiCookTimeFilter, setAiCookTimeFilter] = useState("any");
  const [aiCookCuisine, setAiCookCuisine] = useState("any");
  const [aiCookDifficulty, setAiCookDifficulty] = useState("any");
  const [aiCookMood, setAiCookMood] = useState("none");
  const [aiCookShowNutrition, setAiCookShowNutrition] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [userAvatars, setUserAvatars] = useState({});
  // Add this state near your other useState hooks
  const [visibleReplies, setVisibleReplies] = useState({}); // Stores { commentIndex: true/false }
  // Renamed to avoid conflicts
  const activateReplyMode = (username, index) => {
    // 1. Show the replies list for this comment
    setVisibleReplies(prev => ({
      ...prev,
      [index]: true
    }));

    // 2. Add the @tag to the input field
    setCommentInputs(prev => ({
      ...prev,
      [activeCommentMeal.idMeal]: `@${username} `
    }));
  };
  // Toggle replies without triggering the input
  const toggleReplies = (index) => {
    setVisibleReplies(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  useEffect(() => {
    const fetchAvatars = async () => {
      // Get unique IDs of people who commented
      const uniqueUserIds = [...new Set(activeCommentMeal?.comments?.map(c => c.userId))];
      const newAvatars = { ...userAvatars };

      for (const uid of uniqueUserIds) {
        if (uid && !newAvatars[uid]) {
          try {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
              const userData = snap.data();
              // ✅ IMPORTANT: Match the structure used in ProfileSettings (profile.avatar)
              if (userData.profile?.avatar) {
                newAvatars[uid] = userData.profile.avatar;
              }
            }
          } catch (err) {
            console.error("Error fetching user avatar:", err);
          }
        }
      }
      setUserAvatars(newAvatars);
    };

    if (activeCommentMeal) fetchAvatars();
  }, [activeCommentMeal]);

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setPantryInput(transcript); // ✅ fills your existing input
    };

    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };
  const aiCookFeedRef = useRef(null);
  const aiCookEndpoint =
    import.meta.env.VITE_AI_COOK_ENDPOINT ||
    (import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL}/ai/cook-with-ingredients`
      : "/api/ai/cook-with-ingredients");
  const getCurrentUserCommentName = (user) =>
    user?.displayName || user?.email?.split("@")[0] || "User";
  const canManageComment = (comment) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    if (comment?.userId) return comment.userId === currentUser.uid;

    const currentDisplayName = currentUser.displayName || "";
    const currentEmailName = currentUser.email?.split("@")[0] || "";
    return comment?.user === currentDisplayName || comment?.user === currentEmailName;
  };
  const getChefRecipeDocId = (meal) => {
    const id = meal?.idMeal || meal?.id;
    if (typeof id === "string" && id.startsWith("chef_")) {
      return id.replace("chef_", "");
    }
    return null;
  };

  const updateRecipeCommentsInState = (recipeCardId, comments) => {
    setRecipes((prev) =>
      prev.map((item) => {
        const itemId = item.idMeal || item.idDrink;
        if (itemId !== recipeCardId) return item;
        return { ...item, comments };
      })
    );
  };

  const handleAddComment = async (meal) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login first");
      return;
    }

    const commentText = commentInputs[meal.idMeal]?.trim();
    if (!commentText) return;

    try {
      const recipeDocId = getChefRecipeDocId(meal);
      if (!recipeDocId) return;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      const userAvatar = userSnap.exists() ? userSnap.data().profile?.avatar : "";

      const newEntry = {
        userId: user.uid,
        user: getCurrentUserCommentName(user),
        userAvatar: userAvatar || "",
        text: commentText,
        createdAt: new Date(),
        likedBy: [],
        likesCount: 0
      };

      let updatedComments = [...(meal.comments || [])];

      // CHECK: Is this a reply? (Starts with @username)
      if (commentText.startsWith("@")) {
        const firstSpaceIndex = commentText.indexOf(" ");
        const replyToUser = commentText.substring(1, firstSpaceIndex);

        // Find the original comment index that we are replying to
        const parentIndex = updatedComments.findIndex(c => c.user === replyToUser);

        if (parentIndex !== -1) {
          if (!updatedComments[parentIndex].replies) {
            updatedComments[parentIndex].replies = [];
          }
          updatedComments[parentIndex].replies.push(newEntry);
        } else {
          // If user not found, just save as a normal comment
          updatedComments.push(newEntry);
        }
      } else {
        // Normal top-level comment
        updatedComments.push(newEntry);
      }

      await updateDoc(doc(db, "recipes", recipeDocId), {
        comments: updatedComments,
      });

      setCommentInputs((prev) => ({ ...prev, [meal.idMeal]: "" }));
      updateRecipeCommentsInState(meal.idMeal, updatedComments);

      Toast.fire({ icon: "success", title: "Comment posted!" });
    } catch (err) {
      console.error("Comment error:", err);
    }
  };
  const handleEditComment = async (meal, commentIndex) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login first");
      return;
    }

    const comments = meal.comments || [];
    const targetComment = comments[commentIndex];
    if (!targetComment) return;
    if (!canManageComment(targetComment)) {
      Swal.fire("Unauthorized", "You can only edit your own comment.", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Edit Comment",
      input: "text",
      inputValue: targetComment.text || "",
      showCancelButton: true,
      confirmButtonText: "Update",
      didOpen: () => {
        Swal.getContainer().style.zIndex = "3000";
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Comment cannot be empty";
        return null;
      },
    });

    if (!result.isConfirmed) return;

    const updatedComments = comments.map((comment, idx) =>
      idx === commentIndex ? { ...comment, text: result.value.trim() } : comment
    );

    try {
      const recipeDocId = getChefRecipeDocId(meal);
      if (!recipeDocId) return;

      await updateDoc(doc(db, "recipes", recipeDocId), {
        comments: updatedComments,
      });

      updateRecipeCommentsInState(meal.idMeal, updatedComments);
      Swal.fire({ icon: "success", title: "Updated", timer: 1000, showConfirmButton: false });
    } catch (err) {
      console.error("Edit comment error:", err);
      Swal.fire("Error", "Failed to update comment", "error");
    }
  };

  const handleDeleteComment = async (meal, commentIndex) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login first");
      return;
    }

    const comments = meal.comments || [];
    const targetComment = comments[commentIndex];
    if (!targetComment) return;
    if (!canManageComment(targetComment)) {
      Swal.fire("Unauthorized", "You can only delete your own comment.", "warning");
      return;
    }

    const confirmDelete = await Swal.fire({
      title: "Delete comment?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });

    if (!confirmDelete.isConfirmed) return;

    const updatedComments = comments.filter((_, idx) => idx !== commentIndex);

    try {
      const recipeDocId = getChefRecipeDocId(meal);
      if (!recipeDocId) return;

      await updateDoc(doc(db, "recipes", recipeDocId), {
        comments: updatedComments,
      });

      updateRecipeCommentsInState(meal.idMeal, updatedComments);
      Swal.fire({ icon: "success", title: "Deleted", timer: 1000, showConfirmButton: false });
    } catch (err) {
      console.error("Delete comment error:", err);
      Swal.fire("Error", "Failed to delete comment", "error");
    }
  };
  const [userPreferences, setUserPreferences] = useState({
    vegetarianOnly: false,
    allergies: [],
  });
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const prefRef = doc(db, "users", user.uid);
      const snap = await getDoc(prefRef);

      if (snap.exists()) {
        const data = snap.data();
        setUserPreferences({
          vegetarianOnly: data.vegetarianOnly || false,
          allergies: data.allergies || [],
        });
      }
    });

    return () => unsub();
  }, []);
  const applySmartFilters = (mealList) => {
    return mealList.filter((meal) => {

      // 🥗 Vegetarian Lock
      if (userPreferences.vegetarianOnly && !isVeg(meal)) {
        return false;
      }

      // 🚫 Allergy Block
      if (userPreferences.allergies.length > 0) {
        for (let i = 1; i <= 20; i++) {
          const ing = meal[`strIngredient${i}`];
          if (
            ing &&
            userPreferences.allergies.some((allergy) =>
              ing.toLowerCase().includes(allergy.toLowerCase())
            )
          ) {
            return false;
          }
        }
      }

      return true;
    });
  };
  // Local state for likes/unlikes/favorites
  const [recipeStates, setRecipeStates] = useState({});
  const [favoritesFromDB, setFavoritesFromDB] = useState([]);
  const hasLoadedCategoriesRef = useRef(false);
  useEffect(() => {
    const loadCategories = async () => {
      if (hasLoadedCategoriesRef.current) return;
      hasLoadedCategoriesRef.current = true;
      setLoading(true); // start loader

      const catList = {
        Veg: "Vegetarian",
        NonVeg: "Chicken",
        Dessert: "Dessert",
        Seafood: "Seafood",
      };

      const result = {};
      const CACHE_KEY = "recipe_categories_cache_v2"; // Version updated for 10 items per category
      const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

      // ✅ Check localStorage cache first
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            console.log("🚀 Loading from cache - instant!");
            setCategories(parsed.data);
            setTimeout(() => setLoading(false), 300);
            return;
          }
        } catch (e) {
          console.warn("Cache parse error, fetching fresh data");
        }
      }

      // Prevent uncaught errors and avoid bursts that trigger 429.
      const safeFetchJson = async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      try {
        // ⚡ OPTIMIZATION: Fetch all category lists in parallel (not sequential)
        const categoryPromises = Object.entries(catList).map(async ([key, category]) => {
          const data = await safeFetchJson(
            `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
          );

          if (data?.meals?.length) {
            // ⚡ UPDATED: 10 meals per category for better variety
            // ⚡ Fetch all details in parallel (not sequential)
            const mealPromises = data.meals.slice(0, 10).map((meal) =>
              safeFetchJson(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
            );

            const detailResponses = await Promise.all(mealPromises);
            const detailedMeals = detailResponses
              .filter((detail) => detail?.meals?.[0])
              .map((detail) => detail.meals[0]);

            return [key, detailedMeals];
          }
          return [key, []];
        });

        // ⚡ Wait for all categories to load in parallel
        const results = await Promise.all(categoryPromises);
        results.forEach(([key, meals]) => {
          result[key] = meals;
        });

        setCategories(result);

        // ✅ Cache the result for next visit
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: result, timestamp: Date.now() })
        );
        console.log("✅ Recipes cached for 2 hours");
      } catch (err) {
        console.error("Error loading categories:", err);
        setCategories({ Veg: [], NonVeg: [], Dessert: [], Seafood: [] });
      } finally {
        // small delay so animation looks smooth (optional)
        setTimeout(() => setLoading(false), 600);
      }
    };

    loadCategories();
  }, []);



  // 🔹 Fetch favorites from Firestore on initial load
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (!auth.currentUser) return;
        const snapshot = await getDocs(collection(db, "users", auth.currentUser.uid, "favorites"));
        const favs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setFavoritesFromDB(favs);

        setRecipeStates((prev) => {
          const favState = {};
          favs.forEach((fav) => {
            favState[fav.id] = {
              likes: prev[fav.id]?.likes || 0,
              unlikes: prev[fav.id]?.unlikes || 0,
              favorite: true,
              userReaction: prev[fav.id]?.userReaction || "none",
            };
          });
          return { ...prev, ...favState };
        });
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };
    fetchFavorites();
  }, []);

  // 🔹 Sync favorite status when recipes are loaded
  useEffect(() => {
    if (!recipes || recipes.length === 0) return;

    setRecipeStates((prev) => {
      const updated = { ...prev };
      recipes.forEach((meal) => {
        const id = meal.idMeal || meal.idDrink;
        const isFav = favoritesFromDB.some((fav) => fav.id === id);
        const existing = updated[id] || {};
        updated[id] = {
          likes: existing.likes || 0,
          unlikes: existing.unlikes || 0,
          favorite: isFav,
          userReaction: existing.userReaction || "none",
        };
      });
      return updated;
    });
  }, [favoritesFromDB, recipes]);

  // Real-time favorites source of truth.
  useEffect(() => {
    let unsubFav = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFavoritesFromDB([]);
        return;
      }

      const favRef = collection(db, "users", user.uid, "favorites");
      unsubFav = onSnapshot(favRef, (snapshot) => {
        const favs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFavoritesFromDB(favs);

        const favoriteIds = new Set(favs.map((fav) => fav.id));
        setRecipeStates((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((id) => {
            next[id] = {
              ...next[id],
              favorite: favoriteIds.has(id),
            };
          });
          return next;
        });
      });
    });

    return () => {
      if (unsubFav) unsubFav();
      unsubAuth();
    };
  }, []);


  // Drink keywords checker
  const isDrinkQuery = (q) => {
    const drinks = ["coffee", "tea", "cocktail", "mojito", "smoothie"];
    return drinks.some((drink) => q.toLowerCase().includes(drink));
  };

  // Veg / Non-Veg checker
  const isVeg = (meal) => {
    const nonVegKeywords = [
      // 🥩 Meats
      "chicken",
      "mutton",
      "pork",
      "beef",
      "lamb",
      "duck",
      "turkey",
      "goat meat",

      // 🐟 Seafood
      "shrimp",
      "prawn",
      "crab",
      "lobster",
      "oyster",
      "mussel",
      "clam",
      "squid",
      "octopus",
      "anchovy",
      "sardine",
      "tuna",
      "salmon",
      "cod",
      "fish sauce",
      "fish stock",
      "fish broth",

      // 🥓 Processed meats
      "bacon",
      "ham",
      "sausage",
      "pepperoni",
      "salami",

      // 🐄 Animal-derived (non-veg only)
      "gelatin",
      "lard",
      "tallow",
      "bone marrow",
      "caviar",
      "roe",

      // 🥣 Specific non-veg stocks (important!)
      "chicken stock",
      "chicken stock cube",
      "chicken broth",
      "chicken stock",
      "beef stock",
      "lamb stock",
      "mutton stock",
      "pork stock",
      "chicken broth",
      "beef broth",
      "lamb broth",
      "mutton broth",
      "pork broth"
    ];


    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      if (ing && nonVegKeywords.some((nv) => ing.toLowerCase().includes(nv))) {
        return false;
      }
    }
    return true;
  };

  // Helper: Checks if a meal contains all specified ingredients
  const mealContainsAllIngredients = (meal, ingredients) => {
    const mealIngredients = new Set();
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      if (ing && ing.trim()) {
        mealIngredients.add(ing.toLowerCase());
      }
    }
    return ingredients.every(searchIng => {
      const lowerSearchIng = searchIng.toLowerCase();
      for (const mealIng of mealIngredients) {
        if (mealIng.includes(lowerSearchIng)) return true;
      }
      return false;
    });
  };

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const getYoutubeThumbnail = (url) => {
    const videoId = getYoutubeVideoId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : "";
  };

  const mapChefRecipeToHomeCard = (recipe) => {
    // ✅ Step 1: Split raw ingredient string into individual lines
    // Supports: newline-separated OR comma-separated entries
    const rawIngredients = (recipe.ingredients || "")
      .split(/\r?\n/)
      .flatMap((line) => line.split(/,(?![^(]*\))/))
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);

    // ✅ Step 2: Parse each ingredient line into { name, quantity }
    // Handles formats like:
    //   "200g chicken"   → name: "chicken",    quantity: "200g"
    //   "2 tbsp butter"  → name: "butter",     quantity: "2 tbsp"
    //   "1/2 cup cream"  → name: "cream",      quantity: "1/2 cup"
    //   "chicken - 200g" → name: "chicken",    quantity: "200g"
    //   "salt"           → name: "salt",       quantity: ""
    const parseIngredientLine = (raw = "") => {
      const str = raw.trim();

      // Pattern 1: quantity unit first — "200g chicken" / "2 tbsp butter" / "1/2 cup cream"
      const frontQtyMatch = str.match(
        /^([\d/\.\s]+(?:g|kg|ml|l|ltr|oz|lb|cups?|tbsp|tsp|pieces?|slices?|pinch|bunch|cloves?|medium|large|small|handful)s?)\s+(.+)$/i
      );
      if (frontQtyMatch) {
        return { quantity: frontQtyMatch[1].trim(), name: frontQtyMatch[2].trim() };
      }

      // Pattern 2: ingredient first, quantity after dash — "chicken - 200g" / "paneer - 250g"
      const backQtyMatch = str.match(/^(.+?)\s*[-–]\s*([\d/\.]+\s*\w+)$/);
      if (backQtyMatch) {
        return { name: backQtyMatch[1].trim(), quantity: backQtyMatch[2].trim() };
      }

      // Pattern 3: plain number prefix — "2 eggs" / "3 potatoes"
      const numPrefixMatch = str.match(/^([\d/\.]+)\s+(.+)$/);
      if (numPrefixMatch) {
        return { quantity: numPrefixMatch[1].trim(), name: numPrefixMatch[2].trim() };
      }

      // Fallback: no quantity, just name — "salt" / "salt to taste"
      return { quantity: "", name: str };
    };

    const mapped = {
      idMeal: `chef_${recipe.id}`,
      strMeal: recipe.title || "Chef Recipe",
      strCategory: recipe.category || "Community",
      strArea: recipe.creatorCountry || "N/A",
      strInstructions: recipe.steps || "",
      comments: recipe.comments || [],
      strMealThumb:
        recipe.image ||
        getYoutubeThumbnail(recipe.video) ||
        "https://via.placeholder.com/600x400?text=Chef+Recipe",
      strYoutube: recipe.video || null,
      userId: recipe.userId,
      chefName: recipe.createdBy || "Unknown Chef",
      isChefRecipe: true,
      servings: recipe.servings || recipe.serving || null,
      likes: recipe.likes || 0,
      unlikes: recipe.unlikes || 0,
      likedBy: recipe.likedBy || [],
      unlikedBy: recipe.unlikedBy || [],
    };

    // ✅ Step 3: Store name in strIngredient, quantity in strMeasure
    // This matches MealDB format exactly — ServingCalculator & isVeg() both work correctly
    rawIngredients.forEach((ing, index) => {
      const { name, quantity } = parseIngredientLine(ing);
      mapped[`strIngredient${index + 1}`] = name;   // ✅ clean name only → isVeg() works
      mapped[`strMeasure${index + 1}`] = quantity;  // ✅ quantity only → ServingCalculator scales it
    });

    return mapped;
  };
  const fetchChefRecommendationsForSearch = async (searchTerms) => {
    if (!searchTerms.length) return [];

    const q = firestoreQuery(
      collection(db, "recipes"),
      where("isUploaded", "==", true)
    );
    const snap = await getDocs(q);

    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((recipe) => {
        const haystack = `${recipe.title || ""} ${recipe.ingredients || ""} ${recipe.category || ""}`.toLowerCase();
        return searchTerms.every((term) => haystack.includes(term.toLowerCase()));
      })
      .map(mapChefRecipeToHomeCard);
  };

  // 🔹 Main search function
  const searchRecipe = async () => {
    if (!query.trim()) {
      Swal.fire({ icon: 'warning', title: 'Empty Search', text: 'Please enter a recipe or ingredient to search.' });
      return;
    }

    setRecipes([]);
    setSelectedRecipe(null);
    setVideoRecipe(null);

    Swal.fire({
      title: "Loading...",
      text: "Fetching recipes ⏳",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // ✨ UPDATE: Normalize query to handle both spaces and commas as separators
    const searchTerms = query.replace(/,/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
    const isSearchingDrinks = isDrinkQuery(query);

    try {
      let results = null;

      if (isSearchingDrinks) {
        const res = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${query}`);
        results = (await res.json()).drinks;
      } else if (searchTerms.length > 1) {
        // MULTI-INGREDIENT LOGIC (for queries with more than one word)
        const primaryIngredient = searchTerms.shift(); // Use the first word for the main search
        const remainingIngredients = searchTerms;

        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${primaryIngredient}`);
        const data = await res.json();

        if (data.meals) {
          const detailedMeals = await Promise.all(
            data.meals.map(async (meal) => {
              const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
              return (await detailRes.json()).meals[0];
            })
          );
          results = detailedMeals.filter(meal => meal && mealContainsAllIngredients(meal, remainingIngredients));
        }
      } else {
        // SINGLE-TERM LOGIC (original smart search)
        const searchTerm = searchTerms[0];
        let ingredientRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${searchTerm}`);
        let ingredientData = await ingredientRes.json();

        if (ingredientData.meals) {
          results = await Promise.all(
            ingredientData.meals.map(async (meal) => {
              const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
              return (await detailRes.json()).meals[0];
            })
          );
        } else {
          const nameRes = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${searchTerm}`);
          results = (await nameRes.json()).meals;
        }
      }

      const chefResults = isSearchingDrinks
        ? []
        : await fetchChefRecommendationsForSearch(searchTerms);
      const combinedResults = [...chefResults, ...(results || [])];

      if (combinedResults.length === 0) {
        Swal.fire({ icon: "error", title: "No Recipes Found", text: "Try a different search! 🍽️" });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Recipes Loaded 🎉",
        text: `We found ${combinedResults.length} recipes for you!`,
        timer: 1500,
        showConfirmButton: false
      });

      const initialStates = {};
      combinedResults.forEach((meal) => {
        const id = meal.idMeal || meal.idDrink;
        const chefReaction = meal.isChefRecipe
          ? (meal.likedBy?.includes(auth.currentUser?.uid)
            ? "like"
            : meal.unlikedBy?.includes(auth.currentUser?.uid)
              ? "unlike"
              : "none")
          : null;
        initialStates[id] = {
          likes: recipeStates[id]?.likes ?? (meal.isChefRecipe ? meal.likes || 0 : 0),
          unlikes: recipeStates[id]?.unlikes ?? (meal.isChefRecipe ? meal.unlikes || 0 : 0),
          favorite: favoritesFromDB.some((fav) => fav.id === id),
          userReaction: meal.isChefRecipe ? chefReaction : (recipeStates[id]?.userReaction || "none"),
        };
      });

      setRecipeStates((prev) => ({ ...prev, ...initialStates }));
      const filteredResults = applySmartFilters(combinedResults);
      setRecipes(filteredResults);

    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Oops...", text: "⚠️ Error fetching recipes. Please try again later." });
    }
  };

  const openIngredients = (meal) => setSelectedRecipe(meal);
  const closeIngredients = () => setSelectedRecipe(null);
  const getIngredientNames = (meal) => {
    const names = [];
    for (let i = 1; i <= 20; i++) {
      const ing = (meal?.[`strIngredient${i}`] || "").trim();
      if (ing) names.push(ing);
    }
    return names;
  };

  // ✅ NEW: Serving calculator handlers
  const openServingCalc = (meal) => setServingRecipe(meal);
  const closeServingCalc = () => setServingRecipe(null);

  const handleAiCookWithIngredients = async () => {
    const ingredients = pantryInput.trim();
    if (!ingredients) {
      setAiCookError("Please enter ingredients first.");
      return;
    }
    const timeFilterLabelMap = {
      under15: "Under 15 mins",
      under30: "Under 30 mins",
      under60: "Under 1 hour",
    };
    const moodLabelMap = {
      lazy: "Lazy",
      gym: "Gym",
      romantic: "Romantic",
      party: "Party",
    };

    const stylePreferences = [];
    if (aiCookTimeFilter !== "any") {
      stylePreferences.push(`Cooking time target: ${timeFilterLabelMap[aiCookTimeFilter]}.`);
    }
    if (aiCookCuisine !== "any") {
      stylePreferences.push(`Preferred cuisine: ${aiCookCuisine}.`);
    }
    if (aiCookDifficulty !== "any") {
      stylePreferences.push(`Difficulty level: ${aiCookDifficulty}.`);
    }
    if (aiCookMood !== "none") {
      stylePreferences.push(`Mood-based style: ${moodLabelMap[aiCookMood]}.`);
    }
    stylePreferences.push("Include a simple nutrition estimate with calories, protein, carbs, and fat.");
    const styleInstruction = stylePreferences.join(" ");
    const dietLabel = aiCookDiet === "nonveg" ? "Non-Veg" : aiCookDiet === "veg" ? "Veg" : "Any";

    setAiCookMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: "user", text: `${ingredients} (${dietLabel})` },
    ]);
    setAiCookLoading(true);
    setAiCookError("");
    setPantryInput("");

    try {
      const data = await requestAiCookRecipe(ingredients, styleInstruction, {
        dietPreference: aiCookDiet,
      });

      setAiCookMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: "assistant", recipe: data },
      ]);
    } catch (error) {
      console.error("AI cook request failed:", error);
      const networkDown = error?.message?.toLowerCase().includes("failed to fetch");
      setAiCookError(
        networkDown
          ? "Cannot connect to backend API. Check endpoint config and server status."
          : (error.message || "Something went wrong.")
      );
    } finally {
      setAiCookLoading(false);
    }
  };

  const requestAiCookRecipe = async (ingredients, styleInstruction = "", options = {}) => {
    const styledIngredients = styleInstruction
      ? `${ingredients}\n\nStyle Preference: ${styleInstruction}`
      : ingredients;

    const res = await fetch(aiCookEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: styledIngredients,
        dietPreference: options.dietPreference || "any",
      }),
    });

    const raw = await res.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          `API route not found at ${aiCookEndpoint}. Check VITE_AI_COOK_ENDPOINT or VITE_BACKEND_URL.`
        );
      }
      throw new Error(
        data?.error ||
        (raw ? `API error: ${raw.slice(0, 180)}` : "Failed to generate AI recipe.")
      );
    }

    if (!data) {
      throw new Error("Backend returned empty/non-JSON response.");
    }
    const nutrition = data.nutrition || data.nutritionInfo || {};
    const normalizedCalories = data.calories || nutrition.calories || "Not available";
    const normalizedProtein = data.protein || nutrition.protein || "Not available";
    const normalizedCarbs = data.carbs || nutrition.carbs || "Not available";
    const normalizedFat = data.fat || nutrition.fat || "Not available";

    return {
      ...data,
      calories: normalizedCalories,
      nutrition: {
        calories: normalizedCalories,
        protein: normalizedProtein,
        carbs: normalizedCarbs,
        fat: normalizedFat,
      },
    };
  };

  useEffect(() => {
    if (!aiCookFeedRef.current) return;
    aiCookFeedRef.current.scrollTop = aiCookFeedRef.current.scrollHeight;
  }, [aiCookMessages, aiCookLoading, aiCookOpen]);

  const openShoppingIngredients = async (meal) => {
    let recipeForShopping = meal;
    let ingredientNames = getIngredientNames(recipeForShopping);

    if (!ingredientNames.length && meal?.idMeal) {
      try {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
        );
        const data = await res.json();
        if (data?.meals?.[0]) {
          recipeForShopping = data.meals[0];
          ingredientNames = getIngredientNames(recipeForShopping);
        }
      } catch (error) {
        console.error("Failed to load ingredients for shopping:", error);
      }
    }

    if (!ingredientNames.length) {
      Swal.fire({
        icon: "info",
        title: "Ingredients Not Available",
        text: "No ingredient list found for this recipe.",
      });
      return;
    }

    setShoppingRecipe(recipeForShopping);
  };

  const closeShoppingIngredients = () => setShoppingRecipe(null);

  const handleIngredientBuyClick = (ingredientName) => {
    openAmazonIndiaIngredientsSearch(ingredientName);
  };

  const openVideo = (meal) => setVideoRecipe(meal);
  const closeVideo = () => setVideoRecipe(null);

  const handleWatchVideo = (meal) => {
    if (meal.strYoutube) {
      openVideo(meal);
    } else {
      Swal.fire({ icon: "info", title: "Video Not Available", text: "Sorry, we couldn't find a video for this recipe. 🎬" });
    }
  };
  const handleChefDetails = async (meal) => {
    try {
      if (!meal.userId) {
        Swal.fire("Chef information not available");
        return;
      }

      const userRef = doc(db, "users", meal.userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Swal.fire("Chef profile not found");
        return;
      }

      const userData = userSnap.data();
      const profile = userData.profile || {};
      const preferences = userData.preferences || {};

      const avatar =
        profile.avatar ||
        "https://via.placeholder.com/100?text=Chef";

      Swal.fire({
        width: "650px",
        confirmButtonText: "Close",
        customClass: {
          popup: "chef-popup",
        },
        html: `
        <div class="chef-card">

          <!-- HEADER -->
          <div class="chef-header">
            <img src="${avatar}" class="chef-avatar" />
            <div>
              <h2>${profile.name || "Chef"}</h2>
              <span class="chef-badge">
                ${profile.cookingLevel || "Community Chef"}
              </span>
            </div>
          </div>

          <!-- BASIC INFO -->
          <div class="chef-section">
            <h3>Chef Information</h3>
            <div class="chef-grid">
              <div><strong>Email:</strong> ${profile.email || "-"}</div>
              <div><strong>Location:</strong> ${profile.location || "-"}</div>
              <div><strong>Favorite Cuisine:</strong> ${profile.favoriteCuisine || "-"}</div>
              <div><strong>Measurement Unit:</strong> ${preferences.measurementUnit || "-"}</div>
            </div>
          </div>

          <!-- BIO -->
          ${profile.bio
            ? `
          <div class="chef-section">
            <h3>About Chef</h3>
            <div class="chef-bio">
              ${profile.bio}
            </div>
          </div>
          `
            : ""
          }

          <!-- PREFERENCES -->
          <div class="chef-section">
            <h3>Preferences</h3>

            <div class="chef-preference-block">
              <p>Dietary Restrictions</p>
              <div class="chef-tags">
                ${(preferences.dietaryRestrictions || []).length
            ? preferences.dietaryRestrictions
              .map(tag => `<span class="chef-tag">${tag}</span>`)
              .join("")
            : `<span class="chef-tag-single">None</span>`
          }
              </div>
            </div>

            <div class="chef-preference-block">
              <p>Allergies</p>
              <div class="chef-tags">
                ${(preferences.allergies || []).length
            ? preferences.allergies
              .map(tag => `<span class="chef-tag">${tag}</span>`)
              .join("")
            : `<span class="chef-tag-single">None</span>`
          }
              </div>
            </div>

          </div>

        </div>
      `,
      });

    } catch (error) {
      console.error(error);
      Swal.fire("Error loading chef profile");
    }
  };

  const handleLike = async (id) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login first");
      return;
    }

    try {
      await applyLikeReaction({ recipeId: id, userId: user.uid });
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleUnlike = async (id) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login first");
      return;
    }

    try {
      await applyUnlikeReaction({ recipeId: id, userId: user.uid });
    } catch (err) {
      console.error("Unlike error:", err);
    }
  };

  const handleReaction = (id, selectedType) => {
    if (selectedType === "unlike") {
      handleUnlike(id);
      return;
    }
    handleLike(id);
  };

  const reactionRecipeIds = useMemo(() => {
    const ids = new Set();

    recipes.forEach((meal) => {
      const id = meal.idMeal || meal.idDrink;
      if (id) ids.add(id);
    });

    Object.values(categories).forEach((list) => {
      (list || []).forEach((meal) => {
        const id = meal.idMeal || meal.idDrink;
        if (id) ids.add(id);
      });
    });

    favoritesFromDB.forEach((fav) => {
      if (fav.id) ids.add(fav.id);
    });

    return Array.from(ids);
  }, [recipes, categories, favoritesFromDB]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = subscribeRecipeReactions(reactionRecipeIds, (reactionMap) => {
      setRecipeStates((prev) => {
        const next = { ...prev };
        reactionRecipeIds.forEach((id) => {
          const entry = reactionMap[id] || { likes: 0, unlikes: 0, likedBy: [], unlikedBy: [] };
          const userReaction = entry.likedBy.includes(user.uid)
            ? "like"
            : entry.unlikedBy.includes(user.uid)
              ? "unlike"
              : "none";

          next[id] = {
            ...(next[id] || {}),
            likes: entry.likes,
            unlikes: entry.unlikes,
            userReaction,
            favorite: next[id]?.favorite || favoritesFromDB.some((fav) => fav.id === id),
          };
        });
        return next;
      });
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [reactionRecipeIds, favoritesFromDB]);


  const handleFavorite = async (id, meal) => {
    const isFav = recipeStates[id]?.favorite;
    setRecipeStates((prev) => ({ ...prev, [id]: { ...prev[id], favorite: !isFav } }));
    try {
      const favDocRef = doc(db, "users", auth.currentUser.uid, "favorites", id);
      if (!isFav) {
        const chefName = meal.isChefRecipe
          ? meal.chefName || "Unknown Chef"
          : "System";

        await setDoc(favDocRef, {
          id,
          title: meal.strMeal || meal.strDrink,
          category: meal.strCategory,
          country: meal.strArea || "N/A",
          chefName,
          isChefRecipe: Boolean(meal.isChefRecipe),
          image: meal.strMealThumb || meal.strDrinkThumb,
          youtube: meal.strYoutube || null,
          instructions: meal.strInstructions || meal.steps || "",
          servings: meal.servings || meal.serving || null,
          ingredients: Array.from({ length: 20 }, (_, i) => {
            const ing = meal[`strIngredient${i + 1}`];
            const measure = meal[`strMeasure${i + 1}`];
            return ing && ing.trim() ? `${ing} - ${measure}` : null;
          }).filter(Boolean),
          createdAt: new Date(),
        });
      } else {
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "favorites", id));
      }
    } catch (err) {
      console.error("Error updating favorite:", err);
      setRecipeStates((prev) => ({ ...prev, [id]: { ...prev[id], favorite: isFav } }));
    }
  };

  const handleShowInstructions = (meal) => {
    if (!meal?.isChefRecipe) return;

    const instructions = (meal.strInstructions || meal.steps || "").trim();
    if (!instructions) {
      Swal.fire({
        icon: "info",
        title: "Instructions Not Available",
        text: "Chef has not added instructions for this recipe.",
      });
      return;
    }

    const formattedSteps = instructions
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((step, index) => `<b>Step ${index + 1}:</b> ${step}`)
      .join("<br><br>");

    Swal.fire({
      title: `
        <div style="display:flex; align-items:center; gap:10px; justify-content:center;">
          <span style="font-size:28px;">📖</span>
          <span>${meal.strMeal || "Recipe"} - Instructions</span>
        </div>
      `,
      html: `<div style="text-align:left; margin-top:10px;">${formattedSteps}</div>`,
      confirmButtonText: "Close",
      width: "600px",
    });
  };
  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };
  const [shuffledCategories, setShuffledCategories] = useState({});
  useEffect(() => {
    if (Object.keys(categories).length === 0) return;

    const shuffled = {};

    Object.keys(categories).forEach(cat => {
      shuffled[cat] = [...categories[cat]]
        .sort(() => Math.random() - 0.5);
    });

    setShuffledCategories(shuffled);

  }, [categories]); // ✅ correct

  const toggleCommentLike = async (meal, commentIndex) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login to like comments");
      return;
    }

    const recipeDocId = getChefRecipeDocId(meal);
    if (!recipeDocId) return;

    // Create a deep copy to avoid direct state mutation
    const updatedComments = JSON.parse(JSON.stringify(meal.comments || []));
    const comment = updatedComments[commentIndex];

    if (!comment) return;

    // Initialize arrays if they don't exist
    if (!comment.likedBy) comment.likedBy = [];

    const hasLiked = comment.likedBy.includes(user.uid);

    if (hasLiked) {
      // --- UNLIKE LOGIC ---
      comment.likedBy = comment.likedBy.filter(id => id !== user.uid);
      comment.isLiked = false;
      // Ensure count doesn't go below 0
      comment.likesCount = Math.max(0, (comment.likesCount || 1) - 1);
    } else {
      // --- LIKE LOGIC ---
      comment.likedBy.push(user.uid);
      comment.isLiked = true;
      comment.likesCount = (comment.likesCount || 0) + 1;
    }

    try {
      // Update Firestore
      await updateDoc(doc(db, "recipes", recipeDocId), {
        comments: updatedComments
      });

      // Update Local UI State
      updateRecipeCommentsInState(meal.idMeal, updatedComments);

    } catch (err) {
      console.error("Error toggling comment like:", err);
      Toast.fire({ icon: "error", title: "Failed to update like" });
    }
  };

  const getRecommended = () => {
    let allMeals = [];

    // ✅ Only API meals (categories)
    Object.values(categories).forEach(cat => {
      allMeals = [...allMeals, ...cat];
    });

    const filtered = applySmartFilters(allMeals);

    const likedMeals = Object.keys(recipeStates)
      .filter(id =>
        recipeStates[id]?.favorite ||
        recipeStates[id]?.userReaction === "like"
      )
      .map(id => allMeals.find(m => m.idMeal === id))
      .filter(Boolean);

    // 👉 If no likes yet → show random trending
    if (likedMeals.length === 0) {
      return shuffleArray(filtered).slice(0, 10);
    }

    const categoryCount = {};
    const areaCount = {};

    likedMeals.forEach(meal => {
      categoryCount[meal.strCategory] =
        (categoryCount[meal.strCategory] || 0) + 1;

      areaCount[meal.strArea] =
        (areaCount[meal.strArea] || 0) + 1;
    });

    const scored = filtered.map(meal => {
      let score = 0;

      if (categoryCount[meal.strCategory]) {
        score += categoryCount[meal.strCategory] * 5;
      }

      if (areaCount[meal.strArea]) {
        score += areaCount[meal.strArea] * 3;
      }

      const likes = recipeStates[meal.idMeal]?.likes || 0;
      score += likes * 0.5;

      if (userPreferences?.vegetarianOnly && isVeg(meal)) {
        score += 4;
      }

      score += Math.random() * 2;

      return { ...meal, aiScore: score };
    });

    return scored
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 10);
  };
  // --- REPLY ACTIONS ---

 const toggleReplyLike = async (meal, commentIndex, replyIndex) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login to like replies");
      return;
    }

    const recipeDocId = getChefRecipeDocId(meal);
    if (!recipeDocId) return;

    // 1. Clone the current comments to modify them
    const updatedComments = JSON.parse(JSON.stringify(meal.comments || []));
    const reply = updatedComments[commentIndex]?.replies?.[replyIndex];

    if (!reply) return;

    // 2. Logic for Liking/Unliking
    if (!reply.likedBy) reply.likedBy = [];
    const hasLiked = reply.likedBy.includes(user.uid);

    if (hasLiked) {
      // --- UNLIKE ---
      reply.likedBy = reply.likedBy.filter(id => id !== user.uid);
      reply.likesCount = Math.max(0, (reply.likesCount || 1) - 1);
    } else {
      // --- LIKE ---
      reply.likedBy.push(user.uid);
      reply.likesCount = (reply.likesCount || 0) + 1;
    }

    try {
      // 3. Push to Firestore only. 
      // The onSnapshot listener in Step 2 will catch this change and update your screen!
      await updateDoc(doc(db, "recipes", recipeDocId), { 
        comments: updatedComments 
      });
    } catch (err) {
      console.error("Error toggling reply like:", err);
      // Optional: use a toast for errors
    }
  };
  // ✅ Live Sync for Comments and Replies
useEffect(() => {
  if (!activeCommentMeal) return;

  const recipeDocId = getChefRecipeDocId(activeCommentMeal);
  if (!recipeDocId) return;

  // Listen for real-time changes to the specific recipe document
  const unsub = onSnapshot(doc(db, "recipes", recipeDocId), (docSnap) => {
    if (docSnap.exists()) {
      const updatedData = docSnap.data();
      const newComments = updatedData.comments || [];

      // 1. Update the modal's current meal data so the modal refreshes
      setActiveCommentMeal((prev) => ({
        ...prev,
        comments: newComments,
      }));

      // 2. Update the main recipes list so the comment count icon on the card updates
      setRecipes((prevRecipes) =>
        prevRecipes.map((r) =>
          (r.idMeal || r.id) === activeCommentMeal.idMeal
            ? { ...r, comments: newComments }
            : r
        )
      );
    }
  });

  return () => unsub(); // Detach listener when modal closes
}, [activeCommentMeal?.idMeal]);
  const handleDeleteReply = async (meal, commentIndex, replyIndex) => {
    const confirmDelete = await Swal.fire({
      title: "Delete reply?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });

    if (!confirmDelete.isConfirmed) return;

    const updatedComments = JSON.parse(JSON.stringify(meal.comments));
    updatedComments[commentIndex].replies.splice(replyIndex, 1);

    try {
      await updateDoc(doc(db, "recipes", getChefRecipeDocId(meal)), { comments: updatedComments });
      updateRecipeCommentsInState(meal.idMeal, updatedComments);
    } catch (err) {
      console.error("Delete reply error:", err);
    }
  };

  const handleEditReply = async (meal, commentIndex, replyIndex) => {
    const reply = meal.comments[commentIndex].replies[replyIndex];

    const { value: newText } = await Swal.fire({
      title: 'Edit Reply',
      input: 'text',
      inputValue: reply.text,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Reply cannot be empty";
        return null;
      },
    });

    if (newText && newText !== reply.text) {
      const updatedComments = JSON.parse(JSON.stringify(meal.comments));
      updatedComments[commentIndex].replies[replyIndex].text = newText.trim();

      try {
        await updateDoc(doc(db, "recipes", getChefRecipeDocId(meal)), { comments: updatedComments });
        updateRecipeCommentsInState(meal.idMeal, updatedComments);
      } catch (err) {
        console.error("Edit reply error:", err);
      }
    }
  };

  const [recommendedMeals, setRecommendedMeals] = useState([]);
  const hasInitializedRecommendations = useRef(false);

  useEffect(() => {
    if (hasInitializedRecommendations.current) return;
    if (Object.keys(categories).length === 0) return;

    setRecommendedMeals(getRecommended());
    hasInitializedRecommendations.current = true;

  }, [categories]);




  return (
    <div className="recipe-finder-container">
      <div className="search-container">
        <input
          type="text"
          // ✨ UPDATE: New placeholder text
          placeholder="Search recipes or ingredients (e.g., chicken onion)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          onKeyDown={(e) => e.key === 'Enter' && searchRecipe()}
        />
        <button onClick={searchRecipe} className="search-button">
          Search
        </button>
      </div>

      <button
        className="ai-cook-launcher"
        onClick={() => setAiCookOpen(true)}
        type="button"
      >
        AI Cook
      </button>

      {aiCookOpen && (
        <button
          type="button"
          className="ai-cook-overlay"
          aria-label="Close AI cook panel"
          onClick={() => setAiCookOpen(false)}
        />
      )}

      <aside className={`ai-cook-drawer ${aiCookOpen ? "open" : ""}`}>
        <div className="ai-cook-drawer-header">
          <div>
            <h3 className="ai-cook-title">AI Cook With What I Have</h3>
            <p className="ai-cook-subtitle">Example: onion, potato, cheese</p>
          </div>
          <button
            type="button"
            className="ai-cook-close"
            aria-label="Close AI cook panel"
            onClick={() => setAiCookOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="ai-cook-chat-feed" ref={aiCookFeedRef}>
          {aiCookMessages.length === 0 && (
            <div className="ai-chat-bubble assistant">
              <p>Send ingredients and I will generate a recipe.</p>
            </div>
          )}

          {aiCookMessages.map((msg) => (
            <div key={msg.id} className={`ai-chat-bubble ${msg.role}`}>
              {msg.role === "user" ? (
                <p>{msg.text}</p>
              ) : (
                <div className="ai-cook-result">
                  <div className="ai-cook-result-top">
                    {msg.recipe?.imageUrl && (
                      <img
                        src={msg.recipe.imageUrl}
                        alt={msg.recipe.title || "AI recipe"}
                        className="ai-cook-result-image"
                        loading="lazy"
                      />
                    )}
                    <div className="ai-cook-result-content">
                      <h4>{msg.recipe?.title || "Suggested Recipe"}</h4>
                      <div className="ai-cook-meta-row">
                        <span className="ai-cook-meta-pill">
                          <b>Cooking Time:</b> {msg.recipe?.cookingTime || "25-35 mins"}
                        </span>
                        <span className="ai-cook-meta-pill">
                          <b>Calories:</b> {msg.recipe?.calories || "Not available"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="ai-cook-toggle-btn"
                        onClick={() => setAiCookShowNutrition((prev) => !prev)}
                      >
                        {aiCookShowNutrition ? "Hide Nutrition" : "Show Nutrition"}
                      </button>
                      {aiCookShowNutrition && (
                        <div className="ai-cook-nutrition">
                          <div className="ai-cook-nutrition-grid">
                            <span className="ai-cook-nutri-pill">
                              <b>Calories:</b> {msg.recipe?.nutrition?.calories || "Not available"}
                            </span>
                            <span className="ai-cook-nutri-pill">
                              <b>Protein:</b> {msg.recipe?.nutrition?.protein || "Not available"}
                            </span>
                            <span className="ai-cook-nutri-pill">
                              <b>Carbs:</b> {msg.recipe?.nutrition?.carbs || "Not available"}
                            </span>
                            <span className="ai-cook-nutri-pill">
                              <b>Fat:</b> {msg.recipe?.nutrition?.fat || "Not available"}
                            </span>
                          </div>
                        </div>
                      )}
                      {msg.recipe?.youtubeUrl && (
                        <p>
                          <b>YouTube Suggestion:</b>{" "}
                          <a href={msg.recipe.youtubeUrl} target="_blank" rel="noreferrer">
                            Watch Recipe Videos
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ai-cook-steps">
                    <b>Recipe Steps:</b>
                    <ol>
                      {(msg.recipe?.recipeSteps || []).map((step, idx) => (
                        <li key={`${step}-${idx}`}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          ))}

          {aiCookLoading && (
            <div className="ai-chat-bubble assistant">
              <p>Generating recipe...</p>
            </div>
          )}
        </div>

        {aiCookError && <p className="ai-cook-error">{aiCookError}</p>}

        <div className="ai-cook-input-row">
          <div className="ai-cook-input-wrap">
            <textarea
              value={pantryInput}
              onChange={(e) => setPantryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAiCookWithIngredients()}
              placeholder="I have onion, potato, and cheese"
              className="ai-cook-input ai-cook-input--with-voice"
              rows={3}
            />
            <button
              type="button"
              onClick={startVoiceInput}
              className="ai-cook-voice-button"
              style={{ background: isListening ? "#ef4444" : "#f97316" }}
              title={isListening ? "Stop listening" : "Speak your ingredients"}
              aria-label={isListening ? "Stop listening" : "Speak your ingredients"}
            >
              {isListening ? <FaStop /> : <FaMicrophone />}
            </button>
          </div>
          <div className="ai-cook-action-row">
            <label className="ai-cook-select-wrap" data-purpose="Diet Filter">
              <FaLeaf className="ai-cook-select-icon" />
              <select
                value={aiCookDiet}
                onChange={(e) => setAiCookDiet(e.target.value)}
                className="ai-cook-select ai-cook-select--icon-only"
                aria-label="Diet filter"
              >
                <option value="any">Any</option>
                <option value="veg">Veg</option>
                <option value="nonveg">Non-Veg</option>
              </select>
              <FaChevronDown className="ai-cook-select-caret" />
            </label>
            <label className="ai-cook-select-wrap" data-purpose="Cooking Time Filter">
              <FaClock className="ai-cook-select-icon" />
              <select
                value={aiCookTimeFilter}
                onChange={(e) => setAiCookTimeFilter(e.target.value)}
                className="ai-cook-select ai-cook-select--icon-only"
                aria-label="Cooking time filter"
              >
                <option value="any">Any Time</option>
                <option value="under15">Under 15 mins</option>
                <option value="under30">Under 30 mins</option>
                <option value="under60">Under 1 hour</option>
              </select>
              <FaChevronDown className="ai-cook-select-caret" />
            </label>
            <label className="ai-cook-select-wrap" data-purpose="Cuisine Filter">
              <FaGlobeAmericas className="ai-cook-select-icon" />
              <select
                value={aiCookCuisine}
                onChange={(e) => setAiCookCuisine(e.target.value)}
                className="ai-cook-select ai-cook-select--icon-only"
                aria-label="Cuisine filter"
              >
                <option value="any">Any Cuisine</option>
                <option value="Indian">Indian</option>
                <option value="Italian">Italian</option>
                <option value="Chinese">Chinese</option>
                <option value="Mexican">Mexican</option>
                <option value="American">American</option>
              </select>
              <FaChevronDown className="ai-cook-select-caret" />
            </label>
            <label className="ai-cook-select-wrap" data-purpose="Difficulty Filter">
              <FaFire className="ai-cook-select-icon" />
              <select
                value={aiCookDifficulty}
                onChange={(e) => setAiCookDifficulty(e.target.value)}
                className="ai-cook-select ai-cook-select--icon-only"
                aria-label="Difficulty filter"
              >
                <option value="any">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <FaChevronDown className="ai-cook-select-caret" />
            </label>
            <label
              className="ai-cook-select-wrap ai-cook-select-wrap--mood"
              data-purpose="Mood-Based Suggestion"
            >
              <FaBrain className="ai-cook-select-icon" />
              <select
                value={aiCookMood}
                onChange={(e) => setAiCookMood(e.target.value)}
                className="ai-cook-select ai-cook-select--icon-only"
                aria-label="Mood suggestion"
              >
                <option value="none">Mood: None</option>
                <option value="lazy">Lazy</option>
                <option value="gym">Gym</option>
                <option value="romantic">Romantic</option>
                <option value="party">Party</option>
              </select>
              <FaChevronDown className="ai-cook-select-caret" />
            </label>
            <button
              onClick={handleAiCookWithIngredients}
              className="ai-cook-button"
              disabled={aiCookLoading}
            >
              {aiCookLoading ? "Generating..." : "Generate Recipe"}
            </button>
          </div>
        </div>
      </aside>

      <div className="recipes-grid">

        {/* ================= LOADER ================= */}
        {loading ? (
          <div
            style={{
              width: "100%",
              height: "60vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "18px"
            }}
          >
            <NoodleAnimation />


          </div>

        ) : recipes.length > 0 ? (

          /* ================= SEARCH RESULTS ================= */
          recipes.map((meal, index) => {
            const id = meal.idMeal || meal.idDrink;
            const { likes = 0, unlikes = 0, favorite = false } = recipeStates[id] || {};

            return (
              <React.Fragment key={`recipe-item-${id}-${index}`}>
                <div key={id} className="recipe-card">
                  {isVeg(meal) ? (
                    <div className="veg-icon">
                      <div className="circle"></div>
                    </div>
                  ) : (
                    <div className="nonveg-icon">
                      <div className="circle"></div>
                    </div>
                  )}

                  <img
                    src={meal.strMealThumb || meal.strDrinkThumb}
                    alt={meal.strMeal || meal.strDrink}
                    className="recipe-image"
                  />

                  <h2 className="recipe-title">{meal.strMeal || meal.strDrink}</h2>

                  <p className="recipe-info">
                    <b>Category:</b> {meal.strCategory} <br />
                    <b>Chef:</b>{" "}
                    {meal.isChefRecipe ? (
                      <span
                        onClick={() => handleChefDetails(meal)}
                        className="chef-name"
                      >
                        {meal.chefName || "Unknown Chef"}
                        <span className="chef-tooltip">Click to view information</span>
                      </span>
                    ) : (
                      "System"
                    )}
                    <br />
                    <b>Country:</b> {meal.strArea || "N/A"}
                  </p>

                  <button
                    className="watch-video-btn"
                    onClick={() => handleWatchVideo(meal)}
                  >
                    ▶ Watch Video
                  </button>

                  <div className="reaction-buttons">
                    <button className="like-btn" onClick={() => handleReaction(id, "like")}>
                      {recipeStates[id]?.userReaction === "like"
                        ? <FaThumbsUp style={{ color: "green", fontSize: "20px" }} />
                        : <FaRegThumbsUp style={{ fontSize: "20px" }} />}
                      <span> {likes}</span>
                    </button>

                    <button className="unlike-btn" onClick={() => handleReaction(id, "unlike")}>
                      {recipeStates[id]?.userReaction === "unlike"
                        ? <FaThumbsDown style={{ color: "red", fontSize: "20px" }} />
                        : <FaRegThumbsDown style={{ fontSize: "20px" }} />}
                      <span> {unlikes}</span>
                    </button>

                    <button
                      className={`heart-btn ${favorite ? "active" : ""}`}
                      onClick={() => handleFavorite(id, meal)}
                    >
                      {favorite
                        ? <FaHeart style={{ color: "crimson", fontSize: "20px" }} />
                        : <FaRegHeart style={{ fontSize: "20px" }} />}
                    </button>

                    <button
                      className="cart-btn"
                      onClick={() => openShoppingIngredients(meal)}
                      title="Order Ingredients"
                      aria-label="Order Ingredients"
                    >
                      <FaShoppingCart style={{ fontSize: "18px" }} />
                    </button>

                    {meal.isChefRecipe && (
                      <button
                        className="comment-btn"
                        onClick={() => setActiveCommentMeal(meal)} // Open the modal
                      >
                        <FaComment style={{ fontSize: "18px" }} />
                        <span> {meal.comments?.length || 0}</span>
                      </button>
                    )}
                  </div>

                  {meal.isChefRecipe ? (
                    <div className="recipe-card-action-row">
                      <button
                        onClick={() => openServingCalc(meal)}
                        className="ingredients-button"
                      >
                        🍴 Show Ingredients
                      </button>
                      <button
                        onClick={() => handleShowInstructions(meal)}
                        className="ingredients-button"
                      >
                        📖 Show Instructions
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openServingCalc(meal)}
                      className="ingredients-button"
                    >
                      🍴 Show Ingredients
                    </button>
                  )}
                </div>
                {(index + 1) % 6 === 0 && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    {/* ✅ ADSENSE POLICY: Show ads only with recipe content and not loading */}
                    <GoogleAd 
                      pageHasContent={true} 
                      isLoading={loading} 
                      hasRecipes={recipes.length} 
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })

        ) : (
          <>
            {/*  ================= DEFAULT CATEGORY VIEW ================= */}
            <div className="main-container">
              {!recipes.length && (
                <div className="category-section">
                  <h2>🔥 Recommended For You</h2>

                  <div className="category-row">
                    {recommendedMeals.length > 0 && recommendedMeals.map((meal) => {
                      const id = meal.idMeal;
                      const { likes = 0, unlikes = 0, favorite = false } =
                        recipeStates[id] || {};

                      return (
                        <div key={id} className="recipe-card">
                          <div className="card-header">
                            {isVeg(meal) ? (
                              <div className="veg-icon">
                                <div className="circle"></div>
                              </div>
                            ) : (
                              <div className="nonveg-icon">
                                <div className="circle"></div>
                              </div>
                            )}

                            <img
                              src={meal.strMealThumb}
                              alt={meal.strMeal}
                              className="recipe-image"
                            />
                          </div>

                          <div className="card-body">
                            <h2 className="recipe-title">{meal.strMeal}</h2>
                            <p className="recipe-info">
                              <b>Category:</b> {meal.strCategory} <br />
                              <b>Chef:</b> System <br />
                              <b>Country:</b> {meal.strArea || "N/A"}
                            </p>
                          </div>

                          <div className="card-footer">
                            <button
                              className="watch-video-btn centered-btn"
                              onClick={() => handleWatchVideo(meal)}
                            >
                              ▶ Watch Video
                            </button>

                            <div className="reaction-buttons">
                              <button className="like-btn" onClick={() => handleReaction(id, "like")}>
                                {recipeStates[id]?.userReaction === "like"
                                  ? <FaThumbsUp style={{ color: "green", fontSize: "20px" }} />
                                  : <FaRegThumbsUp style={{ fontSize: "20px" }} />}
                                <span> {likes}</span>
                              </button>

                              <button className="unlike-btn" onClick={() => handleReaction(id, "unlike")}>
                                {recipeStates[id]?.userReaction === "unlike"
                                  ? <FaThumbsDown style={{ color: "red", fontSize: "20px" }} />
                                  : <FaRegThumbsDown style={{ fontSize: "20px" }} />}
                                <span> {unlikes}</span>
                              </button>

                              <button
                                className={`heart-btn ${favorite ? "active" : ""}`}
                                onClick={() => handleFavorite(id, meal)}
                              >
                                {favorite
                                  ? <FaHeart style={{ color: "crimson", fontSize: "20px" }} />
                                  : <FaRegHeart style={{ fontSize: "20px" }} />}
                              </button>

                              <button
                                className="cart-btn"
                                onClick={() => openShoppingIngredients(meal)}
                                title="Order Ingredients"
                                aria-label="Order Ingredients"
                              >
                                <FaShoppingCart style={{ fontSize: "18px" }} />
                              </button>
                            </div>

                            <button
                              onClick={() => openServingCalc(meal)}
                              className="ingredients-button"
                            >
                              🍴 Show Ingredients
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {Object.keys(categories).map((cat) => (
                <div key={cat} className="category-section">
                  <h2>{cat}</h2>

                  <div className="category-row">
                    {shuffledCategories[cat]?.slice(0, 10).map((meal) => {
                      const id = meal.idMeal;
                      const { likes = 0, unlikes = 0, favorite = false } =
                        recipeStates[id] || {};

                      return (
                        <div key={id} className="recipe-card">
                          <div className="card-header">
                            {isVeg(meal) ? (
                              <div className="veg-icon">
                                <div className="circle"></div>
                              </div>
                            ) : (
                              <div className="nonveg-icon">
                                <div className="circle"></div>
                              </div>
                            )}
                            <img
                              src={meal.strMealThumb}
                              alt={meal.strMeal}
                              className="recipe-image"
                            />
                          </div>

                          <div className="card-body">
                            <h2 className="recipe-title">{meal.strMeal}</h2>
                            <p className="recipe-info">
                              <b>Category:</b> {meal.strCategory} <br />
                              <b>Chef:</b> System <br />
                              <b>Country:</b> {meal.strArea || "N/A"}
                            </p>
                          </div>

                          <div className="card-footer">
                            <button
                              className="watch-video-btn centered-btn"
                              onClick={() => handleWatchVideo(meal)}
                            >
                              ▶ Watch Video
                            </button>

                            <div className="reaction-buttons">
                              <button
                                className="like-btn"
                                onClick={() => handleReaction(id, "like")}
                              >
                                {recipeStates[id]?.userReaction === "like"
                                  ? <FaThumbsUp style={{ color: "green", fontSize: "20px" }} />
                                  : <FaRegThumbsUp style={{ fontSize: "20px" }} />}
                                <span> {likes}</span>
                              </button>

                              <button
                                className="unlike-btn"
                                onClick={() => handleReaction(id, "unlike")}
                              >
                                {recipeStates[id]?.userReaction === "unlike"
                                  ? <FaThumbsDown style={{ color: "red", fontSize: "20px" }} />
                                  : <FaRegThumbsDown style={{ fontSize: "20px" }} />}
                                <span> {unlikes}</span>
                              </button>

                              <button
                                className={`heart-btn ${favorite ? "active" : ""}`}
                                onClick={() => handleFavorite(id, meal)}
                              >
                                {favorite
                                  ? <FaHeart style={{ color: "crimson", fontSize: "20px" }} />
                                  : <FaRegHeart style={{ fontSize: "20px" }} />}
                              </button>

                              <button
                                className="cart-btn"
                                onClick={() => openShoppingIngredients(meal)}
                                title="Order Ingredients"
                                aria-label="Order Ingredients"
                              >
                                <FaShoppingCart style={{ fontSize: "18px" }} />
                              </button>
                            </div>


                            <button
                              onClick={() => openServingCalc(meal)}
                              className="ingredients-button"
                            >
                              🍴 Show Ingredients
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>)}

      </div>

      {/* ================= OLD INGREDIENTS MODAL (kept for compatibility) ================= */}
      {selectedRecipe && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={closeIngredients} className="close-button">✖</button>
            <h2 className="modal-title">{selectedRecipe.strMeal || selectedRecipe.strDrink}</h2>
            <h3 className="modal-heading">Ingredients:</h3>
            <ul className="modal-list">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => {
                const ing = selectedRecipe[`strIngredient${i}`];
                const measure = selectedRecipe[`strMeasure${i}`];
                return (ing && ing.trim() && <li key={i}>{ing} - {measure}</li>);
              })}
            </ul>
          </div>
        </div>
      )}

      {/* ================= ✅ NEW: SMART SERVING CALCULATOR ================= */}
      {servingRecipe && (
        <ServingCalculator meal={servingRecipe} onClose={closeServingCalc} />
      )}

      {shoppingRecipe && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={closeShoppingIngredients} className="close-button">✖</button>
            <h2 className="modal-title">{shoppingRecipe.strMeal || shoppingRecipe.strDrink}</h2>
            <h3 className="modal-heading">Select ingredient to buy:</h3>
            <ul className="modal-list amazon-ingredient-list">
              {getIngredientNames(shoppingRecipe).map((ing, index) => (
                <li key={`${ing}-${index}`}>
                  <button
                    type="button"
                    className="ingredient-link-button"
                    onClick={() => handleIngredientBuyClick(ing)}
                  >
                    {ing}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {videoRecipe && (
        <div className="modal-overlay">
          <div className="modal-content video-modal-content">
            <button onClick={closeVideo} className="close-button">✖</button>
            <h2 className="modal-title">{videoRecipe.strMeal || videoRecipe.strDrink}</h2>
            <div className="video-wrapper">
              <iframe
                width="100%" height="300"
                src={videoRecipe.strYoutube.replace("watch?v=", "embed/")}
                title={videoRecipe.strMeal || videoRecipe.strDrink}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
      {/* ================= INSTAGRAM STYLE COMMENT MODAL ================= */}
      {activeCommentMeal && (
        <div className="comment-modal-overlay" onClick={() => setActiveCommentMeal(null)}>
          <div className="comment-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="comment-modal-handle"></div>

            <div className="comment-modal-header">
              <h3>Comments</h3>
              <button className="close-comment-btn" onClick={() => setActiveCommentMeal(null)}>✖</button>
            </div>

            <div className="comment-modal-body">
              {activeCommentMeal.comments?.length > 0 ? (
                activeCommentMeal.comments.map((comment, index) => (
                  <div key={index} className="comment-wrapper">
                    <div className="insta-comment-item">
                      <div className="insta-comment-avatar">
                        {(comment.userAvatar || userAvatars[comment.userId]) ? (
                          <img src={comment.userAvatar || userAvatars[comment.userId]} alt={comment.user} />
                        ) : (
                          <span>{comment.user?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="insta-comment-content">
                        <p><span className="insta-comment-user">{comment.user}</span> {comment.text}</p>

                        <div className="insta-comment-actions">
                          <span
                            className="action-heart"
                            onClick={() => toggleCommentLike(activeCommentMeal, index)}
                          >
                            {comment.isLiked ? <FaHeart color="red" /> : <FaRegHeart />}
                            {comment.likesCount > 0 && <span className="like-count">{comment.likesCount}</span>}
                          </span>
                          <span
                            className="action-link"
                            onClick={() => activateReplyMode(comment.user, index)}
                          >
                            Reply
                          </span>
                          {canManageComment(comment) && (
                            <>
                              <span className="action-link" onClick={() => handleEditComment(activeCommentMeal, index)}>Edit</span>
                              <span className="action-link danger" onClick={() => handleDeleteComment(activeCommentMeal, index)}>Delete</span>
                            </>
                          )}
                        </div>

                        {/* --- VIEW REPLIES TOGGLE --- */}
                        {comment.replies?.length > 0 && (
                          <div className="view-replies-toggle" onClick={() => toggleReplies(index)}>
                            <span className="line"></span>
                            {visibleReplies[index] ? "Hide replies" : `View replies (${comment.replies.length})`}
                          </div>
                        )}

                        {/* --- NESTED REPLIES LIST --- */}
                        {visibleReplies[index] && comment.replies?.map((reply, rIdx) => (
                          <div key={rIdx} className="insta-comment-item reply-item">
                            <div className="insta-comment-avatar small">
                              {reply.userAvatar ? (
                                <img src={reply.userAvatar} alt={reply.user} />
                              ) : (
                                <span>{reply.user?.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="insta-comment-content">
                              <p><span className="insta-comment-user">{reply.user}</span> {reply.text}</p>

                              <div className="insta-comment-actions">
                                {/* REPLY LIKE BUTTON */}
                                <span
                                  className="action-heart"
                                  onClick={() => toggleReplyLike(activeCommentMeal, index, rIdx)}
                                >
                                  {reply.likedBy?.includes(auth.currentUser?.uid) ?
                                    <FaHeart color="red" style={{ fontSize: "12px" }} /> :
                                    <FaRegHeart style={{ fontSize: "12px" }} />
                                  }
                                  {reply.likesCount > 0 && <span className="like-count">{reply.likesCount}</span>}
                                </span>

                                {/* PERMISSION CHECK: Only same user can edit/delete */}
                                {auth.currentUser?.uid === reply.userId && (
                                  <>
                                    <span className="action-link" onClick={() => handleEditReply(activeCommentMeal, index, rIdx)}>Edit</span>
                                    <span className="action-link danger" onClick={() => handleDeleteReply(activeCommentMeal, index, rIdx)}>Delete</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-comments">No comments yet.</div>
              )}
            </div>

            <div className="comment-modal-footer">
              <input
                type="text"
                placeholder={`Add a comment for ${activeCommentMeal.strMeal}...`}
                value={commentInputs[activeCommentMeal.idMeal] || ""}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [activeCommentMeal.idMeal]: e.target.value,
                  }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddComment(activeCommentMeal)}
              />
              <button
                disabled={!commentInputs[activeCommentMeal.idMeal]?.trim()}
                onClick={() => handleAddComment(activeCommentMeal)}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
