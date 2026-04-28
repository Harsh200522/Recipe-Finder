// src/components/Disclaimer.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../style/Disclaimer.css";

const sections = [
  {
    icon: "📋",
    title: "General Information Only",
    content:
      "The content published on Recipe Finder — including recipes, meal plans, nutritional information, and cooking tips — is intended for general informational and educational purposes only. It does not constitute professional dietary, medical, or nutritional advice.",
  },
  {
    icon: "🩺",
    title: "Not a Substitute for Professional Advice",
    content:
      "Nothing on this website should be taken as professional medical or dietary advice. Always consult a qualified healthcare provider, registered dietitian, or nutritionist before making significant changes to your diet, especially if you have a medical condition, food allergy, or specific health goal.",
  },
  {
    icon: "⚠️",
    title: "Accuracy of Recipes & Nutritional Data",
    content:
      "While we strive to provide accurate and up-to-date recipes and nutritional information, we make no guarantees regarding completeness or accuracy. Nutritional values are estimates and may vary depending on ingredients, brands, portion sizes, and preparation methods used.",
  },
  {
    icon: "🔗",
    title: "Third-Party Links",
    content:
      "Recipe Finder may contain links to third-party websites for reference or convenience. We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them.",
  },
  {
    icon: "👥",
    title: "User-Generated Content",
    content:
      "Recipes and content submitted by community members represent the views of their authors and not of Recipe Finder. We do not verify the accuracy of user-submitted content and are not responsible for any issues arising from its use.",
  },
  {
    icon: "⚖️",
    title: "Limitation of Liability",
    content:
      "To the fullest extent permitted by law, Recipe Finder shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of this website or reliance on any content published here.",
  },
];

const Disclaimer = () => {
  return (
    <div className="disclaimer-container">
      {/* Hero */}
      <div className="disclaimer-hero">
        <div className="hero-content">
          <h1>Disclaimer</h1>
          <p>Please read this disclaimer carefully before using Recipe Finder</p>
        </div>
      </div>

      <div className="disclaimer-wrapper">
        {/* Intro */}
        <div className="disclaimer-intro">
          <p>
            By accessing and using <strong>Recipe Finder</strong>, you accept and agree to
            the terms of this disclaimer. If you do not agree, please discontinue use of
            this website. This disclaimer was last updated on <strong>April 2025</strong>.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="disclaimer-grid">
          {sections.map((section) => (
            <div className="disclaimer-card" key={section.title}>
              <h3>
                <span className="disclaimer-icon">{section.icon}</span>
                {section.title}
              </h3>
              <p>{section.content}</p>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="disclaimer-note">
          <p>
            If you have any questions about this disclaimer, feel free to{" "}
            <Link to="/contact">contact us</Link>. You may also review our{" "}
            <Link to="/privacy-policy">Privacy Policy</Link> and{" "}
            <Link to="/terms">Terms & Conditions</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;