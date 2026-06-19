import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 1. Explicitly load .env from the root directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Debugging: Verify env variables are loaded (The private key will be hidden)
console.log("--- Configuration Check ---");
console.log("Project ID:", process.env.FIREBASE_PROJECT_ID ? "Loaded" : "MISSING");
console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL ? "Loaded" : "MISSING");

import express from 'express';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors());
app.use(express.json());

const actionCodeSettings = {
  url: process.env.PASSWORD_RESET_REDIRECT_URL || "https://recipefinder.com/auth",
  handleCodeInApp: false,
};

async function sendCustomPasswordResetEmail(email, link) {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = `
    <p>Hello,</p>
    <p>We received a request to reset the password for your Recipe Finder account.</p>
    <p>
      <a href="${link}" style="display:inline-block;padding:12px 20px;color:#ffffff;background:#ef6c00;border-radius:8px;text-decoration:none;">
        Reset Password
      </a>
    </p>
    <p>If you did not request this, you can safely ignore this email.</p>
    <p>Thank you,<br/>Recipe Finder Team</p>
  `;

  await transporter.sendMail({
    from: `"Recipe Finder Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Recipe Finder Password",
    html,
  });
}

// 2. Firebase Initialization with error handling
try {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The replace logic handles the literal '\n' found in stringified environment variables
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
  console.log("Firebase initialized successfully.");
} catch (err) {
  console.error("Firebase Initialization Failed:", err.message);
  process.exit(1); // Stop the server if Firebase isn't configured
}

// 3. Reset Password Endpoint
app.post("/api/reset-password", async (req, res) => {
  try {
      const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const resetLink = await getAuth().generatePasswordResetLink(email, actionCodeSettings);

    await sendCustomPasswordResetEmail(email, resetLink);

    res.status(200).json({ success: true, message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));