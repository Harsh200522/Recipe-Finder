// src/components/RecipeFinder.jsx
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../style/home.css";
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
import { doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";

export default function RecipeFinder() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [videoRecipe, setVideoRecipe] = useState(null);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  // Local state for likes/unlikes/favorites
  const [recipeStates, setRecipeStates] = useState({});
  const [favoritesFromDB, setFavoritesFromDB] = useState([]);
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true); // start loader

      const catList = {
        Veg: "Vegetarian",
        NonVeg: "Chicken",
        Dessert: "Dessert",
        Seafood: "Seafood",
      };

      const result = {};

      for (const key in catList) {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?c=${catList[key]}`
        );
        const data = await res.json();

        if (data.meals) {
          const detailedMeals = await Promise.all(
            data.meals.slice(0, 10).map(async (meal) => {
              const detailRes = await fetch(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
              );
              return (await detailRes.json()).meals[0];
            })
          );

          result[key] = detailedMeals;
        } else {
          result[key] = [];
        }
      }

      setCategories(result);

      // small delay so animation looks smooth (optional)
      setTimeout(() => setLoading(false), 1200);
    };

    loadCategories();
  }, []);



  // 🔹 Fetch favorites from Firestore on initial load
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users", auth.currentUser.uid, "favorites"));
        const favs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setFavoritesFromDB(favs);

        const favState = {};
        favs.forEach((fav) => {
          favState[fav.id] = {
            likes: recipeStates[fav.id]?.likes || 0,
            unlikes: recipeStates[fav.id]?.unlikes || 0,
            favorite: true,
            userReaction: recipeStates[fav.id]?.userReaction || "none",
          };
        });
        setRecipeStates((prev) => ({ ...prev, ...favState }));
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


  // Drink keywords checker
  const isDrinkQuery = (q) => {
    const drinks = ["coffee", "tea", "cocktail", "mojito", "smoothie"];
    return drinks.some((drink) => q.toLowerCase().includes(drink));
  };

  // Veg / Non-Veg checker
  const isVeg = (meal) => {
    const nonVegKeywords = [
      // Meats 
      "chicken", "mutton", "fish", "pork", "beef", "lamb", "duck", "turkey", "Goat",
      "venison", "rabbit", "quail", "pheasant", "bison", "buffalo",
      // Seafood
      "shrimp", "prawn", "crab", "lobster", "crayfish", "oyster", "mussel", "clam",
      "scallop", "squid", "octopus", "calamari", "anchovy", "sardine", "tuna",
      "salmon", "cod", "haddock", "halibut", "mackerel", "trout",
      // Processed meats
      "bacon", "ham", "sausage", "pepperoni", "salami", "prosciutto", "chorizo", "barramundi",
      // Other animal products
      "egg", "eggs", "gelatin", "rennet", "lard", "tallow", "broth", "stock",
      "bone", "marrow", "caviar", "roe", "whey", "casein", "collagen", "honey"
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

      if (!results || results.length === 0) {
        Swal.fire({ icon: "error", title: "No Recipes Found", text: "Try a different search! 🍽️" });
        return;
      }

      Swal.fire({ icon: "success", title: "Recipes Loaded 🎉", text: `We found ${results.length} recipes for you!`, timer: 1500, showConfirmButton: false });

      const initialStates = {};
      results.forEach((meal) => {
        const id = meal.idMeal || meal.idDrink;
        initialStates[id] = {
          likes: recipeStates[id]?.likes || 0,
          unlikes: recipeStates[id]?.unlikes || 0,
          favorite: favoritesFromDB.some((fav) => fav.id === id),
          userReaction: recipeStates[id]?.userReaction || "none",
        };
      });

      setRecipeStates((prev) => ({ ...prev, ...initialStates }));
      setRecipes(results);
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

  const handleLike = (id) => {
    setRecipeStates((prev) => {
      const current = prev[id] || { likes: 0, unlikes: 0, favorite: false, userReaction: "none" };
      let { likes, unlikes, userReaction } = current;
      if (userReaction === "like") {
        likes -= 1;
        userReaction = "none";
      } else {
        likes += 1;
        if (userReaction === "unlike") unlikes -= 1;
        userReaction = "like";
      }
      return { ...prev, [id]: { ...current, likes, unlikes, userReaction } };
    });
  };

  const handleUnlike = (id) => {
    setRecipeStates((prev) => {
      const current = prev[id] || { likes: 0, unlikes: 0, favorite: false, userReaction: "none" };
      let { likes, unlikes, userReaction } = current;
      if (userReaction === "unlike") {
        unlikes -= 1;
        userReaction = "none";
      } else {
        unlikes += 1;
        if (userReaction === "like") likes -= 1;
        userReaction = "unlike";
      }
      return { ...prev, [id]: { ...current, likes, unlikes, userReaction } };
    });
  };

  const handleFavorite = async (id, meal) => {
    const isFav = recipeStates[id]?.favorite;
    setRecipeStates((prev) => ({ ...prev, [id]: { ...prev[id], favorite: !isFav } }));
    try {
      const favDocRef = doc(db, "users", auth.currentUser.uid, "favorites", id);
      if (!isFav) {
        await setDoc(favDocRef, {
          id,
          title: meal.strMeal || meal.strDrink,
          category: meal.strCategory,
          country: meal.strArea || "N/A",
          image: meal.strMealThumb || meal.strDrinkThumb,
          youtube: meal.strYoutube || null,
          ingredients: Array.from({ length: 20 }, (_, i) => {
            const ing = meal[`strIngredient${i + 1}`];
            const measure = meal[`strMeasure${i + 1}`];
            return ing && ing.trim() ? `${ing} - ${measure}` : null;
          }).filter(Boolean),
          createdAt: new Date(),
        });
        setFavoritesFromDB((prev) => [...prev, { id, ...meal }]);
      } else {
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "favorites", id));;
        setFavoritesFromDB((prev) => prev.filter((fav) => fav.id !== id));
      }
    } catch (err) {
      console.error("Error updating favorite:", err);
      setRecipeStates((prev) => ({ ...prev, [id]: { ...prev[id], favorite: isFav } }));
    }
  };

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
                  <b>Country:</b> {meal.strArea || "N/A"}
                </p>

                <button
                  className="watch-video-btn"
                  onClick={() => handleWatchVideo(meal)}
                >
                  ▶ Watch Video
                </button>

                <div className="reaction-buttons">
                  <button className="like-btn" onClick={() => handleLike(id)}>
                    {recipeStates[id]?.userReaction === "like"
                      ? <FaThumbsUp style={{ color: "green", fontSize: "20px" }} />
                      : <FaRegThumbsUp style={{ fontSize: "20px" }} />}
                    <span> {likes}</span>
                  </button>

                  <button className="unlike-btn" onClick={() => handleUnlike(id)}>
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
            );
          })

        ) : (
          /* ================= DEFAULT CATEGORY VIEW ================= */
          
          <div className="main-container">
            {Object.keys(categories).map((cat) => (
              <div key={cat} className="category-section">
                <h2>{cat}</h2>

                <div className="category-row">
                  {categories[cat].map((meal) => {
                    const id = meal.idMeal;
                    const { likes = 0, unlikes = 0, favorite = false } =
                      recipeStates[id] || {};

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
                          src={meal.strMealThumb}
                          alt={meal.strMeal}
                          className="recipe-image"
                        />

                        <h2 className="recipe-title">{meal.strMeal}</h2>

                        <button
                          className="watch-video-btn"
                          onClick={() => handleWatchVideo(meal)}
                        >
                          ▶ Watch Video
                        </button>

                        <div className="reaction-buttons">
                          <button className="like-btn" onClick={() => handleLike(id)}>
                            {recipeStates[id]?.userReaction === "like"
                              ? <FaThumbsUp style={{ color: "green", fontSize: "20px" }} />
                              : <FaRegThumbsUp style={{ fontSize: "20px" }} />}
                            <span> {likes}</span>
                          </button>

                          <button className="unlike-btn" onClick={() => handleUnlike(id)}>
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
                    );
                  })}
                </div>
              </div>
            ))}
          </div>


        )}

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