// src/components/Footer.jsx - Application Footer
import React from "react";
import { Link } from "react-router-dom";
import "../style/footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
          <div className="social-links">
            <a href="#facebook" title="Facebook">f</a>
            <a href="#twitter" title="Twitter">𝕏</a>
            <a href="#instagram" title="Instagram">📷</a>
          </div>
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
            <li><a href="#disclaimer">Disclaimer</a></li>
            <li><a href="#sitemap">Sitemap</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Newsletter</h4>
          <p>Subscribe to get exclusive recipes and tips</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email"
              required
            />
            <button type="submit">Subscribe</button>
          </form>
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
