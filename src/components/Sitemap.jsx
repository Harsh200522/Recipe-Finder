// src/components/Sitemap.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../style/sitemap.css";

const sitemapData = [
  {
    section: "Main Pages",
    icon: "🏠",
    links: [
      { label: "Home", to: "/" },
      { label: "About Us", to: "/about" },
      { label: "Contact Us", to: "/contact" },
    ],
  },
  {
    section: "Blog",
    icon: "📝",
    links: [
      { label: "Blog", to: "/blog" },
      { label: "Recipes", to: "/category/Recipes" },
      { label: "Meal Planning", to: "/category/Meal Planning" },
      { label: "Healthy Eating", to: "/category/Healthy Eating" },
      { label: "Cooking Tips", to: "/category/Cooking Tutorials" },
    ],
  },
  {
    section: "User Features",
    icon: "👤",
    links: [
      { label: "Login / Register", to: "/auth" },
      { label: "Profile Settings", to: "/profile" },
      { label: "Favorites", to: "/favorites" },
      { label: "Meal Planner", to: "/meal-planner" },
      { label: "Community Recipes", to: "/community" },
    ],
  },
  {
    section: "Legal",
    icon: "📄",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms" },
    ],
  },
];

const Sitemap = () => {
  return (
    <div className="sitemap-container">
      {/* Hero */}
      <div className="sitemap-hero">
        <div className="hero-content">
          <h1>Sitemap</h1>
          <p>A complete overview of all pages on Recipe Finder</p>
        </div>
      </div>

      <div className="sitemap-wrapper">
        <div className="sitemap-grid">
          {sitemapData.map((group) => (
            <div className="sitemap-card" key={group.section}>
              <h3>
                <span className="sitemap-icon">{group.icon}</span>
                {group.section}
              </h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sitemap;