// src/components/LandingPage.jsx - Public Landing Page
import React from "react";
import { Link } from "react-router-dom";
import { getFeaturedArticles, getLatestArticles } from "../data/blog-articles";
import "../style/landing-page.css";

const LandingPage = () => {
  const featuredArticles = getFeaturedArticles();
  const latestArticles = getLatestArticles(3);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Your Complete Recipe & Meal Planning Companion</h1>
          <p>Discover thousands of recipes, plan perfect meals, and become the home cook you've always wanted to be</p>
          <div className="hero-buttons">
            <Link to="/auth" className="btn btn-primary">Get Started Free</Link>
            <Link to="/blog" className="btn btn-secondary">Browse Articles</Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-placeholder">
            <span>🍽️ 🥗 🍳 🥘</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose Recipe Finder?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Massive Recipe Database</h3>
            <p>Explore thousands of recipes from cuisines around the world. Filter by ingredients, dietary preferences, and cooking time.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Smart Meal Planning</h3>
            <p>Plan your entire week of meals in minutes. Generate shopping lists automatically and avoid last-minute food decisions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Save Favorites</h3>
            <p>Bookmark your favorite recipes and build a personal collection organized by meal type, cuisine, or any category you choose.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌱</div>
            <h3>Dietary Preferences</h3>
            <p>Find recipes tailored to your lifestyle: vegetarian, vegan, keto, gluten-free, dairy-free, and more.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍🍳</div>
            <h3>Cooking Guides</h3>
            <p>Learn essential cooking techniques, knife skills, and professional tips to improve your culinary expertise.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Friendly</h3>
            <p>Access full functionality on your phone or tablet. Perfect for grocery shopping or cooking in the kitchen.</p>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="blog-preview-section">
        <h2>Latest From Our Blog</h2>
        <p className="section-subtitle">Expert cooking tips, nutrition advice, and inspiring recipes</p>
        <div className="blog-preview-grid">
          {latestArticles.map(article => (
            <article key={article.id} className="blog-card">
              <img
                src={article.image}
                alt={article.title}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/400x250?text=" + encodeURIComponent(article.title.substring(0, 20));
                }}
              />
              <div className="blog-card-content">
                <span className="blog-category">{article.category}</span>
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <Link to={`/blog/${article.slug}`} className="read-more">
                  Read Article →
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="section-cta">
          <Link to="/blog" className="btn btn-primary">View All Articles</Link>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="featured-section">
          <h2>Featured Recipes & Guides</h2>
          <div className="featured-list">
            {featuredArticles.map((article, index) => (
              <div key={article.id} className={`featured-item featured-${index}`}>
                <div className="featured-image">
                  <img
                    src={article.image}
                    alt={article.title}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/600x400?text=" + encodeURIComponent(article.title.substring(0, 25));
                    }}
                  />
                </div>
                <div className="featured-content">
                  <span className="featured-badge">Featured</span>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <ul>
                    <li>📖 {article.readTime} minute read</li>
                    <li>✍️ By {article.author}</li>
                    <li>📅 {article.date}</li>
                  </ul>
                  <Link to={`/blog/${article.slug}`} className="btn btn-secondary">
                    Read Full Article
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Join Thousands of Home Cooks</h2>
        <p>Start discovering recipes, planning meals, and cooking like a pro today</p>
        <Link to="/auth" className="btn btn-primary btn-large">
          Create Your Free Account
        </Link>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <h2>What Our Users Are Saying</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-stars">⭐⭐⭐⭐⭐</div>
            <p>"Recipe Finder completely transformed how I plan meals. I save so much time and money!"</p>
            <span className="benefit-author">- Sarah M.</span>
          </div>
          <div className="benefit-card">
            <div className="benefit-stars">⭐⭐⭐⭐⭐</div>
            <p>"The recipes are incredible and so easy to follow. Perfect for someone learning to cook."</p>
            <span className="benefit-author">- James L.</span>
          </div>
          <div className="benefit-card">
            <div className="benefit-stars">⭐⭐⭐⭐⭐</div>
            <p>"Best meal planning tool I've used. The interface is intuitive and features are powerful."</p>
            <span className="benefit-author">- Emma T.</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
