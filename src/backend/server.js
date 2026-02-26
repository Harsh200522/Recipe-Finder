import express from 'express';
import cors from 'cors';
import { doc, updateDoc } from "firebase/firestore";
import { db } from './firebase.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {
    checkAndSendMealPlannerReminders,
    initMealPlannerReminderService,
} from "./mealPlannerReminderService.js";

dotenv.config();

const app = express();

// Enable CORS for React app
app.use(cors({
    origin: "http://localhost:5173", // React dev server
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json());

app.post("/run-meal-reminders", async (_req, res) => {
    try {
        await checkAndSendMealPlannerReminders();
        res.json({ success: true });
    } catch (error) {
        console.error("Manual reminder trigger failed:", error);
        res.status(500).json({ success: false, error: "Failed to run reminders" });
    }
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

app.post('/generate-2fa-otp', async (req, res) => {
    const { email, uid } = req.body;
    if (!email || !uid) return res.status(400).json({ error: "Missing email or uid" });

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // expires in 5 minutes

    // Store OTP in Firebase
    await updateDoc(doc(db, "users", uid), {
        twoFactorOTP: otp,
        twoFactorOTPExpires: expiresAt
    });

    // Send OTP via Gmail with HTML styling
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // HTML email template with CSS
    const htmlEmail = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recipe Finder OTP Verification</title>
            <style>
                /* Reset styles */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                /* Main container */
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                /* Content card */
                .email-card {
                    background: white;
                    border-radius: 20px;
                    padding: 40px 30px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    max-width: 500px;
                    margin: 0 auto;
                }
                
                /* Header */
                .email-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .logo {
                    font-size: 32px;
                    font-weight: bold;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 10px;
                }
                
                .header-title {
                    color: #333;
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                
                .header-subtitle {
                    color: #666;
                    font-size: 16px;
                    line-height: 1.5;
                }
                
                /* OTP Section */
                .otp-section {
                    background: #f8f9fa;
                    border-radius: 15px;
                    padding: 30px 20px;
                    text-align: center;
                    margin: 25px 0;
                    border: 2px dashed #667eea;
                }
                
                .otp-label {
                    color: #555;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 15px;
                }
                
                .otp-code {
                    font-size: 48px;
                    font-weight: bold;
                    letter-spacing: 10px;
                    color: #764ba2;
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    display: inline-block;
                    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.2);
                    font-family: 'Courier New', monospace;
                    margin: 15px 0;
                }
                
                .otp-expiry {
                    color: #ff6b6b;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                }
                
                .otp-expiry svg {
                    width: 16px;
                    height: 16px;
                    fill: #ff6b6b;
                }
                
                /* Warning Section */
                .warning-section {
                    background: #fff3cd;
                    border: 1px solid #ffeeba;
                    border-radius: 10px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .warning-icon {
                    font-size: 20px;
                }
                
                /* Info Section */
                .info-section {
                    background: #e3f2fd;
                    border-radius: 10px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #1565c0;
                    font-size: 14px;
                }
                
                /* Button (if needed for verification links) */
                .verify-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    padding: 15px 40px;
                    border-radius: 30px;
                    font-weight: 600;
                    margin: 20px 0;
                    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
                }
                
                /* Footer */
                .email-footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #eee;
                }
                
                .footer-text {
                    color: #999;
                    font-size: 13px;
                    line-height: 1.6;
                    margin-bottom: 10px;
                }
                
                .footer-links {
                    margin: 15px 0;
                }
                
                .footer-links a {
                    color: #667eea;
                    text-decoration: none;
                    margin: 0 10px;
                    font-size: 13px;
                }
                
                .footer-copyright {
                    color: #bbb;
                    font-size: 12px;
                }
                
                /* Social Icons */
                .social-icons {
                    margin: 20px 0;
                }
                
                .social-icon {
                    display: inline-block;
                    width: 32px;
                    height: 32px;
                    background: #f0f0f0;
                    border-radius: 50%;
                    line-height: 32px;
                    text-align: center;
                    margin: 0 5px;
                    color: #667eea;
                    font-size: 16px;
                }
                
                /* Responsive */
                @media (max-width: 480px) {
                    .email-card {
                        padding: 20px 15px;
                    }
                    
                    .otp-code {
                        font-size: 32px;
                        letter-spacing: 5px;
                    }
                    
                    .header-title {
                        font-size: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-card">
                    <!-- Header -->
                    <div class="email-header">
                        <div class="logo">🍳 Recipe Finder</div>
                        <div class="header-title">Two-Factor Authentication</div>
                        <div class="header-subtitle">Secure your account with 2FA</div>
                    </div>
                    
                    <!-- OTP Section -->
                    <div class="otp-section">
                        <div class="otp-label">Your Verification Code</div>
                        <div class="otp-code">${otp}</div>
                        <div class="otp-expiry">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                            </svg>
                            Expires in 5 minutes
                        </div>
                    </div>
                    
                    <!-- Warning Message -->
                    <div class="warning-section">
                        <span class="warning-icon">⚠️</span>
                        <span>If you didn't request this code, please ignore this email or contact support immediately.</span>
                    </div>
                    
                    <!-- Additional Info -->
                    <div class="info-section">
                        <strong>🔒 Security Tips:</strong>
                        <ul style="margin-top: 8px; margin-left: 20px;">
                            <li>Never share this code with anyone</li>
                            <li>Recipe Finder will never ask for your code via phone</li>
                            <li>This code expires in 5 minutes for security</li>
                        </ul>
                    </div>
                    
                    <!-- Alternative verification link (optional) -->
                    <!--
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/verify-2fa?uid=${uid}&code=${otp}" class="verify-button">
                            Verify Account
                        </a>
                    </div>
                    -->
                    
                    <!-- Footer -->
                    <div class="email-footer">
                        <div class="footer-text">
                            This email was sent to ${email}<br>
                            Please do not reply to this email.
                        </div>
                        
                        <div class="footer-links">
                            <a href="#">Help Center</a> •
                            <a href="#">Privacy Policy</a> •
                            <a href="#">Terms of Service</a>
                        </div>
                        
                        <div class="social-icons">
                            <span class="social-icon">f</span>
                            <span class="social-icon">t</span>
                            <span class="social-icon">ig</span>
                        </div>
                        
                        <div class="footer-copyright">
                            © ${new Date().getFullYear()} Recipe Finder. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    // Plain text fallback
    const textEmail = `
        Recipe Finder - Two-Factor Authentication
        
        Hello!
        
        You (or someone using your email) requested to enable 2-Step Verification for your Recipe Finder account.
        
        Your verification code is: ${otp}
        
        This code will expire in 5 minutes.
        
        If you did not request this, please ignore this email.
        
        Security Tips:
        - Never share this code with anyone
        - Recipe Finder will never ask for your code via phone
        - This code expires in 5 minutes for security
        
        Thanks,
        The Recipe Finder Team
        
        This email was sent to ${email}
        Please do not reply to this email.
    `;

    const mailOptions = {
        from: `"Recipe Finder" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your Recipe Finder 2FA Verification Code',
        text: textEmail,
        html: htmlEmail
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
initMealPlannerReminderService();
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
