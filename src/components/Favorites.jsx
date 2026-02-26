// src/components/Favorites.jsx
import React, { useEffect, useMemo, useState } from "react";
import { db, auth } from "../config/firbase";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";


import { onAuthStateChanged } from "firebase/auth";

import {
  FaThumbsUp,
  FaRegThumbsUp,
  FaThumbsDown,
  FaRegThumbsDown,
  FaHeart,
  FaRegHeart,
  FaComment,
} from "react-icons/fa";
import Swal from "sweetalert2";

import "../style/favorites.css";
import {
  handleLike as applyLikeReaction,
  handleUnlike as applyUnlikeReaction,
  subscribeRecipeReactions,
} from "../services/recipeReactions";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [recipeStates, setRecipeStates] = useState({});
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [videoRecipe, setVideoRecipe] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [chefComments, setChefComments] = useState({});
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
    if (!meal?.isChefRecipe) return null;
    if (typeof meal.id === "string" && meal.id.startsWith("chef_")) {
      return meal.id.replace("chef_", "");
    }
    return meal.id || null;
  };

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

        setRecipeStates((prev) => {
          const next = {};

          favs.forEach((fav) => {
            const existing = prev[fav.id] || {};
            next[fav.id] = {
              likes: existing.likes || 0,
              unlikes: existing.unlikes || 0,
              favorite: true,
              userReaction: existing.userReaction || "none",
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
     LIKE / UNLIKE
  ===================================================== */
  const handleLike = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await applyLikeReaction({ recipeId: id, userId: user.uid });
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleUnlike = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
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

  const reactionRecipeIds = useMemo(
    () => favorites.map((fav) => fav.id).filter(Boolean),
    [favorites]
  );

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
            favorite: true,
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
  }, [reactionRecipeIds]);

  useEffect(() => {
    const unsubscribers = [];

    favorites.forEach((meal) => {
      if (!meal.isChefRecipe) return;

      const recipeId =
        typeof meal.id === "string" && meal.id.startsWith("chef_")
          ? meal.id.replace("chef_", "")
          : meal.id;

      if (!recipeId) return;

      const unsubscribe = onSnapshot(doc(db, "recipes", recipeId), (snap) => {
        const comments = snap.exists() ? snap.data()?.comments || [] : [];
        setChefComments((prev) => ({ ...prev, [meal.id]: comments }));
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") unsubscribe();
      });
    };
  }, [favorites]);

  const handleAddComment = async (meal) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login first");
      return;
    }

    const commentText = commentInputs[meal.id]?.trim();
    if (!commentText) return;

    const recipeId = getChefRecipeDocId(meal);

    if (!recipeId) return;

    try {
      const newComment = {
        userId: user.uid,
        user: getCurrentUserCommentName(user),
        text: commentText,
        createdAt: new Date(),
      };

      await updateDoc(doc(db, "recipes", recipeId), {
        comments: arrayUnion(newComment),
      });

      setCommentInputs((prev) => ({ ...prev, [meal.id]: "" }));
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  const handleEditComment = async (meal, comments, commentIndex) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login first");
      return;
    }

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

    const recipeId = getChefRecipeDocId(meal);
    if (!recipeId) return;

    const updatedComments = comments.map((comment, idx) =>
      idx === commentIndex ? { ...comment, text: result.value.trim() } : comment
    );

    try {
      await updateDoc(doc(db, "recipes", recipeId), {
        comments: updatedComments,
      });
      setChefComments((prev) => ({ ...prev, [meal.id]: updatedComments }));
      Swal.fire({ icon: "success", title: "Updated", timer: 1000, showConfirmButton: false });
    } catch (error) {
      console.error("Edit comment error:", error);
      Swal.fire("Error", "Failed to update comment", "error");
    }
  };

  const handleDeleteComment = async (meal, comments, commentIndex) => {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire("Please login first");
      return;
    }

    if (!comments[commentIndex]) return;
    if (!canManageComment(comments[commentIndex])) {
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

    const recipeId = getChefRecipeDocId(meal);
    if (!recipeId) return;

    const updatedComments = comments.filter((_, idx) => idx !== commentIndex);

    try {
      await updateDoc(doc(db, "recipes", recipeId), {
        comments: updatedComments,
      });
      setChefComments((prev) => ({ ...prev, [meal.id]: updatedComments }));
      Swal.fire({ icon: "success", title: "Deleted", timer: 1000, showConfirmButton: false });
    } catch (error) {
      console.error("Delete comment error:", error);
      Swal.fire("Error", "Failed to delete comment", "error");
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
  const openVideo = (meal) => {
    if (!meal.youtube) {
      const isChefRecipe = Boolean(meal.isChefRecipe);
      Swal.fire({
        icon: "info",
        title: "Video Not Available",
        text: isChefRecipe
          ? "The chef has not uploaded a video for this recipe yet."
          : "Sorry, we couldn't find a video for this recipe.",
      });
      return;
    }

    setVideoRecipe(meal);
  };
  const closeVideo = () => setVideoRecipe(null);

  const handleShowInstructions = async (meal) => {
    if (!meal?.isChefRecipe) return;

    let instructions = (meal.instructions || meal.steps || "").trim();

    if (!instructions) {
      try {
        const recipeId = getChefRecipeDocId(meal);
        if (recipeId) {
          const recipeSnap = await getDoc(doc(db, "recipes", recipeId));
          if (recipeSnap.exists()) {
            instructions = (recipeSnap.data()?.steps || "").trim();
          }
        }
      } catch (error) {
        console.error("Error loading instructions:", error);
      }
    }

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
          <span>${meal.title || "Recipe"} - Instructions</span>
        </div>
      `,
      html: `<div style="text-align:left; margin-top:10px;">${formattedSteps}</div>`,
      confirmButtonText: "Close",
      width: "600px",
    });
  };

  const getChefUserId = async (meal) => {
    if (meal.userId) return meal.userId;
    if (!meal.isChefRecipe) return null;

    const recipeId =
      typeof meal.id === "string" && meal.id.startsWith("chef_")
        ? meal.id.replace("chef_", "")
        : meal.id;

    if (!recipeId) return null;

    const recipeSnap = await getDoc(doc(db, "recipes", recipeId));
    if (!recipeSnap.exists()) return null;

    return recipeSnap.data()?.userId || null;
  };

  const handleChefDetails = async (meal) => {
    try {
      const chefUserId = await getChefUserId(meal);
      if (!chefUserId) {
        Swal.fire("Chef information not available");
        return;
      }

      const userRef = doc(db, "users", chefUserId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Swal.fire("Chef profile not found");
        return;
      }

      const userData = userSnap.data();
      const profile = userData.profile || {};
      const preferences = userData.preferences || {};

      const avatar = profile.avatar || "https://via.placeholder.com/100?text=Chef";

      Swal.fire({
        width: "650px",
        confirmButtonText: "Close",
        customClass: {
          popup: "chef-popup",
        },
        html: `
        <div class="chef-card">
          <div class="chef-header">
            <img src="${avatar}" class="chef-avatar" />
            <div>
              <h2>${profile.name || "Chef"}</h2>
              <span class="chef-badge">
                ${profile.cookingLevel || "Community Chef"}
              </span>
            </div>
          </div>

          <div class="chef-section">
            <h3>Chef Information</h3>
            <div class="chef-grid">
              <div><strong>Email:</strong> ${profile.email || "-"}</div>
              <div><strong>Location:</strong> ${profile.location || "-"}</div>
              <div><strong>Favorite Cuisine:</strong> ${profile.favoriteCuisine || "-"}</div>
              <div><strong>Measurement Unit:</strong> ${preferences.measurementUnit || "-"}</div>
            </div>
          </div>

          ${profile.bio
            ? `
          <div class="chef-section">
            <h3>About Chef</h3>
            <div class="chef-bio">${profile.bio}</div>
          </div>
          `
            : ""
          }

          <div class="chef-section">
            <h3>Preferences</h3>

            <div class="chef-preference-block">
              <p>Dietary Restrictions</p>
              <div class="chef-tags">
                ${(preferences.dietaryRestrictions || []).length
            ? preferences.dietaryRestrictions
              .map((tag) => `<span class="chef-tag">${tag}</span>`)
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
              .map((tag) => `<span class="chef-tag">${tag}</span>`)
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

  const handleRemoveFavorite = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "favorites", id));
      setRecipeStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], favorite: false },
      }));
    } catch (err) {
      console.error("Remove favorite error:", err);
    }
  };

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
            const comments = meal.isChefRecipe
              ? chefComments[id] || meal.comments || []
              : [];

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
                  )}{" "}
                  <br />
                  <b>Country:</b> {meal.country || "N/A"}
                </p>

                <button
                  onClick={() => openVideo(meal)}
                  className="video-button"
                >
                  Watch Video
                </button>

                <div className="reaction-buttons">
                  <button className="like-btn" onClick={() => handleReaction(id, "like")}>
                    {recipeStates[id]?.userReaction === "like" ? (
                      <FaThumbsUp style={{ color: "green", fontSize: "20px" }} />
                    ) : (
                      <FaRegThumbsUp style={{ fontSize: "20px" }} />
                    )}
                    <span> {likes}</span>
                  </button>

                  <button className="unlike-btn" onClick={() => handleReaction(id, "unlike")}>
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
                      <span> {comments.length || 0}</span>
                    </button>
                  )}
                </div>

                {meal.isChefRecipe && showComments[id] && (
                  <div className="cookbook-comments-area">
                    <div className="cookbook-comment-list">
                      {comments.length > 0 ? (
                        comments.map((comment, index) => (
                          <div key={index} className="cookbook-comment-item">
                            <div className="cookbook-comment-content">
                              <div className="cookbook-comment-author">
                                {comment.user || "User"}
                              </div>

                              <div className="cookbook-comment-message">
                                {comment.text}
                              </div>
                            </div>

                            {canManageComment(comment) && (
                              <div className="cookbook-comment-actions">
                                <button
                                  className="cookbook-comment-edit"
                                  onClick={() => handleEditComment(meal, comments, index)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="cookbook-comment-delete"
                                  onClick={() => handleDeleteComment(meal, comments, index)}
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


