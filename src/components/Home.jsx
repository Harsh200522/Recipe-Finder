// src/components/RecipeFinder.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import "../style/home.css";
import { FaComment } from "react-icons/fa";
import NoodleAnimation from "./NoodleAnimation";
import {
  FaThumbsUp,
  FaRegThumbsUp,
  FaThumbsDown,
  FaRegThumbsDown,
  FaHeart,
  FaRegHeart,
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



export default function RecipeFinder() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [videoRecipe, setVideoRecipe] = useState(null);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
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

      const newComment = {
        userId: user.uid,
        user: getCurrentUserCommentName(user),
        text: commentText,
        createdAt: new Date(),
      };

      await updateDoc(doc(db, "recipes", recipeDocId), {
        comments: arrayUnion(newComment),
      });

      setCommentInputs((prev) => ({ ...prev, [meal.idMeal]: "" }));
      updateRecipeCommentsInState(meal.idMeal, [...(meal.comments || []), newComment]);
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
        for (const key in catList) {
          const data = await safeFetchJson(
            `https://www.themealdb.com/api/json/v1/1/filter.php?c=${catList[key]}`
          );

          if (data?.meals?.length) {
            const detailedMeals = [];
            for (const meal of data.meals.slice(0, 6)) {
              const detailData = await safeFetchJson(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
              );
              if (detailData?.meals?.[0]) detailedMeals.push(detailData.meals[0]);
            }
            result[key] = detailedMeals;
          } else {
            result[key] = [];
          }
        }

        setCategories(result);
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
    const ingredients = (recipe.ingredients || "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);

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

      // 🔥 IMPORTANT ADD THIS
      userId: recipe.userId,            // ✅ REQUIRED
      chefName: recipe.createdBy || "Unknown Chef",

      isChefRecipe: true,
      likes: recipe.likes || 0,
      unlikes: recipe.unlikes || 0,
      likedBy: recipe.likedBy || [],
      unlikedBy: recipe.unlikedBy || [],
    };

    ingredients.forEach((ing, index) => {
      mapped[`strIngredient${index + 1}`] = ing;
      mapped[`strMeasure${index + 1}`] = "";
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
  // const handleLike = async (id) => {
  //   const user = auth.currentUser;
  //   if (!user) {
  //     Swal.fire("Please login first");
  //     return;
  //   }

  //   const reactionRef = doc(db, "users", user.uid, "reactions", id);
  //   const chefRecipeId = getChefRecipeDocId(id);

  //   try {
  //     if (chefRecipeId) {
  //       const recipeDocRef = doc(db, "recipes", chefRecipeId);
  //       const result = await runTransaction(db, async (tx) => {
  //         const reactionSnap = await tx.get(reactionRef);
  //         const currentType = reactionSnap.exists() ? reactionSnap.data().type : "none";

  //         const recipeSnap = await tx.get(recipeDocRef);
  //         if (!recipeSnap.exists()) {
  //           if (currentType === "like") tx.delete(reactionRef);
  //           else tx.set(reactionRef, { type: "like", updatedAt: new Date() });
  //           return { userReaction: currentType === "like" ? "none" : "like" };
  //         }

  //         const data = recipeSnap.data() || {};
  //         const likedBy = new Set(data.likedBy || []);
  //         const unlikedBy = new Set(data.unlikedBy || []);

  //         let userReaction = "like";
  //         if (currentType === "like") {
  //           likedBy.delete(user.uid);
  //           tx.delete(reactionRef);
  //           userReaction = "none";
  //         } else {
  //           likedBy.add(user.uid);
  //           unlikedBy.delete(user.uid);
  //           tx.set(reactionRef, { type: "like", updatedAt: new Date() });
  //         }

  //         tx.update(recipeDocRef, {
  //           likedBy: Array.from(likedBy),
  //           unlikedBy: Array.from(unlikedBy),
  //           likes: likedBy.size,
  //           unlikes: unlikedBy.size,
  //         });

  //         return { likes: likedBy.size, unlikes: unlikedBy.size, userReaction };
  //       });

  //       setRecipeStates((prev) => ({
  //         ...prev,
  //         [id]: {
  //           ...prev[id],
  //           favorite: prev[id]?.favorite ?? false,
  //           likes: result.likes ?? prev[id]?.likes ?? 0,
  //           unlikes: result.unlikes ?? prev[id]?.unlikes ?? 0,
  //           userReaction: result.userReaction || "none",
  //         },
  //       }));
  //       return;
  //     }

  //     const snap = await getDoc(reactionRef);
  //     const currentType = snap.exists() ? snap.data().type : "none";
  //     if (currentType === "like") {
  //       await deleteDoc(reactionRef);
  //       setRecipeStates((prev) => ({
  //         ...prev,
  //         [id]: {
  //           ...prev[id],
  //           favorite: prev[id]?.favorite ?? false,
  //           likes: 0,
  //           userReaction: "none",
  //         },
  //       }));
  //     } else {
  //       await setDoc(reactionRef, { type: "like", updatedAt: new Date() });
  //       setRecipeStates((prev) => ({
  //         ...prev,
  //         [id]: {
  //           ...prev[id],
  //           favorite: prev[id]?.favorite ?? false,
  //           likes: 1,
  //           unlikes: 0,
  //           userReaction: "like",
  //         },
  //       }));
  //     }
  //   } catch (err) {
  //     console.error("Like error:", err);
  //   }
  // };


  // const handleUnlike = async (id) => {
  //   const user = auth.currentUser;
  //   if (!user) return;

  //   const reactionRef = doc(db, "users", user.uid, "reactions", id);
  //   const chefRecipeId = getChefRecipeDocId(id);

  //   try {
  //     if (chefRecipeId) {
  //       const recipeDocRef = doc(db, "recipes", chefRecipeId);
  //       const result = await runTransaction(db, async (tx) => {
  //         const reactionSnap = await tx.get(reactionRef);
  //         const currentType = reactionSnap.exists() ? reactionSnap.data().type : "none";

  //         const recipeSnap = await tx.get(recipeDocRef);
  //         if (!recipeSnap.exists()) {
  //           if (currentType === "unlike") tx.delete(reactionRef);
  //           else tx.set(reactionRef, { type: "unlike", updatedAt: new Date() });
  //           return { userReaction: currentType === "unlike" ? "none" : "unlike" };
  //         }

  //         const data = recipeSnap.data() || {};
  //         const likedBy = new Set(data.likedBy || []);
  //         const unlikedBy = new Set(data.unlikedBy || []);

  //         let userReaction = "unlike";
  //         if (currentType === "unlike") {
  //           unlikedBy.delete(user.uid);
  //           tx.delete(reactionRef);
  //           userReaction = "none";
  //         } else {
  //           unlikedBy.add(user.uid);
  //           likedBy.delete(user.uid);
  //           tx.set(reactionRef, { type: "unlike", updatedAt: new Date() });
  //         }

  //         tx.update(recipeDocRef, {
  //           likedBy: Array.from(likedBy),
  //           unlikedBy: Array.from(unlikedBy),
  //           likes: likedBy.size,
  //           unlikes: unlikedBy.size,
  //         });

  //         return { likes: likedBy.size, unlikes: unlikedBy.size, userReaction };
  //       });

  //       setRecipeStates((prev) => ({
  //         ...prev,
  //         [id]: {
  //           ...prev[id],
  //           favorite: prev[id]?.favorite ?? false,
  //           likes: result.likes ?? prev[id]?.likes ?? 0,
  //           unlikes: result.unlikes ?? prev[id]?.unlikes ?? 0,
  //           userReaction: result.userReaction || "none",
  //         },
  //       }));
  //       return;
  //     }

  //     const snap = await getDoc(reactionRef);
  //     const currentType = snap.exists() ? snap.data().type : "none";
  //     if (currentType === "unlike") {
  //       await deleteDoc(reactionRef);
  //       setRecipeStates((prev) => ({
  //         ...prev,
  //         [id]: {
  //           ...prev[id],
  //           favorite: prev[id]?.favorite ?? false,
  //           unlikes: 0,
  //           userReaction: "none",
  //         },
  //       }));
  //     } else {
  //       await setDoc(reactionRef, { type: "unlike", updatedAt: new Date() });
  //       setRecipeStates((prev) => ({
  //         ...prev,
  //         [id]: {
  //           ...prev[id],
  //           favorite: prev[id]?.favorite ?? false,
  //           unlikes: 1,
  //           likes: 0,
  //           userReaction: "unlike",
  //         },
  //       }));
  //     }
  //   } catch (err) {
  //     console.error("Unlike error:", err);
  //   }
  // };
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
          recipes.map((meal) => {
            const id = meal.idMeal || meal.idDrink;
            const { likes = 0, unlikes = 0, favorite = false } = recipeStates[id] || {};
            // const chefReaction = meal.isChefRecipe
            //   ? (meal.likedBy?.includes(auth.currentUser?.uid)
            //     ? "like"
            //     : meal.unlikedBy?.includes(auth.currentUser?.uid)
            //       ? "unlike"
            //       : "none")
            //   : recipeStates[id]?.userReaction;

            return (
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

                  {meal.isChefRecipe && (
                    <button
                      className="comment-btn"
                      onClick={() =>
                        setShowComments((prev) => ({
                          ...prev,
                          [id]: !prev[id],
                        }))
                      }
                    >
                      <FaComment style={{ fontSize: "18px" }} />
                      <span> {meal.comments?.length || 0}</span>
                    </button>
                  )}
                </div>
                {meal.isChefRecipe && showComments[id] && (
                  <div className="cookbook-comments-area">

                    {/* Comment List */}
                    <div className="cookbook-comment-list">
                      {meal.comments?.length > 0 ? (
                        meal.comments.map((comment, index) => (
                          <div key={index} className="cookbook-comment-item">

                            <div className="cookbook-comment-content">
                              <div className="cookbook-comment-author">
                                {comment.user || "User"}
                              </div>

                              <div className="cookbook-comment-message">
                                {comment.text}
                              </div>
                            </div>

                            {/* Optional buttons (only show if current user wrote it) */}
                            {canManageComment(comment) && (
                              <div className="cookbook-comment-actions">
                                <button
                                  className="cookbook-comment-edit"
                                  onClick={() => handleEditComment(meal, index)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="cookbook-comment-delete"
                                  onClick={() => handleDeleteComment(meal, index)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}

                          </div>
                        ))
                      ) : (
                        <p style={{ opacity: 0.6 }}>No comments yet. Be the first!</p>
                      )}
                    </div>

                    {/* Comment Input */}
                    <div className="cookbook-comment-form">
                      <input
                        type="text"
                        className="cookbook-comment-field"
                        placeholder="Write a comment..."
                        value={commentInputs[id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="cookbook-submit-comment"
                        onClick={() => handleAddComment(meal)}
                      >
                        Post
                      </button>
                    </div>

                  </div>
                )}

                {meal.isChefRecipe ? (
                  <div className="recipe-card-action-row">
                    <button
                      onClick={() => openIngredients(meal)}
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
                    onClick={() => openIngredients(meal)}
                    className="ingredients-button"
                  >
                    🍴 Show Ingredients
                  </button>
                )}
              </div>
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
                            </div>

                            <button
                              onClick={() => openIngredients(meal)}
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
                            </div>


                            <button
                              onClick={() => openIngredients(meal)}
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
    </div>
  );
}
