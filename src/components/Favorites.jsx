// src/components/Favorites.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../config/firbase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import {
  FaThumbsUp,
  FaRegThumbsUp,
  FaThumbsDown,
  FaRegThumbsDown,
  FaHeart,
  FaRegHeart,
} from "react-icons/fa";

import "../style/favorites.css";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [recipeStates, setRecipeStates] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [videoRecipe, setVideoRecipe] = useState(null);

  /* =====================================================
     FETCH FAVORITES (USER SPECIFIC 🔥 FIXED HERE)
  ===================================================== */
  useEffect(() => {
    let unsubFav = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFavorites([]);
        return;
      }

      // 🔥 USER BASED COLLECTION
      const favRef = collection(db, "users", user.uid, "favorites");

      unsubFav = onSnapshot(favRef, (snapshot) => {
        const favs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFavorites(favs);

        const favStates = {};
        favs.forEach((fav) => {
          favStates[fav.id] = {
            likes: 0,
            unlikes: 0,
            favorite: true,
            userReaction: "none",
          };
        });

        setRecipeStates(favStates);
      });
    });

    return () => {
      if (unsubFav) unsubFav();
      unsubAuth();
    };
  }, []);

  /* =====================================================
     VEG / NON-VEG
  ===================================================== */
  const isVeg = (meal) => {
    const nonVegKeywords = [
      "chicken", "mutton", "fish", "pork", "beef", "egg",
      "lamb", "shrimp", "crab", "bacon", "duck",
    ];

    const title = (meal.title || "").toLowerCase();
    return !nonVegKeywords.some((nv) => title.includes(nv));
  };

  /* =====================================================
     LIKE / UNLIKE (LOCAL ONLY)
  ===================================================== */
  const handleLike = (id) => {
    setRecipeStates((prev) => {
      const current = prev[id] || { likes: 0, unlikes: 0, userReaction: "none" };
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
      const current = prev[id] || { likes: 0, unlikes: 0, userReaction: "none" };
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

  /* =====================================================
     REMOVE FAVORITE (USER SPECIFIC 🔥 FIXED HERE)
  ===================================================== */
  const handleRemoveFavorite = async (id) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await deleteDoc(
        doc(db, "users", user.uid, "favorites", id)
      );

      setRecipeStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], favorite: false },
      }));
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  /* =====================================================
     INGREDIENTS MODAL
  ===================================================== */
  const openIngredients = async (meal) => {
    if (!meal.ingredients || meal.ingredients.length === 0) {
      try {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.id}`
        );

        const data = await res.json();

        if (data.meals) {
          const mealData = data.meals[0];

          const ingredients = Array.from({ length: 20 }, (_, i) => {
            const ing = mealData[`strIngredient${i + 1}`];
            const measure = mealData[`strMeasure${i + 1}`];
            return ing && ing.trim() ? `${ing} - ${measure}` : null;
          }).filter(Boolean);

          setSelectedRecipe({ ...meal, ingredients });
          return;
        }
      } catch (err) {
        console.error("Error fetching ingredients:", err);
      }
    }

    setSelectedRecipe(meal);
  };

  const closeIngredients = () => setSelectedRecipe(null);

  /* =====================================================
     VIDEO MODAL
  ===================================================== */
  const openVideo = (meal) => setVideoRecipe(meal);
  const closeVideo = () => setVideoRecipe(null);

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="favorites-page">
      <h2>❤️ Your Favorite Recipes</h2>

      {favorites.length === 0 ? (
        <p>No favorites yet. Go to Recipe Finder and add some ❤️</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((meal) => {
            const id = meal.id;

            const { likes = 0, unlikes = 0, favorite = true } =
              recipeStates[id] || {};

            return (
              <div key={id} className="recipe-card">
                <div className={`food-mark ${isVeg(meal) ? "veg" : "nonveg"}`}>
                  <div className="dot"></div>
                </div>

                <img src={meal.image} alt={meal.title} className="recipe-image" />

                <h2 className="recipe-title">{meal.title}</h2>

                <p className="recipe-info">
                  <b>Category:</b> {meal.category} <br />
                  <b>Country:</b> {meal.country || "N/A"}
                </p>

                {meal.youtube ? (
                  <button
                    onClick={() => openVideo(meal)}
                    className="video-button"
                  >
                    ▶ Watch Video
                  </button>
                ) : (
                  <div className="no-video">🎬 Video not available</div>
                )}

                <div className="reaction-buttons">
                  <button className="like-btn" onClick={() => handleLike(id)}>
                    {recipeStates[id]?.userReaction === "like" ? (
                      <FaThumbsUp style={{ color: "green", fontSize: "20px" }} />
                    ) : (
                      <FaRegThumbsUp style={{ fontSize: "20px" }} />
                    )}
                    <span> {likes}</span>
                  </button>

                  <button className="unlike-btn" onClick={() => handleUnlike(id)}>
                    {recipeStates[id]?.userReaction === "unlike" ? (
                      <FaThumbsDown style={{ color: "red", fontSize: "20px" }} />
                    ) : (
                      <FaRegThumbsDown style={{ fontSize: "20px" }} />
                    )}
                    <span> {unlikes}</span>
                  </button>

                  <button
                    className={`heart-btn ${favorite ? "active" : ""}`}
                    onClick={() => handleRemoveFavorite(id)}
                  >
                    {favorite ? (
                      <FaHeart style={{ color: "crimson", fontSize: "20px" }} />
                    ) : (
                      <FaRegHeart style={{ fontSize: "20px" }} />
                    )}
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
      )}

      {selectedRecipe && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={closeIngredients} className="close-button">
              ✖
            </button>

            <h2 className="modal-title">{selectedRecipe.title}</h2>

            <h3 className="modal-heading">Ingredients:</h3>

            <ul className="modal-list">
              {selectedRecipe.ingredients?.length ? (
                selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))
              ) : (
                <li>No ingredients available</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {videoRecipe && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={closeVideo} className="close-button">
              ✖
            </button>

            <h2 className="modal-title">{videoRecipe.title}</h2>

            <div className="video-wrapper">
              <iframe
                width="100%"
                height="300"
                src={videoRecipe.youtube.replace("watch?v=", "embed/")}
                title={videoRecipe.title}
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
