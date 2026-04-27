// src/components/Footer.jsx - Application Footer
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../config/firbase.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import "../style/footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // "success" | "error" | "loading" | "duplicate" | null

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setStatus("loading");

    try {
      // Check if email already subscribed
      const q = query(
        collection(db, "newsletter_subscribers"),
        where("email", "==", email.toLowerCase().trim())
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        setStatus("duplicate");
        setTimeout(() => setStatus(null), 4000);
        return;
      }

      // Save to Firestore
      await addDoc(collection(db, "newsletter_subscribers"), {
        email: email.toLowerCase().trim(),
        subscribedAt: serverTimestamp(),
      });

      setEmail("");
      setStatus("success");
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      console.error("Subscription error:", err);
      setStatus("error");
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>About Recipe Finder</h3>
          <p>
            Recipe Finder is your go-to platform for discovering delicious recipes,
            planning healthy meals, and mastering cooking techniques. Join thousands
            of home cooks improving their culinary skills.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Resources</h4>
          <ul>
            <li><Link to="/category/Recipes">Recipes</Link></li>
            <li><Link to="/category/Meal Planning">Meal Planning</Link></li>
            <li><Link to="/category/Healthy Eating">Healthy Eating</Link></li>
            <li><Link to="/category/Cooking Tutorials">Cooking Tips</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
            <li><Link to="/disclaimer">Disclaimer</Link></li>
            <li><Link to="/sitemap">Sitemap</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Newsletter</h4>
          <p>Subscribe to get exclusive recipes and tips</p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              required
            />
            <button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>

          {status === "success" && (
            <p className="newsletter-msg success">
              ✅ Subscribed! Thanks for joining.
            </p>
          )}
          {status === "duplicate" && (
            <p className="newsletter-msg duplicate">
              ℹ️ This email is already subscribed.
            </p>
          )}
          {status === "error" && (
            <p className="newsletter-msg error">
              ❌ Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-credits">
          <p>&copy; {currentYear} Recipe Finder. All rights reserved.</p>
        </div>
        <div className="footer-info">
          <p>Made with <span className="heart">❤️</span> for food lovers everywhere</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;