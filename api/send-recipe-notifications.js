// api/send-recipe-notifications.js

import nodemailer from "nodemailer";

const buildRecipeAlertHtml = ({
    chefName,
    recipeTitle,
    recipeImage,
    followerName,
    recipeId,
}) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;background:#f9f9f9;padding:20px;">
    <div style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);margin:0 auto;">
        
        <div style="background:linear-gradient(135deg,#4ecdc4 0%,#2ab7ca 100%);padding:24px;text-align:center;color:#fff;">
            <p style="margin:0;font-size:14px;text-transform:uppercase;letter-spacing:2px;">
                New Recipe Alert!
            </p>
            <h1 style="margin:8px 0 0;font-size:24px;">
                👨‍🍳 ${chefName} just published a recipe!
            </h1>
        </div>

        <div style="padding:24px;">
            <p style="font-size:16px;color:#333;">
                Hi ${followerName},
            </p>

            <p style="font-size:15px;color:#555;line-height:1.5;">
                A chef you follow, <b>${chefName}</b>, has just shared a brand new culinary creation:
            </p>

            <div style="background:#f7fdfc;border-left:4px solid #4ecdc4;padding:16px;margin:20px 0;border-radius:4px;">
                <h2 style="margin:0;font-size:18px;color:#111;">
                    ${recipeTitle}
                </h2>
            </div>

            ${
                recipeImage
                    ? `
                <img
                    src="${recipeImage}"
                    alt="${recipeTitle}"
                    style="width:100%;max-height:250px;object-fit:cover;border-radius:8px;margin-bottom:20px;"
                />
            `
                    : ""
            }

            <div style="text-align:center;margin-top:26px;">
                <a
                    href="https://recipe-finder-fmn8.vercel.app/chef/${recipeId}"
                    target="_blank"
                    style="display:inline-block;background:#4ecdc4;color:white;text-decoration:none;padding:12px 28px;border-radius:50px;font-weight:bold;"
                >
                    🍳 View Recipe Details
                </a>
            </div>
        </div>

        <div style="background:#f1f1f1;padding:12px;text-align:center;font-size:12px;color:#888;">
            You are receiving this because you follow ${chefName}.<br/>
            To manage these alerts, change your notification settings in your Profile Settings page.
        </div>

    </div>
</div>
`;

const createTransporter = () => {
    const smtpUser = process.env.EMAIL_USER;
    const smtpPass = process.env.EMAIL_PASS;

    if (!smtpUser || !smtpPass) {
        throw new Error("EMAIL_USER or EMAIL_PASS missing.");
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
};

export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({
                error: "Method not allowed",
            });
        }

        const {
            recipients,
            chefName,
            recipeTitle,
            recipeImage,
            recipeId,
        } = req.body || {};

        if (!Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                error: "No recipients provided",
            });
        }

        if (!chefName || !recipeTitle || !recipeId) {
            return res.status(400).json({
                error: "Missing recipe metadata",
            });
        }

        const transporter = createTransporter();

        console.log(
            `[RecipeNotifications] Sending to ${recipients.length} recipient(s)`
        );

        const results = await Promise.allSettled(
            recipients.map(async ({ email, followerName }) => {
                return transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: `🍳 New Recipe from ${chefName} — ${recipeTitle}`,
                    html: buildRecipeAlertHtml({
                        chefName,
                        recipeTitle,
                        recipeImage,
                        followerName,
                        recipeId,
                    }),
                });
            })
        );

        const summary = results.reduce(
            (acc, result) => {
                if (result.status === "fulfilled") {
                    acc.sent++;
                } else {
                    acc.failed++;
                }
                return acc;
            },
            { sent: 0, failed: 0 }
        );

        results.forEach((result, index) => {
            if (result.status === "rejected") {
                console.error(
                    `[RecipeNotifications] Failed for ${recipients[index].email}:`,
                    result.reason?.message
                );
            }
        });

        console.log("[RecipeNotifications] Summary:", summary);

        return res.status(200).json({
            success: true,
            summary,
        });
    } catch (error) {
        console.error(
            "[RecipeNotifications] Fatal Error:",
            error.message
        );

        return res.status(500).json({
            error: error.message,
        });
    }
}