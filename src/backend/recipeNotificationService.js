// src/services/recipeNotificationService.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firbase.js";

export const sendNewRecipeNotifications = async (recipeData) => {
    const {
        id: recipeId,
        userId: chefUid,
        title: recipeTitle,
        image: recipeImage,
        createdBy: chefName
    } = recipeData;

    console.log(`[RecipeNotifier] Triggered for recipe "${recipeTitle}" by Chef UID: ${chefUid}`);

    try {
        // Step 1: Get the chef's document
        const chefSnap = await getDoc(doc(db, "users", chefUid));
        if (!chefSnap.exists()) {
            console.log(`[RecipeNotifier] Chef document not found for UID: ${chefUid}`);
            return;
        }

        const followers = chefSnap.data().followers || [];
        if (followers.length === 0) {
            console.log(`[RecipeNotifier] Chef "${chefName}" has 0 followers. Exiting.`);
            return;
        }

        console.log(`[RecipeNotifier] Checking preferences for ${followers.length} follower(s)...`);

        // Step 2: Filter followers by notification preferences
        const followerChecks = await Promise.allSettled(
            followers.map(async (followerUid) => {
                const followerSnap = await getDoc(doc(db, "users", followerUid));
                if (!followerSnap.exists()) return null;

                const followerData = followerSnap.data();
                const prefs = followerData.preferences || {};

                // Skip if master email toggle OR new recipes toggle is off
                if (prefs.emailNotifications === false || prefs.newRecipes === false) {
                    console.log(`[RecipeNotifier] Skipped ${followerUid} — notifications disabled.`);
                    return null;
                }

                const email = followerData.profile?.email || followerData.email || null;
                if (!email || !email.includes("@")) {
                    console.log(`[RecipeNotifier] Skipped ${followerUid} — no valid email.`);
                    return null;
                }

                const followerName =
                    followerData.profile?.name || email.split("@")[0] || "Foodie";

                return { email, followerName };
            })
        );

        const recipients = followerChecks
            .filter((r) => r.status === "fulfilled" && r.value !== null)
            .map((r) => r.value);

        if (recipients.length === 0) {
            console.log(`[RecipeNotifier] No eligible recipients after preference filtering.`);
            return;
        }

        console.log(`[RecipeNotifier] Sending to ${recipients.length} eligible recipient(s)...`);

        // Step 3: Hand off to the serverless function which holds the API key
        const response = await fetch("/api/send-recipe-notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipients,
                chefName,
                recipeTitle,
                recipeImage,
                recipeId
            }),
        });

        const text = await response.text();
        console.log("[RecipeNotifier] API Raw Response:", text);

        let result = {};
        try {
            result = text ? JSON.parse(text) : {};
        } catch {
            console.error("[RecipeNotifier] Non-JSON response from backend:", text);
        }

        if (!response.ok) {
            throw new Error(result.error || text || "Backend failed to send notification emails.");
        }

        console.log(`[RecipeNotifier] ✅ Run Complete. Summary:`, result.summary);

    } catch (err) {
        console.error("[RecipeNotifier] ❌ Execution failure:", err.message);
    }
};