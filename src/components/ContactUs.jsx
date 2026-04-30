import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../style/contact.css';
import LiveChat from './LiveChat';
import FAQModal from './FAQModal';

export default function ContactUs() {
  const location = useLocation();
  
  useEffect(() => {
    // Multiple scroll methods to ensure it works
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Use requestAnimationFrame for backup
    const rafId = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [location.pathname]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  const faqs = [
    {
      id: 1,
      question: "How do I save recipes?",
      answer: "Click the heart icon (❤️) on any recipe card to save it to your favorites. You can view all saved recipes in the Favorites section of the app."
    },
    {
      id: 2,
      question: "Can I share my own recipes?",
      answer: "Yes! Go to the Community Recipes section, click 'Submit Recipe', and fill in the details. Your recipe will be shared with other users in the Recipe Finder community."
    },
    {
      id: 3,
      question: "How does the search work?",
      answer: "You can search recipes by name (e.g., 'Pasta') or by ingredients (e.g., 'chicken, rice'). The app will show you all matching recipes with ingredients you specify."
    },
    {
      id: 4,
      question: "Is Recipe Finder free?",
      answer: "Yes! Recipe Finder is completely free to use. All features including meal planning, favorites, and AI cook recommendations are available at no cost."
    },
    {
      id: 5,
      question: "How do I reset my password?",
      answer: "Click 'Forgot Password' on the login page, enter your email address, and follow the instructions sent to your inbox to create a new password."
    },
    {
      id: 6,
      question: "What is the serving calculator?",
      answer: "The serving calculator lets you adjust recipe servings. Change the serving size number and all ingredient quantities will automatically recalculate proportionally."
    },
    {
      id: 7,
      question: "How does the meal planner work?",
      answer: "Use the Meal Planner to organize your weekly meals. Add recipes to specific days, and you'll get reminders for your planned meals. Perfect for meal prep!"
    },
    {
      id: 8,
      question: "Can I watch cooking videos?",
      answer: "Yes! Many recipes include cooking videos or YouTube suggestions. Click the 'Watch Video' button to see step-by-step cooking instructions."
    },
    {
      id: 9,
      question: "What is the AI Cook feature?",
      answer: "AI Cook lets you enter ingredients you have, and our AI will generate a custom recipe for you. You can set preferences like vegetarian, cooking time, cuisine, and difficulty level."
    },
    {
      id: 10,
      question: "How do I add recipes to a shopping list?",
      answer: "Click 'Add to Cart' on any recipe to create a shopping list. You can then search for ingredients on Amazon or other platforms to purchase them online."
    }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'recipe', label: 'Recipe Question' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'suggestion', label: 'Feature Suggestion' },
    { value: 'bug', label: 'Report a Bug' },
    { value: 'partnership', label: 'Partnership' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    return newErrors;
  };

  const contactEndpoint = "/api/contact";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setSubmitError("");
      try {
        const res = await fetch(contactEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Failed to send message.");
        }

        setIsSubmitted(true);
        // Reset form after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            name: '',
            email: '',
            subject: '',
            message: '',
            category: 'general'
          });
        }, 5000);
      } catch (err) {
        setSubmitError(err.message || "Failed to send message.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <header className="contact-hero">
        <div className="contact-hero-content">
          <span className="contact-eyebrow">Get in Touch</span>
          <h1>We'd Love to Hear From You</h1>
          <p className="contact-hero-sub">
            Have a question about a recipe? Found a bug? Want to collaborate? 
            Our team is here to help you on your culinary journey.
          </p>
        </div>
        <div className="contact-hero-pattern"></div>
      </header>

      {/* Main Content */}
      <div className="contact-wrap">
        {/* Quick Contact Cards */}
        <div className="contact-cards-grid">
          <div className="contact-card">
            <div className="card-icon">📧</div>
            <h3>Email Us</h3>
            <p>infolivesta@gmail.com</p>
            <p className="card-note">We reply within 24 hours</p>
          </div>

          <div className="contact-card">
            <div className="card-icon">📞</div>
            <h3>Call Us</h3>
            <p>+91 88498 60553</p>
            <p className="card-note">Mon-Fri, 9am-5pm EST</p>
          </div>

          <div className="contact-card">
            <div className="card-icon">💬</div>
            <h3>Live Chat</h3>
            <p>Available 24/7</p>
            <button className="chat-button" onClick={() => setIsChatOpen(true)}>Start Chat</button>
          </div>

          <div className="contact-card">
            <div className="card-icon">📍</div>
            <h3>Visit Us</h3>
            <p>108, Swapana Siddh Appartment </p>
            <p>Surat, Gujarat - 395003</p>
          </div>
        </div>

        {/* Contact Form + Info */}
        <div className="contact-main-grid">
          {/* Contact Form */}
          <div className="contact-form-container">
            <h2>Send Us a Message</h2>
            <p className="form-intro">
            Have a specific question or need assistance? Fill out the form below and we'll get back to you as soon as possible.
            </p>

            {isSubmitted ? (
              <div className="success-message">
                <div className="success-icon">✓</div>
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    className={errors.message ? 'error' : ''}
                  />
                  {errors.message && <span className="error-message">{errors.message}</span>}
                </div>

                {submitError && (
                  <p className="error-message" style={{ marginTop: "8px" }}>
                    {submitError}
                  </p>
                )}

                <button type="submit" className="submit-button" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Side Info */}
          <div className="contact-side-info">
            <div className="info-block faq-preview">
              <h3>❓ Frequently Asked Questions</h3>
              <ul className="faq-list">
                <li>
                  <a href="#">How do I save recipes?</a>
                </li>
                <li>
                  <a href="#">Can I share my own recipes?</a>
                </li>
                <li>
                  <a href="#">How does the search work?</a>
                </li>
                <li>
                  <a href="#">Is Recipe Finder free?</a>
                </li>
                <li>
                  <a href="#">How do I reset my password?</a>
                </li>
              </ul>
              <button 
                onClick={() => setIsFaqOpen(true)} 
                className="view-all-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                View all FAQs →
              </button>
            </div>

           {/*  <div className="info-block social-block">
              <h3>🌟 Connect With Us</h3>
              <div className="social-links">
                <a href="#" className="social-link">
                  <span className="social-icon">📘</span> Facebook
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">📸</span> Instagram
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">🐦</span> Twitter
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">📌</span> Pinterest
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">🎥</span> YouTube
                </a>
              </div>
            </div>*/}

            <div className="info-block hours-block">
              <h3>⏰ Support Hours</h3>
              <div className="hours-table">
                <div className="hours-row">
                  <div className="hours-cell day-cell">Monday - Friday:</div>
                  <div className="hours-cell time-cell">9:00 AM - 8:00 PM EST</div>
                </div>
                <div className="hours-row">
                  <div className="hours-cell day-cell">Saturday:</div>
                  <div className="hours-cell time-cell">10:00 AM - 4:00 PM EST</div>
                </div>
                <div className="hours-row">
                  <div className="hours-cell day-cell">Sunday:</div>
                  <div className="hours-cell time-cell">Closed</div>
                </div>
              </div>
              <p className="emergency-note">
                For urgent issues, please use our live chat feature for immediate assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <h2>Find Us</h2>
          <div className="map-container">
            {/* Replace with actual Google Maps embed or image */}
            <div className="map-placeholder">
              <div className="map-marker">📍</div>
              <p>108, Swapana Siddh appartment, Surat, Gujarat - 395003</p>
              <button className="directions-button" onClick={() => window.open('https://maps.app.goo.gl/Vf5LL5aSUVnJ1Zxs7', '_blank')}>Get Directions</button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Modal */}
      <LiveChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* FAQ Modal */}
      <FAQModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} faqs={faqs} />
    </>
  );
}
