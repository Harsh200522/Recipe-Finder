import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  documentId,
  increment,
  onSnapshot,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { db } from "../config/firbase";

const REACTIONS_COLLECTION = "recipeReactions";
const CHUNK_SIZE = 30;

const chunkIds = (ids) => {
  const chunks = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
};

const normalizeReactionDoc = (data = {}) => ({
  likes: Number.isFinite(data.likeCount) ? data.likeCount : 0,
  unlikes: Number.isFinite(data.unlikeCount) ? data.unlikeCount : 0,
  likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
  unlikedBy: Array.isArray(data.unlikedBy) ? data.unlikedBy : [],
});

export const subscribeRecipeReactions = (recipeIds, onChange) => {
  const uniqueIds = [...new Set((recipeIds || []).filter(Boolean))];
  if (uniqueIds.length === 0) {
    onChange({});
    return () => {};
  }

  const chunks = chunkIds(uniqueIds);
  const chunkMaps = {};
  const unsubscribers = chunks.map((ids, chunkIndex) => {
    const q = query(
      collection(db, REACTIONS_COLLECTION),
      where(documentId(), "in", ids)
    );

    return onSnapshot(q, (snapshot) => {
      const currentChunk = {};
      snapshot.forEach((docSnap) => {
        currentChunk[docSnap.id] = normalizeReactionDoc(docSnap.data());
      });
      chunkMaps[chunkIndex] = currentChunk;

      const merged = {};
      Object.values(chunkMaps).forEach((value) => {
        Object.assign(merged, value);
      });

      const withDefaults = uniqueIds.reduce((acc, id) => {
        acc[id] = merged[id] || normalizeReactionDoc();
        return acc;
      }, {});

      onChange(withDefaults);
    });
  });

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
};

const applyReaction = async ({ recipeId, userId, nextType }) => {
  if (!recipeId || !userId) return;
  const reactionRef = doc(db, REACTIONS_COLLECTION, recipeId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(reactionRef);
    const current = normalizeReactionDoc(snap.exists() ? snap.data() : {});

    const hasLike = current.likedBy.includes(userId);
    const hasUnlike = current.unlikedBy.includes(userId);

    const updates = {};

    if (nextType === "like") {
      if (hasLike) {
        updates.likedBy = arrayRemove(userId);
        updates.likeCount = increment(-1);
      } else {
        updates.likedBy = arrayUnion(userId);
        updates.likeCount = increment(1);
        if (hasUnlike) {
          updates.unlikedBy = arrayRemove(userId);
          updates.unlikeCount = increment(-1);
        }
      }
    }

    if (nextType === "unlike") {
      if (hasUnlike) {
        updates.unlikedBy = arrayRemove(userId);
        updates.unlikeCount = increment(-1);
      } else {
        updates.unlikedBy = arrayUnion(userId);
        updates.unlikeCount = increment(1);
        if (hasLike) {
          updates.likedBy = arrayRemove(userId);
          updates.likeCount = increment(-1);
        }
      }
    }

    tx.set(
      reactionRef,
      {
        likedBy: current.likedBy,
        unlikedBy: current.unlikedBy,
        likeCount: current.likes,
        unlikeCount: current.unlikes,
      },
      { merge: true }
    );

    tx.set(reactionRef, updates, { merge: true });
  });
};

export const handleLike = async ({ recipeId, userId }) =>
  applyReaction({ recipeId, userId, nextType: "like" });

export const handleUnlike = async ({ recipeId, userId }) =>
  applyReaction({ recipeId, userId, nextType: "unlike" });
