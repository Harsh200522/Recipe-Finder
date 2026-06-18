// src/pages/ChefProfile.jsx
import { increment } from "firebase/firestore";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  setDoc,
  deleteDoc
} from "firebase/firestore";

import { db, auth } from "../config/firbase";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaUsers, FaUtensils, FaHeart, FaRegHeart,
  FaThumbsUp, FaRegThumbsUp, FaThumbsDown, FaRegThumbsDown,
  FaComment, FaYoutube,
} from "react-icons/fa";
import { MdFastfood, MdVerified } from "react-icons/md";
import Swal from "sweetalert2";
import {
  handleLike as applyLikeReaction,
  handleUnlike as applyUnlikeReaction,
  subscribeRecipeReactions,
} from "../services/recipeReactions";
import ServingCalculator from "./ServingCalculator";
import "../style/chefprofile.css";

const DEFAULT_AVATAR =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUmgrBOv_cpwabmIhfJ3-PWW0XOW6fhyjqEQ&s";

const toReactionRecipeId = (recipeId) => `chef_${recipeId}`;

/** 
 * Utility to format numbers as 1.2K, 45.8K, 1.3M 
 */
const formatCount = (num) => {
  if (!num || num < 0) return 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num;
};

export default function ChefProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [chef, setChef] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [indexError, setIndexError] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followingMap, setFollowingMap] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  // Instagram-style modals
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [recipeStates, setRecipeStates] = useState({});
  const [servingRecipe, setServingRecipe] = useState(null);
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [chefComments, setChefComments] = useState({});
  const [userAvatars, setUserAvatars] = useState({});
  const [visibleReplies, setVisibleReplies] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  useEffect(() => {
    setRecipeStates({});
    setRecipes([]);
    setChefComments({});
    setFavoriteIds(new Set());
    setVisibleCount(6);
  }, [userId]);
  /* ── STATS CALCULATION ── */
  const totalLikes = useMemo(() => {
    return recipes.reduce((acc, recipe) => {
      return acc + (recipeStates[recipe.id]?.likes || 0);
    }, 0);
  }, [recipeStates, recipes]); // also depend on recipes

  const totalSaves = useMemo(() => {
    // Note: This relies on your recipe objects having a saveCount field from Firestore
    return recipes.reduce((acc, curr) => acc + (curr.saveCount || 0), 0);
  }, [recipes]);




  /* ── AUTH ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setFollowingMap({}); setCurrentUserId(null); return; }
      setCurrentUserId(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      const following = snap.exists() ? snap.data().following || [] : [];
      const map = {};
      following.forEach((id) => (map[id] = true));
      setFollowingMap(map);
    });
    return () => unsub();
  }, []);

  /* ── REAL-TIME CHEF ── */
  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(doc(db, "users", userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setChef(data);
        const currentUser = auth.currentUser;
        if (currentUser) {
          setIsFollowing((data.followers || []).includes(currentUser.uid));
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  /* ── REAL-TIME RECIPES ── */
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "recipes"),
      where("userId", "==", userId),
      where("isUploaded", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRecipes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setIndexError(false);
      },
      (err) => { console.error(err); setIndexError(true); }
    );
    return () => unsub();
  }, [userId]);

  /* ── REACTIONS ── */
  const reactionRecipeIds = useMemo(
    () => recipes.map((r) => r.id).filter(Boolean).map(toReactionRecipeId),
    [recipes]
  );

  useEffect(() => {
    let unsubReactions = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user || reactionRecipeIds.length === 0) return;
      unsubReactions = subscribeRecipeReactions(reactionRecipeIds, (reactionMap) => {
        setRecipeStates((prev) => {
          const next = { ...prev };
          recipes.forEach((recipe) => {
            const id = recipe.id;
            if (!id) return;
            const entry = reactionMap[toReactionRecipeId(id)] || {
              likes: 0, unlikes: 0, likedBy: [], unlikedBy: [],
            };
            const userReaction = entry.likedBy.includes(user.uid)
              ? "like"
              : entry.unlikedBy.includes(user.uid)
                ? "unlike"
                : "none";
            next[id] = { ...(next[id] || {}), likes: entry.likes, unlikes: entry.unlikes, userReaction };
          });
          return next;
        });
      });
    });
    return () => {
      if (typeof unsubReactions === "function") unsubReactions();
      unsubAuth();
    };
  }, [reactionRecipeIds, recipes]);

  /* ── LIVE COMMENT SYNC ── */
  useEffect(() => {
    if (!activeCommentId) return;
    const unsub = onSnapshot(doc(db, "recipes", activeCommentId), (docSnap) => {
      if (docSnap.exists()) {
        setChefComments((prev) => ({
          ...prev,
          [activeCommentId]: docSnap.data().comments || [],
        }));
      }
    });
    return () => unsub();
  }, [activeCommentId]);

  /* ── FAVORITES (real-time) ── */
  useEffect(() => {
    let unsubscribeFavorites = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFavoriteIds(new Set());
        return;
      }
      const favRef = collection(db, "users", user.uid, "favorites");
      unsubscribeFavorites = onSnapshot(favRef, (snapshot) => {
        const ids = new Set(
          snapshot.docs.map((d) => {
            const docId = d.id;
            return docId.startsWith("chef_") ? docId.replace("chef_", "") : docId;
          })
        );
        setFavoriteIds(ids);
      });
    });
    return () => {
      if (unsubscribeFavorites) unsubscribeFavorites();
      unsubscribeAuth();
    };
  }, []);

  const isFavorite = (recipe) => favoriteIds.has(recipe.id);

