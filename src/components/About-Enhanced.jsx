// src/components/About.jsx - Enhanced About Page
import React from "react";
import { Link } from "react-router-dom";
import "../style/about-enhanced.css";

const About = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1>About Recipe Finder</h1>
          <p>Your trusted companion for cooking, meal planning, and culinary exploration</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="about-wrapper">
        <main className="about-content">
          {/* Mission */}
          <section className="content-section">
            <h2>Our Mission</h2>
            <p>
              Recipe Finder was created with one simple goal: to make home cooking easier, more enjoyable, 
              and accessible to everyone. We believe that cooking is not just about nourishment—it's about 
              creativity, connection, and self-expression. Whether you're a complete beginner or an experienced 
              cook, our platform provides the tools and inspiration you need to create delicious meals that 
              nourish both body and soul.
            </p>
          </section>

          {/* Story */}
          <section className="content-section">
            <h2>Our Story</h2>
            <p>
              Recipe Finder was founded by passionate home cooks who grew tired of scattered recipe 
              collections, complicated meal planning processes, and the constant struggle to eat healthier. 
              We recognized that most people want to cook more at home but lack the time, organization, 
              or confidence to do so consistently.
            </p>
            <p>
              After countless hours of testing different approaches, we built Recipe Finder—a comprehensive 
              platform that combines recipe discovery, intelligent meal planning, favorite management, and 
              cooking education all in one place. Our mission is to empower home cooks with the knowledge, 
              organization, and inspiration they need to cook confidently and eat better.
            </p>
          </section>

          {/* Values */}
          <section className="content-section">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <h3>🎯 Simplicity</h3>
                <p>We believe great tools should be intuitive and easy to use. No complicated features, just what matters.</p>
              </div>
              <div className="value-card">
                <h3>🥗 Quality</h3>
                <p>Every recipe, guide, and feature is carefully curated and tested to ensure genuine value for our users.</p>
              </div>
              <div className="value-card">
                <h3>🤝 Community</h3>
                <p>We're building a community where home cooks can share inspiration, support each other, and grow together.</p>
              </div>
              <div className="value-card">
                <h3>📚 Education</h3>
                <p>We're committed to teaching cooking fundamentals and nutrition education to help you cook with confidence.</p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="content-section">
            <h2>What We Offer</h2>
            <div className="features-list">
              <div className="feature-item">
                <h3>📖 Comprehensive Recipe Database</h3>
                <p>Browse thousands of tested recipes with detailed instructions, ingredient lists, and nutritional information. 
                   Filter by cuisine, dietary preference, cooking time, and more to find exactly what you're looking for.</p>
              </div>
              <div className="feature-item">
                <h3>📅 Smart Meal Planning</h3>
                <p>Plan your entire week of meals in minutes. Our intelligent system helps you create balanced meal plans, 
                   generates shopping lists, and eliminates the daily "what's for dinner?" stress.</p>
              </div>
              <div className="feature-item">
                <h3>💾 Personal Recipe Collection</h3>
                <p>Save your favorite recipes and build a personalized collection organized exactly how you want it. 
                   Access your favorites anywhere, anytime—perfect for shopping or cooking in the kitchen.</p>
              </div>
              <div className="feature-item">
                <h3>👨‍🍳 Cooking Guides & Tutorials</h3>
                <p>Learn essential cooking techniques from knife skills to proper seasoning. Our expert guides help you build 
                   confidence in the kitchen and master fundamental techniques used by professional chefs.</p>
              </div>
              <div className="feature-item">
                <h3>🌱 Dietary Customization</h3>
                <p>Find recipes tailored to your lifestyle: vegetarian, vegan, keto, gluten-free, dairy-free, and more. 
                   We accommodate various dietary preferences and restrictions.</p>
              </div>
              <div className="feature-item">
                <h3>📱 Mobile-First Design</h3>
                <p>Access all features on your phone or tablet. Our responsive design ensures seamless experience whether 
                   you're shopping for ingredients or cooking in your kitchen.</p>
              </div>
            </div>
          </section>

          {/* Team */}
          <section className="content-section">
            <h2>Our Team</h2>
            <p>
              Recipe Finder is built by a dedicated team of food enthusiasts, software engineers, and nutrition 
              experts who are passionate about making home cooking accessible and enjoyable for everyone. We're 
              constantly improving our platform based on user feedback and the latest cooking and nutrition science.
            </p>
          </section>

          {/* CTA */}
          <section className="about-cta">
            <h2>Ready to Explore the Platform?</h2>
            <p>Join thousands of home cooks who are transforming their relationship with food</p>
            <Link to="/auth" className="cta-button">Create Free Account</Link>
            <Link to="/blog" className="cta-button secondary">Read Our Blog</Link>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="about-sidebar">
          <div className="sidebar-section">
            <h3>Quick Stats</h3>
            <ul>
              <li><strong>1000+</strong> Recipes</li>
              <li><strong>100+</strong> Blog Articles</li>
              <li><strong>10+</strong> Cuisine Types</li>
              <li><strong>50+</strong> Dietary Options</li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>Get Started</h3>
            <ul>
              <li><Link to="/auth">Sign Up Free</Link></li>
              <li><Link to="/blog">Read Cooking Tips</Link></li>
              <li><Link to="/category/Recipes">Browse Recipes</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default About;
