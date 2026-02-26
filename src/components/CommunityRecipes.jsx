import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { FaUsers } from "react-icons/fa";
import { db, auth } from "../config/firbase.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  handleLike as applyLikeReaction,
  handleUnlike as applyUnlikeReaction,
  subscribeRecipeReactions,
} from "../services/recipeReactions";
import Swal from "sweetalert2";
import "../style/communityRecipes.css";
import { FaComment, FaTrash, FaEdit, FaPlus, FaFilter, FaFire, FaImage, FaUtensils, FaYoutube, FaThumbsUp, FaRegThumbsUp, FaThumbsDown, FaRegThumbsDown } from "react-icons/fa";
import { MdClose, MdFastfood, MdOutlineRestaurantMenu } from "react-icons/md";

const toReactionRecipeId = (recipeId) => `chef_${recipeId}`;
const DEFAULT_AVATAR_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUmgrBOv_cpwabmIhfJ3-PWW0XOW6fhyjqEQ&s";

export default function CommunityRecipes() {
  const recipeRef = collection(db, "recipes");

  /* ================= STATES ================= */
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recipeStates, setRecipeStates] = useState({});
  const [creatorAvatars, setCreatorAvatars] = useState({});
  const communityRecipes = recipes;
 const viewChefProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      Swal.fire("User not found");
      return;
    }

    const data = userDoc.data();
    const profile = data.profile || {};
    const preferences = data.preferences || {};

    const avatar =
      profile.avatar ||
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUmgrBOv_cpwabmIhfJ3-PWW0XOW6fhyjqEQ&s";

    const dietaryTags =
      preferences.dietaryRestrictions?.length > 0
        ? preferences.dietaryRestrictions
            .map(item => `<span class="chef-tag">${item}</span>`)
            .join("")
        : `<span class="chef-tag-single">None specified</span>`;

    const allergyTags =
      preferences.allergies?.length > 0
        ? preferences.allergies
            .map(item => `<span class="chef-tag">${item}</span>`)
            .join("")
        : `<span class="chef-tag-single">No allergies</span>`;

    Swal.fire({
      width: 700,
      padding: 0,
      showCloseButton: true,
      confirmButtonText: "Close",
      customClass: {
        popup: "chef-popup",
      },
      html: `
        <div class="chef-card">

          <!-- Header -->
          <div class="chef-header">
            <img src="${avatar}" class="chef-avatar"/>
            <div>
              <h2>${profile.name || "Unknown Chef"}</h2>
              <p class="chef-badge">Home Chef</p>
            </div>
          </div>

          <!-- Info -->
          <div class="chef-section">
            <h3>Basic Information</h3>
            <div class="chef-grid">
              <div><strong>Email:</strong> ${profile.email || "-"}</div>
              <div><strong>Location:</strong> ${profile.location || "-"}</div>
              <div><strong>Cooking Level:</strong> ${profile.cookingLevel || "-"}</div>
              <div><strong>Favorite Cuisine:</strong> ${profile.favoriteCuisine || "-"}</div>
            </div>
          </div>

          <!-- Bio -->
          <div class="chef-section">
            <h3>About Me</h3>
            <p class="chef-bio">${profile.bio || "No bio available."}</p>
          </div>

          <!-- Preferences -->
          <div class="chef-section">
            <h3>Cooking Preferences</h3>

            <div class="chef-preference-block">
              <p><strong>Dietary Restrictions:</strong></p>
              <div class="chef-tags">${dietaryTags}</div>
            </div>

            <div class="chef-preference-block">
              <p><strong>Allergies:</strong></p>
              <div class="chef-tags">${allergyTags}</div>
            </div>

            <div class="chef-preference-block">
              <p><strong>Measurement Unit:</strong> ${preferences.measurementUnit || "Not specified"}</p>
            </div>

            <div class="chef-preference-block">
              <p><strong>Language:</strong> ${preferences.language || "Not specified"}</p>
            </div>

          </div>

        </div>
      `,
    });

  } catch (error) {
    console.error("Error viewing chef profile:", error);
    Swal.fire("Error", "Failed to load chef profile", "error");
  }
};


  const perPage = 6;

  const [form, setForm] = useState({
    title: "",
    ingredients: "",
    steps: "",
    category: "Veg",
    imageUrl: "",
    videoUrl: "",
    difficulty: "Easy",
    prepTime: "",
    servings: "",
  });

  /* ================= REAL-TIME RECIPES ================= */
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "recipes"),
      (snap) => {
        const recipesData = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .sort(
            (a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)
          );

        setRecipes(recipesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching recipes:", error);
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch recipes",
        });
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadCreatorAvatars = async () => {
      const uniqueUserIds = [...new Set(recipes.map((recipe) => recipe.userId).filter(Boolean))];
      if (uniqueUserIds.length === 0) {
        if (!isCancelled) setCreatorAvatars({});
        return;
      }

      try {
        const avatarEntries = await Promise.all(
          uniqueUserIds.map(async (userId) => {
            const userSnap = await getDoc(doc(db, "users", userId));
            const avatar = userSnap.exists() ? userSnap.data()?.profile?.avatar || "" : "";
            return [userId, avatar];
          })
        );

        if (!isCancelled) {
          setCreatorAvatars(Object.fromEntries(avatarEntries));
        }
      } catch (error) {
        console.error("Error loading creator avatars:", error);
      }
    };

    loadCreatorAvatars();
    return () => {
      isCancelled = true;
    };
  }, [recipes]);

  const reactionRecipeIds = useMemo(() => {
    return communityRecipes
      .map((recipe) => recipe.id)
      .filter(Boolean)
      .map(toReactionRecipeId);
  }, [communityRecipes]);

 // AFTER - don't clear state when no user, and use onAuthStateChanged