const toggleFavorite = async (recipe) => {
  const user = auth.currentUser;
  if (!user) {
    Swal.fire("Please login first");
    return;
  }

  const favDocId = `chef_${recipe.id}`;
  const favRef = doc(db, "users", user.uid, "favorites", favDocId);
  const recipeRef = doc(db, "recipes", recipe.id);

  if (isFavorite(recipe)) {
    await deleteDoc(favRef);
    await updateDoc(recipeRef, { saveCount: increment(-1) });
  } else {
    const rawIngredients = (recipe.ingredients || "")
      .split(/\r?\n/)
      .flatMap((line) => line.split(/,(?![^(]*\))/))
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);

    await setDoc(favRef, {
      id: favDocId,
      title: recipe.title || "Chef Recipe",
      category: recipe.category || "Community",
      country: recipe.creatorCountry || "N/A",
      chefName: recipe.createdBy || "Unknown Chef",
      isChefRecipe: true,
      userId: recipe.userId || null,
      image: recipe.image || "",
      youtube: recipe.video || null,
      instructions: recipe.steps || "",
      servings: recipe.servings || recipe.serving || null,
      ingredients: rawIngredients,
      createdAt: new Date(),
    });

    await updateDoc(recipeRef, { saveCount: increment(1) });
  }
};

  /* ── FOLLOWERS / FOLLOWING LISTS ── */
  const loadUserList = async (uids) => {
    if (!uids || uids.length === 0) return [];
    const results = await Promise.all(
      uids.map(async (uid) => {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = snap.data();
          return {
            uid,
            name: data.profile?.name || data.email || "Unknown", // Use email if name is not available
            avatar: data.profile?.avatar || DEFAULT_AVATAR,
          };
        }
        return { uid, name: "Unknown", avatar: DEFAULT_AVATAR };
      })
    );
    return results;
  };

  const openFollowersModal = async () => {
    setShowFollowersModal(true);
    setLoadingList(true);
    const list = await loadUserList(chef?.followers || []);
    setFollowersList(list);
    setLoadingList(false);
  };

  const openFollowingModal = async () => {
    setShowFollowingModal(true);
    setLoadingList(true);
    const list = await loadUserList(chef?.following || []);
    setFollowingList(list);
    setLoadingList(false);
  };

  /* ── FOLLOW / UNFOLLOW ── */
  const toggleFollow = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return Swal.fire("Login Required", "Please login to follow", "warning");
    if (currentUser.uid === userId) return;

    const currentUserRef = doc(db, "users", currentUser.uid);
    const chefRef = doc(db, "users", userId);

    try {
      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, { following: arrayRemove(userId) });
        await updateDoc(chefRef, { followers: arrayRemove(currentUser.uid) });
        setFollowingMap((prev) => { const n = { ...prev }; delete n[userId]; return n; });
        setIsFollowing(false);
      } else {
        // Follow
        await updateDoc(currentUserRef, { following: arrayUnion(userId) });
        await updateDoc(chefRef, { followers: arrayUnion(currentUser.uid) });
        setFollowingMap((prev) => ({ ...prev, [userId]: true }));
        setIsFollowing(true);
      }
    } catch (err) {
      console.error("Follow error:", err);
      Swal.fire("Error", "Could not complete follow action", "error");
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || !userId) return;

    const chefRef = doc(db, "users", userId);
    const currentUserRef = doc(db, "users", currentUserId);

    try {
      if (isFollowing) {
        await updateDoc(chefRef, {
          followers: arrayRemove(currentUserId),
        });
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId),
        });
      } else {
        await updateDoc(chefRef, {
          followers: arrayUnion(currentUserId),
        });
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId),
        });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow status:", error);
    }
  };

  /* ── LIKE / UNLIKE ── */
  const likeRecipe = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await applyLikeReaction({ recipeId: toReactionRecipeId(id), userId: user.uid }); }
    catch (err) { console.error(err); }
  };

  const unlikeRecipe = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await applyUnlikeReaction({ recipeId: toReactionRecipeId(id), userId: user.uid }); }
    catch (err) { console.error(err); }
  };

  /* ── COMMENTS ── */
  const getCurrentUserCommentName = (user) =>
    user?.displayName || user?.email?.split("@")[0] || "User";

  const canManageComment = (comment) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    if (comment?.userId) return comment.userId === currentUser.uid;
    const n = currentUser.displayName || "";
    const e = currentUser.email?.split("@")[0] || "";
    return comment?.user === n || comment?.user === e;
  };

  const handleAddComment = async (recipe) => {
    const user = auth.currentUser;
    if (!user) return Swal.fire("Please login first");
    const text = commentInputs[recipe.id]?.trim();
    if (!text) return;

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userAvatar = userSnap.exists() ? userSnap.data().profile?.avatar : "";

      const newEntry = {
        userId: user.uid,
        user: getCurrentUserCommentName(user),
        userAvatar: userAvatar || "",
        text,
        createdAt: new Date(),
        likedBy: [],
        likesCount: 0,
      };

      let currentComments = [...(chefComments[recipe.id] || [])];

      if (text.startsWith("@")) {
        const firstSpace = text.indexOf(" ");
        const replyToUser = text.substring(1, firstSpace);
        const parentIndex = currentComments.findIndex((c) => c.user === replyToUser);
        if (parentIndex !== -1) {
          if (!currentComments[parentIndex].replies) currentComments[parentIndex].replies = [];
          currentComments[parentIndex].replies.push(newEntry);
        } else {
          currentComments.push(newEntry);
        }
      } else {
        currentComments.push(newEntry);
      }

      await updateDoc(doc(db, "recipes", recipe.id), { comments: currentComments });
      setCommentInputs((prev) => ({ ...prev, [recipe.id]: "" }));
    } catch (err) { console.error(err); }
  };

  const handleEditComment = async (recipe, comments, index) => {
    const c = comments[index];
    const { value: newText } = await Swal.fire({
      title: "Edit Comment", input: "text", inputValue: c.text, showCancelButton: true,
    });
    if (newText && newText !== c.text) {
      const updated = JSON.parse(JSON.stringify(comments));
      updated[index].text = newText.trim();
      await updateDoc(doc(db, "recipes", recipe.id), { comments: updated });
    }
  };

  const handleDeleteComment = async (recipe, comments, index) => {
    const result = await Swal.fire({ title: "Delete comment?", icon: "warning", showCancelButton: true });
    if (result.isConfirmed) {
      const updated = comments.filter((_, i) => i !== index);
      await updateDoc(doc(db, "recipes", recipe.id), { comments: updated });
    }
  };

  const toggleCommentLike = async (recipe, commentIndex) => {
    const user = auth.currentUser;
    if (!user) return;
    const comments = JSON.parse(JSON.stringify(chefComments[recipe.id] || []));
    const c = comments[commentIndex];
    if (!c) return;
    if (!c.likedBy) c.likedBy = [];
    const hasLiked = c.likedBy.includes(user.uid);
    if (hasLiked) { c.likedBy = c.likedBy.filter((id) => id !== user.uid); c.likesCount = Math.max(0, (c.likesCount || 1) - 1); }
    else { c.likedBy.push(user.uid); c.likesCount = (c.likesCount || 0) + 1; }
    await updateDoc(doc(db, "recipes", recipe.id), { comments });
  };

  const toggleReplyLike = async (recipe, commentIndex, replyIndex) => {
    const user = auth.currentUser;
    if (!user) return;
    const comments = JSON.parse(JSON.stringify(chefComments[recipe.id] || []));
    const reply = comments[commentIndex]?.replies?.[replyIndex];
    if (!reply) return;
    if (!reply.likedBy) reply.likedBy = [];
    const hasLiked = reply.likedBy.includes(user.uid);
    if (hasLiked) { reply.likedBy = reply.likedBy.filter((id) => id !== user.uid); reply.likesCount = Math.max(0, (reply.likesCount || 1) - 1); }
    else { reply.likedBy.push(user.uid); reply.likesCount = (reply.likesCount || 0) + 1; }
    await updateDoc(doc(db, "recipes", recipe.id), { comments });
  };

  const handleEditReply = async (recipe, commentIndex, replyIndex) => {
    const comments = chefComments[recipe.id] || [];
    const reply = comments[commentIndex].replies[replyIndex];
    const { value: newText } = await Swal.fire({
      title: "Edit Reply", input: "text", inputValue: reply.text, showCancelButton: true,
    });
    if (newText && newText !== reply.text) {
      const updated = JSON.parse(JSON.stringify(comments));
      updated[commentIndex].replies[replyIndex].text = newText.trim();
      await updateDoc(doc(db, "recipes", recipe.id), { comments: updated });
    }
  };

  const handleDeleteReply = async (recipe, commentIndex, replyIndex) => {
    const result = await Swal.fire({ title: "Delete reply?", icon: "warning", showCancelButton: true });
    if (result.isConfirmed) {
      const updated = JSON.parse(JSON.stringify(chefComments[recipe.id] || []));
      updated[commentIndex].replies.splice(replyIndex, 1);
      await updateDoc(doc(db, "recipes", recipe.id), { comments: updated });
    }
  };

  const activateReplyMode = (username, recipeId) => {
    setVisibleReplies((prev) => ({ ...prev, [recipeId]: true }));
    setCommentInputs((prev) => ({ ...prev, [recipeId]: `@${username} ` }));
  };

  const toggleReplies = (recipeId) => {
    setVisibleReplies((prev) => ({ ...prev, [recipeId]: !prev[recipeId] }));
  };

  const normalizeCommunityRecipeForServingCalc = (recipe) => {
    const normalized = { ...recipe };
    if (typeof recipe.ingredients === "string") {
      normalized.ingredients = recipe.ingredients
        .split("\n").map((item) => item.trim()).filter(Boolean);
    }
    return normalized;
  };
  const openServingCalc = (recipe) => setServingRecipe(normalizeCommunityRecipeForServingCalc(recipe));
  const closeServingCalc = () => setServingRecipe(null);

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    try {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/);
      return match ? match[1] : null;
    } catch { return null; }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        setVisibleCount((prev) => prev + 6);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const showInstructions = (recipe) => {
    Swal.fire({
      title: `<div style="display:flex;align-items:center;gap:10px;justify-content:center;">
        <span style="font-size:28px;">📖</span>
        <span>${recipe.title} - Instructions</span>
      </div>`,
      html: `<div style="text-align:left;margin-top:10px;">
        ${recipe.steps.split("\n").map((step, i) => `<b>Step ${i + 1}:</b> ${step}`).join("<br><br>")}
      </div>`,
      confirmButtonText: "Close",
      width: "600px",
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setBioExpanded(true);
      } else {
        setBioExpanded(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) return <p className="cp-loading">Loading...</p>;
  if (!chef) return <p className="cp-loading">Chef not found</p>;

  const profile = chef.profile || {};
  const followers = chef.followers || [];
  const following = chef.following || [];
  const renderedRecipes = recipes.slice(0, visibleCount);

  return (
    <div className="cp-page">

      {/* ══════════════════════════════
          INSTAGRAM-STYLE PROFILE HEADER
      ══════════════════════════════ */}
      <div className="cp-header">
        <div className="cp-header-inner">

          {/* Avatar */}
          <div className="cp-avatar-wrap">
            <img
              src={profile.avatar || DEFAULT_AVATAR}
              alt={profile.name || "Chef"}
              className="cp-avatar"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
            />
          </div>

          {/* Info */}
          <div className="cp-info">
            {/* Name row */}
            <div className="cp-name-row">
              <h1 className="cp-name">
                👨‍🍳 {profile.name || "Chef"}
                {chef.isVerified && <MdVerified className="cp-verified-badge" />}
              </h1>
              {auth.currentUser && auth.currentUser.uid !== userId && (
                <button
                  className={`cp-follow-btn ${isFollowing ? "cp-follow-btn--following" : ""}`}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>

            {/* Instagram-style stats row */}
            <div className="cp-stats-row">
              <div className="cp-stat">
                <span className="cp-stat-num">{formatCount(recipes.length)}</span>
                <span className="cp-stat-label">Recipes</span>
              </div>
              <button className="cp-stat cp-stat--btn" onClick={openFollowersModal}>
                <span className="cp-stat-num">{formatCount(followers.length)}</span>
                <span className="cp-stat-label">Followers</span>
              </button>
              <button className="cp-stat cp-stat--btn" onClick={openFollowingModal}>
                <span className="cp-stat-num">{formatCount(following.length)}</span>
                <span className="cp-stat-label">Following</span>
              </button>
              <div className="cp-stat">
                <span className="cp-stat-num">{formatCount(totalLikes)}</span>
                <span className="cp-stat-label">Likes</span>
              </div>
              <div className="cp-stat">
                <span className="cp-stat-num">{formatCount(totalSaves)}</span>
                <span className="cp-stat-label">Saves</span>
              </div>
            </div>

            {/* Bio */}
            <div className="cp-bio-wrapper">
              <p className={`cp-bio ${bioExpanded ? 'cp-bio-expanded' : ''}`}>
                {profile.bio || "No bio available"}
              </p>
              {window.innerWidth <= 768 && profile.bio && profile.bio.length > 100 && (
                <button
                  className="cp-read-more-btn"
                  onClick={() => setBioExpanded(!bioExpanded)}
                >
                  {bioExpanded ? "Read less" : "Read more"}
                </button>
              )}
            </div>

            {/* Meta tags */}
            <div className="cp-meta-tags">
              {profile.location && <span className="cp-meta-tag">📍 {profile.location}</span>}
              {profile.cookingLevel && <span className="cp-meta-tag">🎯 {profile.cookingLevel}</span>}
              {profile.favoriteCuisine && <span className="cp-meta-tag">🍽️ {profile.favoriteCuisine}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── INDEX ERROR ── */}
      {indexError && (
        <div className="cp-index-error">
          ⚠️ Firestore index required — open the browser console for the creation link.
        </div>
      )}

      {/* ── DIVIDER ── */}
      <div className="cp-divider" />

      {/* ── EMPTY STATE ── */}
      {!loading && recipes.length === 0 && (
        <div className="cp-empty">
          <FaUtensils className="cp-empty-icon" />
          <h3>No published recipes yet</h3>
          <p>This chef hasn't published any recipes.</p>
        </div>
      )}

      {/* ══════════════════════════════
          RECIPE GRID
      ══════════════════════════════ */}
      {renderedRecipes.length > 0 && (
        <div className="cp-recipe-grid">
          {renderedRecipes.map((recipe) => {
            const id = recipe.id;
            const { likes = 0, unlikes = 0, userReaction = "none" } = recipeStates[id] || {};

            return (
              <div key={id} className="cp-card">

                {/* IMAGE / VIDEO */}
                <div className="cp-card-media">
                  {recipe.image ? (
                    <img src={recipe.image} alt={recipe.title} className="cp-card-img" />
                  ) : recipe.video ? (
                    <iframe
                      width="100%"
                      height="200"
                      src={`https://www.youtube.com/embed/${getYoutubeVideoId(recipe.video)}`}
                      title="YouTube video"
                      frameBorder="0"
                      allowFullScreen
                      className="cp-card-iframe"
                    />
                  ) : (
                    <div className="cp-card-no-img"><FaUtensils /></div>
                  )}

                  {/* Difficulty badge */}
                  <span className={`cp-badge cp-badge--${recipe.difficulty?.toLowerCase() || "easy"}`}>
                    {recipe.difficulty || "Easy"}
                  </span>

                  {/* YouTube link */}
                  {recipe.video && (
                    <a href={recipe.video} target="_blank" rel="noopener noreferrer" className="cp-yt-link">
                      <FaYoutube /> Watch
                    </a>
                  )}
                </div>

                {/* CARD BODY */}
                <div className="cp-card-body">

                  {/* Title */}
                  <h3 className="cp-card-title">{recipe.title}</h3>

                  {/* Creator row */}
                  <div className="cp-creator-row">
                    <img
                      src={recipe.creatorAvatar || profile.avatar || DEFAULT_AVATAR}
                      alt={recipe.createdBy || "Chef"}
                      className="cp-creator-avatar"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_AVATAR; }}
                    />
                    <span className="cp-creator-name">By {recipe.createdBy || profile.name || "Unknown Chef"}</span>
                  </div>

                  {/* Meta row */}
                  <div className="cp-card-meta">
                    <span className="cp-meta-pill">
                      <MdFastfood /> {recipe.category}
                    </span>
                    {recipe.prepTime && (
                      <span className="cp-meta-pill">⏱️ {recipe.prepTime}</span>
                    )}
                    {recipe.servings && (
                      <span className="cp-meta-pill">
                        <FaUsers /> {recipe.servings}
                      </span>
                    )}
                  </div>

                  <div className="cp-action-bar">
                    <button
                      className={`cp-action-btn cp-action-btn--like ${userReaction === "like" ? "cp-action-btn--active-like" : ""}`}
                      onClick={() => likeRecipe(id)}
                      title="Like"
                    >
                      {userReaction === "like"
                        ? <FaThumbsUp style={{ color: "#16a34a" }} />
                        : <FaRegThumbsUp />}
                      <span>{likes}</span>
                    </button>

                    <button
                      className={`cp-action-btn cp-action-btn--unlike ${userReaction === "unlike" ? "cp-action-btn--active-unlike" : ""}`}
                      onClick={() => unlikeRecipe(id)}
                      title="Dislike"
                    >
                      {userReaction === "unlike"
                        ? <FaThumbsDown style={{ color: "#e63946" }} />
                        : <FaRegThumbsDown />}
                      <span>{unlikes}</span>
                    </button>

                    <button
                      className="cp-action-btn cp-action-btn--comment"
                      onClick={() => setActiveCommentId(recipe.id)}
                      title="Comment"
                    >
                      <FaComment />
                      <span>{(chefComments[id] || recipe.comments || []).length}</span>
                    </button>

                    <button
                      className={`cp-action-btn cp-action-btn--fav ${isFavorite(recipe) ? "cp-action-btn--active-fav" : ""}`}
                      onClick={() => toggleFavorite(recipe)}
                      title={isFavorite(recipe) ? "Remove from favourites" : "Add to favourites"}
                    >
                      {isFavorite(recipe) ? (
                        <FaHeart style={{ color: "crimson", fontSize: "20px" }} />
                      ) : (
                        <FaRegHeart style={{ fontSize: "20px" }} />
                      )}
                    </button>
                  </div>

                  <div className="cp-card-btns">
                    <button className="cp-btn cp-btn--ingredients" onClick={() => openServingCalc(recipe)}>
                      Ingredients
                    </button>
                    <button className="cp-btn cp-btn--instructions" onClick={() => showInstructions(recipe)}>
                      Instructions
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SERVING CALCULATOR ── */}
      {servingRecipe && <ServingCalculator meal={servingRecipe} onClose={closeServingCalc} />}

      {/* ══════════════════════════════
          COMMENT MODAL
      ══════════════════════════════ */}
      {activeCommentId && (
        <div className="cp-modal-overlay" onClick={() => setActiveCommentId(null)}>
          <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-handle" />
            <div className="cp-modal-header">
              <h3>Comments</h3>
              <button className="cp-modal-close" onClick={() => setActiveCommentId(null)}>✖</button>
            </div>

            <div className="cp-modal-body">
              {(chefComments[activeCommentId] || []).length > 0 ? (
                (chefComments[activeCommentId] || []).map((comment, index) => (
                  <div key={index} className="cp-comment-wrap">
                    <div className="cp-comment-item">
                      <div className="cp-comment-avatar">
                        {comment.userAvatar || userAvatars[comment.userId] ? (
                          <img src={comment.userAvatar || userAvatars[comment.userId]} alt="avatar" />
                        ) : (
                          <span>{comment.user?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="cp-comment-content">
                        <p>
                          <span className="cp-comment-user">{comment.user}</span>
                          {comment.text}
                        </p>
                        <div className="cp-comment-actions">
                          <span className="cp-comment-heart" onClick={() => toggleCommentLike({ id: activeCommentId }, index)}>
                            {comment.likedBy?.includes(auth.currentUser?.uid)
                              ? <FaHeart color="#e63946" />
                              : <FaRegHeart />}
                            {comment.likesCount > 0 && <span className="cp-like-count">{comment.likesCount}</span>}
                          </span>
                          <span className="cp-comment-link" onClick={() => activateReplyMode(comment.user, activeCommentId)}>Reply</span>
                          {canManageComment(comment) && (
                            <>
                              <span className="cp-comment-link" onClick={() => handleEditComment({ id: activeCommentId }, chefComments[activeCommentId], index)}>Edit</span>
                              <span className="cp-comment-link cp-comment-link--danger" onClick={() => handleDeleteComment({ id: activeCommentId }, chefComments[activeCommentId], index)}>Delete</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="cp-no-comments">No comments yet. Be the first!</div>
              )}
            </div>
            <div className="cp-modal-footer">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentInputs[activeCommentId] || ""}
                onChange={(e) => setCommentInputs((prev) => ({ ...prev, [activeCommentId]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment({ id: activeCommentId })}
              />
              <button
                disabled={!commentInputs[activeCommentId]?.trim()}
                onClick={() => handleAddComment({ id: activeCommentId })}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOLLOWERS MODAL */}
      {showFollowersModal && (
        <div className="cp-modal-overlay" onClick={() => setShowFollowersModal(false)}>
          <div className="cp-modal cp-modal--list" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-handle" />
            <div className="cp-modal-header">
              <h3>Followers</h3>
              <button className="cp-modal-close" onClick={() => setShowFollowersModal(false)}>✖</button>
            </div>
            <div className="cp-modal-body">
              {loadingList ? (
                <p className="cp-list-loading">Loading...</p>
              ) : followersList.length === 0 ? (
                <p className="cp-no-comments">No followers yet.</p>
              ) : (
                followersList.map((u) => (
                  <div
                    key={u.uid}
                    className="cp-user-row"
                    onClick={() => { setShowFollowersModal(false); navigate(`/chef/${u.uid}`); }}
                  >
                    <img
                      src={u.avatar}
                      className="cp-user-row-avatar"
                      onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                    />
                    <span className="cp-user-row-name">{u.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOLLOWING MODAL */}
      {showFollowingModal && (
        <div className="cp-modal-overlay" onClick={() => setShowFollowingModal(false)}>
          <div className="cp-modal cp-modal--list" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-handle" />
            <div className="cp-modal-header">
              <h3>Following</h3>
              <button className="cp-modal-close" onClick={() => setShowFollowingModal(false)}>✖</button>
            </div>
            <div className="cp-modal-body">
              {loadingList ? (
                <p className="cp-list-loading">Loading...</p>
              ) : followingList.length === 0 ? (
                <p className="cp-no-comments">Not following anyone yet.</p>
              ) : (
                followingList.map((u) => (
                  <div
                    key={u.uid}
                    className="cp-user-row"
                    onClick={() => { setShowFollowingModal(false); navigate(`/chef/${u.uid}`); }}
                  >
                    <img
                      src={u.avatar}
                      className="cp-user-row-avatar"
                      onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                    />
                    <span className="cp-user-row-name">{u.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}