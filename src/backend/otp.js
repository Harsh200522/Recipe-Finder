// backend/otp.js
import nodemailer from 'nodemailer';

export async function sendOtp(toEmail) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // your Gmail
      pass: process.env.EMAIL_PASS  // App Password
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your OTP Code',
    text: `Your verification code is ${otp}. Do not share it with anyone.`
  });

  return otp;
}
