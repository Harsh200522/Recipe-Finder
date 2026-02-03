import React from "react";
import "../style/about.css";

export default function About() {
  return (
    <div className="about-container">
      <div className="about-wrapper">

        {/* Header */}
        <h1 className="about-title">About Recipe Finder 🍽️</h1>
        <p className="about-subtitle">
          Discover. Cook. Enjoy. Share.
        </p>

        {/* Hero Section */}
        <div className="about-hero">
          <p>
            Welcome to your culinary companion! Recipe Finder transforms how you discover,
            prepare, and share amazing dishes from every corner of the globe.
          </p>
        </div>

        {/* Section 1 */}
        <div className="about-section">
          <h2>Who I Am</h2>
          <p>
            Hi, I'm <span className="highlight">Harsh Gilitwala</span>, the solo developer behind Recipe Finder. 
            I created this smart food discovery platform to help users quickly search and explore 
            delicious recipes from around the world. Whether you're a beginner or a master chef, 
            I've designed this app to make cooking simple, fun, and inspiring.
          </p>
        </div>

        {/* Developer Info */}
        <div className="developer-card">
          <div className="developer-info">
            <div className="developer-avatar">👨‍💻</div>
            <div className="developer-details">
              <h3>Harsh Gilitwala</h3>
              <p className="developer-role">Full Stack Developer & Food Enthusiast</p>
              <p className="developer-bio">
                Passionate about creating practical solutions that make everyday life easier. 
                Recipe Finder combines my love for coding with my appreciation for good food.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="about-stats">
          <div className="stat-item">
            <span className="stat-number">10,000+</span>
            <span className="stat-label">Recipes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Cuisines</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Solo Project</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Available</span>
          </div>
        </div>

        {/* Section 2 */}
        <div className="about-cards">
          <div className="about-card">
            <span>🥗</span>
            <h3>Healthy Choices</h3>
            <p>
              Explore vegetarian, non-veg, dessert, and seafood recipes with
              healthy options for every lifestyle. Nutritional info included!
            </p>
          </div>

          <div className="about-card">
            <span>⚡</span>
            <h3>Fast Search</h3>
            <p>
              Instantly find recipes using categories, ingredients, cook time,
              and smart filters without wasting time.
            </p>
          </div>

          {/* <div className="about-card">
            <span>📱</span>
            <h3>Responsive Design</h3>
            <p>
              Works smoothly on mobile, tablet, and desktop so you can cook
              anywhere, anytime.
            </p>
          </div> */}

          <div className="about-card">
            <span>👨‍🍳</span>
            <h3>Step-by-Step Guide</h3>
            <p>
              Detailed instructions with tips to ensure
              perfect results every time.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          <div className="feature-item">
            <h3>🎯 Personalized Recommendations</h3>
            <p>Get recipe suggestions based on your preferences and cooking history.</p>
          </div>
          {/* <div className="feature-item">
            <h3>🛒 Smart Shopping Lists</h3>
            <p>Automatically generate shopping lists from selected recipes.</p>
          </div> */}
          <div className="feature-item">
            <h3>⏱️ Cook Time Filters</h3>
            <p>Find recipes that fit your schedule with time-based filters.</p>
          </div>
          <div className="feature-item">
            <h3>🌟 User-Friendly Interface</h3>
            <p>Clean, intuitive design focused on great user experience.</p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="about-section">
          <h2>My Mission</h2>
          <p>
            My mission is to make cooking easy and enjoyable for everyone by
            providing a beautiful and simple platform to discover new dishes
            every day. I believe that good food brings people together and
            creates lasting memories.
          </p>
        </div>

        {/* Development Journey */}
        <div className="journey-section">
          <h2>Development Journey</h2>
          <div className="journey-timeline">
            <div className="timeline-item">
              <div className="timeline-date">Month 1</div>
              <h4>Concept & Planning</h4>
              <p>Research, wireframing, and setting up the project structure</p>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">Month 2</div>
              <h4>Frontend Development</h4>
              <p>Building the React components and implementing the UI/UX</p>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">Month 3</div>
              <h4>Backend Integration</h4>
              <p>Connecting with APIs and implementing search functionality</p>
            </div>
            <div className="timeline-item">
              <div className="timeline-date">Present</div>
              <h4>Launch & Improvements</h4>
              <p>Deployment and continuous updates based on user feedback</p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="tech-stack">
          <h2>Built With</h2>
          <div className="tech-icons">
            <span className="tech-icon" title="React">⚛️</span>
            <span className="tech-icon" title="JavaScript">🟨</span>
            <span className="tech-icon" title="CSS3">🎨</span>
            <span className="tech-icon" title="API Integration">🔗</span>
            <span className="tech-icon" title="Responsive Design">📱</span>
            <span className="tech-icon" title="Git">📚</span>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <h2>Ready to Start Cooking?</h2>
          <p>Start exploring recipes curated by Harsh Gilitwala today!</p>
          <div className="cta-buttons">
            <a href="/"><button className="cta-button primary">Explore Recipes</button></a>
            <a href="https://github.com/Harsh200522/Recipe-Finder"><button className="cta-button secondary">View GitHub</button></a>
          </div>
        </div>

        {/* Footer */}
        <div className="about-footer">
          <p>Developed with ❤️ by <strong>Harsh Gilitwala</strong></p>
          <p className="footer-links">
            <a href="/privacy">Privacy Policy</a> • 
            <a href="/terms"> Terms of Service</a> • 
            <a href="/contact"> Contact Me</a>
          </p>
        </div>

      </div>
    </div>
  );
}