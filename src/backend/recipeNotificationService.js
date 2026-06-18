// src/services/recipeNotificationService.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "../backend/firebase.js"; //  Fixed import typo

/* ==========================================
   API EMAIL CLIENT (RESEND REST API)
   ========================================== */
const sendEmailViaApi = async ({ to, subject, html }) => {
    const apiKey = process.env.EMAIL_PASS;
    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

    if (!apiKey) {
        throw new Error("RESEND_API_KEY is missing in environment variables.");
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject: subject,
            html: html,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to dispatch email via Resend API.");
    }

    return data;
};

/* ==========================================
   EMAIL HTML TEMPLATE
   ========================================== */
const buildRecipeAlertHtml = ({ chefName, recipeTitle, recipeImage, followerName, recipeId }) => {
    return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #4ecdc4 0%, #2ab7ca 100%); padding: 24px; text-align: center; color: white;">
                <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">New Recipe Alert!</p>
                <h1 style="margin: 8px 0 0; font-size: 24px;">👨‍🍳 ${chefName} just published a recipe!</h1>
            </div>
            <div style="padding: 24px;">
                <p style="font-size: 16px; color: #333;">Hi ${followerName},</p>
                <p style="font-size: 15px; color: #555; line-height: 1.5;">
                    A chef you follow, <b>${chefName}</b>, has just shared a brand new culinary creation:
                </p>
                <div style="background: #f7fdfc; border-left: 4px solid #4ecdc4; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <h2 style="margin: 0; font-size: 18px; color: #111;">${recipeTitle}</h2>
                </div>
                ${recipeImage ? `<img src="${recipeImage}" alt="${recipeTitle}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;" />` : ''}
                <div style="text-align: center; margin-top: 26px;">
                    <a href="https://recipe-finder-fmn8.vercel.app/chef/${recipeId}" target="_blank" style="display: inline-block; background: #4ecdc4; color: white; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: bold; box-shadow: 0 4px 10px rgba(78,205,196,0.3);">
                        🍳 View Recipe Details
                    </a>
                </div>
            </div>
            <div style="background: #f1f1f1; padding: 12px; text-align: center; font-size: 12px; color: #888;">
                You are receiving this because you follow ${chefName}. <br/>
                To manage these alerts, change your notification settings in your Profile Settings page.
            </div>
        </div>
    </div>`;
};

/* ==========================================
   MAIN EXPORT FUNCTION
   ========================================== */
export const sendNewRecipeNotifications = async (recipeData) => {
    const { id: recipeId, userId: chefUid, title: recipeTitle, image: recipeImage, createdBy: chefName } = recipeData;
    
    console.log(`[RecipeNotifier] Triggered for recipe "${recipeTitle}" by Chef UID: ${chefUid}`);

    try {
        // Step 1: Get the Chef's document to read their followers array
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

        console.log(`[RecipeNotifier] Processing alerts for ${followers.length} follower(s) concurrently...`);

        // Step 2: Fire off follower notification handlers in parallel
        const notificationPromises = followers.map(async (followerUid) => {
            try {
                const followerSnap = await getDoc(doc(db, "users", followerUid));
                if (!followerSnap.exists()) return;

                const followerData = followerSnap.data();
                const prefs = followerData.preferences || {};

                // Step 3: Check preferences toggles
                if (prefs.emailNotifications === false || prefs.newRecipes === false) {
                    return { status: "skipped", reason: "Preferences disabled", followerUid };
                }

                // Step 4: Resolve address
                const email = followerData.profile?.email || followerData.email || null;
                if (!email || !email.includes("@")) {
                    return { status: "skipped", reason: "Invalid/Missing email", followerUid };
                }

                const followerName = followerData.profile?.name || email.split("@")[0] || "Foodie";

                // Step 5: Dispatch Email via Resend
                await sendEmailViaApi({
                    to: email,
                    subject: `🍳 New Recipe from ${chefName} — ${recipeTitle}`,
                    html: buildRecipeAlertHtml({
                        chefName,
                        recipeTitle,
                        recipeImage,
                        followerName,
                        recipeId
                    })
                });

                return { status: "sent", email };
            } catch (innerErr) {
                // Return structured error context so Promise.allSettled can group it nicely
                throw new Error(`Follower ${followerUid} failed: ${innerErr.message}`);
            }
        });

        // Step 6: Wait for all promises to resolve or reject independently
        const results = await Promise.allSettled(notificationPromises);
        
        // Log clean summary details
        const summary = results.reduce((acc, cur) => {
            if (cur.status === "rejected") acc.failed++;
            else if (cur.value?.status === "skipped") acc.skipped++;
            else if (cur.value?.status === "sent") acc.sent++;
            return acc;
        }, { sent: 0, skipped: 0, failed: 0 });

        console.log(`[RecipeNotifier] Run Complete. Summary: Sent: ${summary.sent} | Skipped: ${summary.skipped} | Failed: ${summary.failed}`);
        
        // Log any deep failures out for your APM/logging dashboard
        results.forEach((res) => {
            if (res.status === "rejected") {
                console.error(`[RecipeNotifier] Minor processing failure:`, res.reason.message);
            }
        });

    } catch (err) {
        console.error("[RecipeNotifier] Main execution engine failure:", err.message);
    }
};