useEffect(() => {
    let unsubReactions = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user || reactionRecipeIds.length === 0) return;

      unsubReactions = subscribeRecipeReactions(reactionRecipeIds, (reactionMap) => {
        setRecipeStates((prev) => {
          const next = { ...prev };
          communityRecipes.forEach((recipe) => {
            const id = recipe.id;
            if (!id) return;
            const reactionId = toReactionRecipeId(id);
            const entry = reactionMap[reactionId] || {
              likes: 0, unlikes: 0, likedBy: [], unlikedBy: [],
            };
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
            };
          });
          return next;
        });
      });
    });

    return () => {
      if (typeof unsubReactions === "function") unsubReactions();
      unsubAuth();
    };
  }, [reactionRecipeIds, communityRecipes]);

  /* ================= ADD/UPDATE RECIPE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login to add recipes",
      });
      return;
    }

    // Validate YouTube URL
    if (form.videoUrl) {
      const youtubeRegex =
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeRegex.test(form.videoUrl)) {
        Swal.fire({
          icon: "error",
          title: "Invalid YouTube URL",
          text: "Please enter a valid YouTube video link",
        });
        return;
      }
    }

    // Validate Image URL
    if (form.imageUrl) {
      const urlRegex = /^(https?:\/\/).+$/;
      if (!urlRegex.test(form.imageUrl)) {
        Swal.fire({
          icon: "error",
          title: "Invalid Image URL",
          text: "Please enter a valid image URL",
        });
        return;
      }
    }

    const finalCategory =
      form.category === "Custom" ? customCategory : form.category;

    try {
      setLoading(true);

      // 🔥 Common fields (used in both add & update)
      const baseData = {
        title: form.title,
        ingredients: form.ingredients,
        steps: form.steps,
        category: finalCategory,
        image: form.imageUrl || "",
        video: form.videoUrl || "",
        difficulty: form.difficulty,
        prepTime: form.prepTime,
        servings: form.servings,
        updatedAt: serverTimestamp(),
      };

      if (editingRecipe) {
        // 🔥 Fetch latest user profile
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        let creatorName = "Unknown Chef";
        let creatorAvatar = "";
        let creatorCountry = "";

        if (userSnap.exists()) {
          const userData = userSnap.data();
          creatorName = userData?.profile?.name || "Unknown Chef";
          creatorAvatar = userData?.profile?.avatar || "";
          creatorCountry = userData?.profile?.location || "";
        }

        await updateDoc(doc(db, "recipes", editingRecipe.id), {
          ...baseData,
          createdBy: creatorName,
          creatorAvatar: creatorAvatar,
          creatorCountry,
        });

        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Recipe has been updated",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      else {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        let creatorName = "Unknown Chef";
        let creatorAvatar = "";
        let creatorCountry = "";

        if (userSnap.exists()) {
          const userData = userSnap.data();
          creatorName = userData?.profile?.name || "Unknown Chef";
          creatorAvatar = userData?.profile?.avatar || "";
          creatorCountry = userData?.profile?.location || "";
        }

        await addDoc(recipeRef, {
          ...baseData,
          userId: user.uid,
          createdBy: creatorName,
          creatorAvatar: creatorAvatar,
          creatorCountry,
          isUploaded: false,
          createdAt: serverTimestamp(),
          likes: 0,
          unlikes: 0,
          comments: [],
          likedBy: [],
          unlikedBy: [],
        });

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Recipe added successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      }

      resetForm();

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };



  /* ================= DELETE ================= */
  const deleteRecipe = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "recipes", id));
        Swal.fire('Deleted!', 'Recipe has been deleted.', 'success');
      } catch {
        Swal.fire('Error!', 'Failed to delete recipe.', 'error');
      }
    }
  };

  /* ================= UPLOAD TO HOME SEARCH ================= */
  const toggleUploadRecipe = async (recipe) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateDoc(doc(db, "recipes", recipe.id), {
        isUploaded: !recipe.isUploaded,
        uploadedAt: !recipe.isUploaded ? serverTimestamp() : null,
      });

      Swal.fire({
        icon: "success",
        title: recipe.isUploaded ? "Removed from Home Search" : "Uploaded to Home Search",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error toggling upload:", error);
      Swal.fire("Error", "Failed to update upload status", "error");
    }
  };

  /* ================= LIKE ================= */
  const likeRecipe = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await applyLikeReaction({ recipeId: toReactionRecipeId(id), userId: user.uid });
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const unlikeRecipe = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await applyUnlikeReaction({ recipeId: toReactionRecipeId(id), userId: user.uid });
    } catch (error) {
      console.error("Error updating unlike:", error);
    }
  };


  /* ================= COMMENT ================= */
  const deleteComment = async (recipe, commentIndex) => {
    const result = await Swal.fire({
      title: "Delete comment?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    try {
      const recipeDoc = doc(db, "recipes", recipe.id);

      await updateDoc(recipeDoc, {
        comments: (recipe.comments || []).filter((_, index) => index !== commentIndex),
      });

      Swal.fire({ icon: "success", title: "Deleted", timer: 1000, showConfirmButton: false });
    } catch (error) {
      console.error("Error deleting comment:", error);
      Swal.fire("Error", "Failed to delete comment", "error");
    }
  };
  const editComment = async (recipe, commentIndex) => {
    const commentToEdit = recipe.comments?.[commentIndex];
    if (!commentToEdit) return;

    const result = await Swal.fire({
      title: "Edit Comment",
      input: "text",
      inputValue: commentToEdit.text || "",
      showCancelButton: true,
      confirmButtonText: "Update",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Comment cannot be empty";
        return null;
      },
    });

    if (!result.isConfirmed) return;

    try {
      const updatedComments = (recipe.comments || []).map((c, index) =>
        index === commentIndex
          ? { ...c, text: result.value.trim() }
          : c
      );

      await updateDoc(doc(db, "recipes", recipe.id), {
        comments: updatedComments,
      });
      Swal.fire({ icon: "success", title: "Updated", timer: 1000, showConfirmButton: false });
    } catch (error) {
      console.error("Error editing comment:", error);
      Swal.fire("Error", "Failed to update comment", "error");
    }
  };

  const addComment = async (id) => {
    const text = commentText[id]?.trim();
    if (!text) return;

    try {
      await updateDoc(doc(db, "recipes", id), {
        comments: arrayUnion({
          userId: auth.currentUser.uid,
          user: auth.currentUser.email.split('@')[0],
          text,
          timestamp: new Date().toISOString(),
        }),
      });


      setCommentText({ ...commentText, [id]: "" });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };
  /* ================= YOUTUBE FUNCTIONS ================= */
  const getYoutubeVideoId = (url) => {
    if (!url) return null;

    try {
      const regExp =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const getYoutubeThumbnail = (url) => {
    const videoId = getYoutubeVideoId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;
  };


  /* ================= EDIT RECIPE ================= */
  const editRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setForm({
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      category: ["Veg", "NonVeg", "Dessert"].includes(recipe.category) ? recipe.category : "Custom",
      imageUrl: recipe.image || "",
      videoUrl: recipe.video || "",
      difficulty: recipe.difficulty || "Easy",
      prepTime: recipe.prepTime || "",
      servings: recipe.servings || "",
    });

    if (recipe.category && !["Veg", "NonVeg", "Dessert"].includes(recipe.category)) {
      setCustomCategory(recipe.category);
    }

    setShowModal(true);
  };

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setForm({
      title: "",
      ingredients: "",
      steps: "",
      category: "Veg",
      imageUrl: "",
      videoUrl: "",
      difficulty: "Easy",
      prepTime: "",
      servings: "",
    });
    setCustomCategory("");
    setEditingRecipe(null);
    setShowModal(false);
  };

  /* ================= FILTER & PAGINATION ================= */
  const filtered = recipes.filter(r => {
    const matchesCategory = category === "All" ? true : r.category === category;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pages = Math.ceil(filtered.length / perPage);
  const display = filtered.slice((page - 1) * perPage, page * perPage);

  /* ================= RENDER ================= */
  return (
    <div className="cookbook-container">
      {/* Header */}
      <header className="cookbook-header">
        <div className="cookbook-header-content">
          <h1 className="cookbook-title">
            <FaUtensils /> My Recipe Collection
          </h1>
          <p className="cookbook-subtitle">Create, share, and manage your culinary creations</p>
        </div>

        <div className="cookbook-header-actions">
          <button
            className="cookbook-add-btn"
            onClick={() => setShowModal(true)}
          >
            <FaPlus /> Add Recipe
          </button>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="cookbook-control-bar">
        <div className="cookbook-search-wrapper">
          <input
            type="text"
            placeholder="Search recipes..."
            className="cookbook-search-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="cookbook-filter-wrapper">
          <div className="cookbook-filter-group">
            <FaFilter className="cookbook-filter-icon" />
            <select
              className="cookbook-category-dropdown"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Veg">Vegetarian</option>
              <option value="NonVeg">Non-Vegetarian</option>
              <option value="Dessert">Dessert</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="cookbook-loader">
          <div className="cookbook-spinner"></div>
          <p>Loading recipes...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="cookbook-empty">
          <MdOutlineRestaurantMenu className="cookbook-empty-icon" />
          <h3>No recipes found</h3>
          <p>Create your first recipe to get started!</p>
          <button
            className="cookbook-primary-btn"
            onClick={() => setShowModal(true)}
          >
            <FaPlus /> Add Your First Recipe
          </button>
        </div>
      )}

      {/* Recipe Grid */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="cookbook-grid">
            {display.map(recipe => {
              const id = recipe.id;
              const { likes = 0, unlikes = 0 } = recipeStates[id] || {};
              const userReaction = recipeStates[id]?.userReaction || "none";

              return (
              <div key={id} className="cookbook-card">
                {/* Recipe Image */}
                <div className="cookbook-card-image">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} />
                  ) : recipe.video ? (
                    <iframe
                      width="100%"
                      height="200"
                      src={`https://www.youtube.com/embed/${getYoutubeVideoId(recipe.video)}`}
                      title="YouTube video"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  ) : (<div className="cookbook-no-image">
                    <FaUtensils />
                  </div>
                  )}
                  <div className="cookbook-badge">
                    <span className={`cookbook-difficulty ${recipe.difficulty?.toLowerCase()}`}>
                      {recipe.difficulty || 'Easy'}
                    </span>
                  </div>
                  {recipe.video && (
                    <a
                      href={recipe.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cookbook-video-link"
                    >
                      <FaYoutube /> Watch Video
                    </a>
                  )}
                </div>

                <div className="cookbook-card-content">
                  {/* Recipe Header */}
                  <div className="cookbook-card-header">
                    <div>
                      <h3 className="cookbook-card-title">{recipe.title}</h3>
                      {/* Created By */}
                      <div
                        className="cookbook-creator"
                        style={{ cursor: "pointer" }}
                        onClick={() => viewChefProfile(recipe.userId)}
                      >
                        <img
                          src={recipe.creatorAvatar || creatorAvatars[recipe.userId] || DEFAULT_AVATAR_URL}
                          alt={recipe.createdBy || "Chef"}
                          className="cookbook-creator-avatar"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR_URL;
                          }}
                        />
                        <span className="cookbook-creator-name">
                          By {recipe.createdBy || "Unknown Chef"}
                        </span>
                      </div>

                      <div className="cookbook-card-meta">
                        <span className="cookbook-category-tag">
                          <MdFastfood /> {recipe.category}
                        </span>
                        <div className="cookbook-meta-trailing">
                        {recipe.prepTime && (
                          <span className="cookbook-time-tag">
                            ⏱️ {recipe.prepTime}
                          </span>
                        )}
                        {recipe.servings && (
                          <span className="cookbook-serving-tag">
                            <FaUsers /> {recipe.servings} servings
                          </span>
                        )}
                        </div>
                      </div>
                    </div>
                    <div className="cookbook-card-actions">
                      <button
                        className={`cookbook-upload-chip ${recipe.isUploaded ? "active" : ""}`}
                        onClick={() => toggleUploadRecipe(recipe)}
                        title={recipe.isUploaded ? "Remove from Home search" : "Upload to Home search"}
                        aria-label={recipe.isUploaded ? "Remove from Home search" : "Upload to Home search"}
                      >
                        <FaFire />
                        <span>{recipe.isUploaded ? "Unpublish" : "Publish"}</span>
                      </button>
                      <button
                        className="cookbook-icon-btn cookbook-edit-btn"
                        onClick={() => editRecipe(recipe)}
                        title="Edit recipe"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="cookbook-icon-btn cookbook-delete-btn"
                        onClick={() => deleteRecipe(recipe.id)}
                        title="Delete recipe"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* Recipe Stats */}
                  <div className="cookbook-stats">
                    <button
                      className={`cookbook-like-btn ${userReaction === "like" ? "liked" : ""}`}
                      onClick={() => likeRecipe(id)}
                    >
                      {userReaction === "like"
                        ? <FaThumbsUp style={{ color: "green", fontSize: "20px" }} />
                        : <FaRegThumbsUp style={{ fontSize: "20px" }} />}
                      <span> {likes}</span>
                    </button>

                    <button
                      className={`cookbook-unlike-btn ${userReaction === "unlike" ? "unliked" : ""}`}
                      onClick={() => unlikeRecipe(id)}
                    >
                      {userReaction === "unlike"
                        ? <FaThumbsDown style={{ color: "red", fontSize: "20px" }} />
                        : <FaRegThumbsDown style={{ fontSize: "20px" }} />}
                      <span> {unlikes}</span>
                    </button>

                    <button
                      className="cookbook-comment-btn"
                      onClick={() => setShowComments({
                        ...showComments,
                        [id]: !showComments[id]
                      })}
                    >
                      <FaComment /> {recipe.comments?.length || 0}
                    </button>
                  </div>

                  {/* Ingredients Preview */}
                  <div className="cookbook-action-buttons">
                    <button
                      className="cookbook-show-ingredients-btn"
                      onClick={() =>
                        Swal.fire({
                          title: `
                      <div style="display:flex; align-items:center; gap:10px; justify-content:center;">
                        <span style="font-size:28px;">🥗</span>
                        <span>${recipe.title} - Ingredients</span>
                      </div>
                    `,
                          html: `
                      <div style="text-align:left; margin-top:10px;">
                        ${recipe.ingredients
                              .split("\n")
                              .map(item => `• ${item}`)
                              .join("<br>")}
                            </div>
                          `,
                          confirmButtonText: "Close",
                          width: "520px",
                          showClass: {
                            popup: "animate__animated animate__fadeInUp"
                          }
                        })
                      }
                    >
                      Show Ingredients
                    </button>

                    <button
                      className="cookbook-show-instructions-btn"
                      onClick={() =>
                        Swal.fire({
                          title: `
        <div style="display:flex; align-items:center; gap:10px; justify-content:center;">
          <span style="font-size:28px;">📖</span>
          <span>${recipe.title} - Instructions</span>
        </div>
      `,
                          html: `
        <div style="text-align:left; margin-top:10px;">
          ${recipe.steps
                              .split("\n")
                              .map((step, index) => `<b>Step ${index + 1}:</b> ${step}`)
                              .join("<br><br>")}
        </div>
      `,
                          confirmButtonText: "Close",
                          width: "600px",
                          showClass: {
                            popup: "animate__animated animate__fadeInUp"
                          }
                        })
                      }
                    >
                      Show Instructions
                    </button>

                  </div>

                  {/* Comments Section */}
                  {showComments[id] && (
                    <div className="cookbook-comments-area">
                      <div className="cookbook-comment-form">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          className="cookbook-comment-field"
                          value={commentText[id] || ""}
                          onChange={(e) => setCommentText({
                            ...commentText,
                            [id]: e.target.value
                          })}
                          onKeyDown={(e) => e.key === 'Enter' && addComment(id)}
                        />
                        <button
                          className="cookbook-submit-comment"
                          onClick={() => addComment(id)}
                        >
                          Send
                        </button>
                      </div>

                      <div className="cookbook-comments-list">
                        {recipe.comments?.map((comment, index) => (
                          <div key={index} className="cookbook-comment-item">
                            <div>
                              <span className="cookbook-comment-author">
                                {comment.user}:
                              </span>
                              <span className="cookbook-comment-message">
                                {comment.text}
                              </span>
                            </div>

                            {comment.userId === auth.currentUser?.uid && (
                              <div className="cookbook-comment-actions">
                                <button
                                  onClick={() => editComment(recipe, index)}
                                  className="cookbook-comment-edit"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteComment(recipe, index)}
                                  className="cookbook-comment-delete"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="cookbook-pagination">
              <button
                className="cookbook-page-nav"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>

              <div className="cookbook-page-numbers">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  let pageNum;
                  if (pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pages - 2) {
                    pageNum = pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={i}
                      className={`cookbook-page-btn ${page === pageNum ? 'cookbook-page-active' : ''}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                className="cookbook-page-nav"
                disabled={page === pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Recipe Modal */}
      {showModal && (
        <div className="cookbook-modal-overlay">
          <div className="cookbook-modal">
            <div className="cookbook-modal-header">
              <h2>{editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</h2>
              <button
                className="cookbook-modal-close"
                onClick={resetForm}
              >
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="cookbook-form">
              {/* Form Grid */}
              <div className="cookbook-form-grid">
                <div className="cookbook-field-group">
                  <label>Recipe Title *</label>
                  <input
                    type="text"
                    className="cookbook-field"
                    placeholder="Enter recipe title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="cookbook-field-group">
                  <label>Category</label>
                  <select
                    className="cookbook-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Veg">Vegetarian</option>
                    <option value="NonVeg">Non-Vegetarian</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Custom">Custom</option>
                  </select>

                  {form.category === "Custom" && (
                    <input
                      type="text"
                      className="cookbook-field"
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="cookbook-field-group">
                  <label>Difficulty Level</label>
                  <select
                    className="cookbook-select"
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="cookbook-field-group">
                  <label>Preparation Time</label>
                  <input
                    type="text"
                    className="cookbook-field"
                    placeholder="e.g., 30 minutes"
                    value={form.prepTime}
                    onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
                  />
                </div>

                <div className="cookbook-field-group">
                  <label>Servings</label>
                  <input
                    type="text"
                    className="cookbook-field"
                    placeholder="e.g., 4"
                    value={form.servings}
                    onChange={(e) => setForm({ ...form, servings: e.target.value })}
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="cookbook-field-group">
                <label>
                  <FaImage /> Image URL
                </label>
                <input
                  type="url"
                  className="cookbook-field"
                  placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
                <small className="cookbook-field-hint">Provide a direct link to an image</small>
                {form.imageUrl && (
                  <div className="cookbook-url-preview">
                    <img src={form.imageUrl} alt="Preview" className="cookbook-preview-img" />
                  </div>
                )}
              </div>

              {/* YouTube URL */}
              <div className="cookbook-field-group">
                <label>
                  <FaYoutube /> YouTube Video URL
                </label>
                <input
                  type="url"
                  className="cookbook-field"
                  placeholder="Enter YouTube video link (e.g., https://youtube.com/watch?v=...)"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                />
                <small className="cookbook-field-hint">Provide a YouTube video link</small>
                {form.videoUrl && getYoutubeThumbnail(form.videoUrl) && (
                  <div className="cookbook-url-preview">
                    <img
                      src={getYoutubeThumbnail(form.videoUrl)}
                      alt="YouTube Preview"
                      className="cookbook-preview-img"
                    />
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div className="cookbook-field-group">
                <label>Ingredients *</label>
                <textarea
                  className="cookbook-textarea"
                  placeholder="List ingredients (one per line)"
                  value={form.ingredients}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              {/* Steps */}
              <div className="cookbook-field-group">
                <label>Instructions *</label>
                <textarea
                  className="cookbook-textarea"
                  placeholder="Step-by-step instructions"
                  value={form.steps}
                  onChange={(e) => setForm({ ...form, steps: e.target.value })}
                  rows={5}
                  required
                />
              </div>

              {/* Form Actions */}
              <div className="cookbook-form-actions">
                <button
                  type="button"
                  className="cookbook-secondary-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cookbook-primary-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingRecipe ? 'Update Recipe' : 'Add Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
