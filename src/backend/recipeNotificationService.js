// src/services/recipeNotificationService.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firbase.js"; // matches every other file's import

/* ==========================================
   MAIN EXPORT FUNCTION
   Resolves eligible followers client-side (Firestore reads),
   then hands the recipient list to a backend route that owns
   the Resend API key and actually sends the emails.
   ========================================== */
export const sendNewRecipeNotifications = async (recipeData) => {
    const { id: recipeId, userId: chefUid, title: recipeTitle, image: recipeImage, createdBy: chefName } = recipeData;

    console.log(`[RecipeNotifier] Triggered for recipe "${recipeTitle}" by Chef UID: ${chefUid}`);

    try {
        const chefSnap = await getDoc(doc(db, "users", chefUid));
        if (!chefSnap.exists()) {
            console.log(`[RecipeNotifier] Chef document does not exist for UID: ${chefUid}`);
            return;
        }

        const followers = chefSnap.data().followers || [];
        if (followers.length === 0) {
            console.log(`[RecipeNotifier] Clean Exit: Chef "${chefName}" has 0 followers.`);
            return;
        }

        console.log(`[RecipeNotifier] Checking preferences for ${followers.length} follower(s)...`);

        const followerChecks = await Promise.allSettled(
            followers.map(async (followerUid) => {
                const followerSnap = await getDoc(doc(db, "users", followerUid));
                if (!followerSnap.exists()) return null;

                const followerData = followerSnap.data();
                const prefs = followerData.preferences || {};

                // Respect both the master toggle and the specific "New Recipes" toggle
                if (prefs.emailNotifications === false || prefs.newRecipes === false) {
                    return null;
                }

                const email = followerData.profile?.email || followerData.email || null;
                if (!email || !email.includes("@")) return null;

                const followerName = followerData.profile?.name || email.split("@")[0] || "Foodie";
                return { email, followerName };
            })
        );

        const recipients = followerChecks
            .filter((r) => r.status === "fulfilled" && r.value)
            .map((r) => r.value);

        if (recipients.length === 0) {
            console.log(`[RecipeNotifier] No eligible recipients (skipped by preferences or missing email).`);
            return;
        }

        console.log(`[RecipeNotifier] Sending to ${recipients.length} eligible recipient(s) via backend...`);
        console.log("[RecipeNotifier] Recipients:", recipients);
        const response = await fetch("/api/send-recipe-notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipients, chefName, recipeTitle, recipeImage, recipeId }),
        });

        const text = await response.text();

console.log("[RecipeNotifier] API Raw Response:", text);

let result = {};
try {
    result = text ? JSON.parse(text) : {};
} catch (err) {
    console.error("[RecipeNotifier] Invalid JSON response:", text);
}

if (!response.ok) {
    throw new Error(result.error || text || "Backend failed to send notification emails.");
}


        console.log(`[RecipeNotifier] Run Complete. Summary:`, result.summary);

    } catch (err) {
        console.error("[RecipeNotifier] Main execution engine failure:", err.message);
    }
};