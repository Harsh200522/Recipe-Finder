import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import SEO from './SEO';
import { createFAQSchema } from './StructuredData';
import '../style/faqmodal.css';

/**
 * Comprehensive FAQ Page - AdSense Quality Content
 * Addresses common questions about recipes, nutrition, and cooking
 */

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('General');
  const [expandedItems, setExpandedItems] = useState({});

  const faqData = {
    General: [
      {
        id: 1,
        question: 'What is Recipe Finder and how can it help me?',
        answer:
          'Recipe Finder is a comprehensive cooking and meal planning platform designed to help home cooks discover recipes, plan nutritious meals, and master cooking techniques. Our platform combines thousands of recipes with expert nutritional guidance, meal planning tools, and cooking tutorials to support your culinary journey, whether you\'re a beginner or experienced cook.',
      },
      {
        id: 2,
        question: 'Is Recipe Finder free to use?',
        answer:
          'Recipe Finder offers both free and premium features. Our basic recipe discovery, blog content, and many tools are completely free. Premium membership provides additional benefits like advanced meal planning, personalized nutrition tracking, and exclusive video tutorials. You can explore most features without creating an account.',
      },
      {
        id: 3,
        question: 'Do I need to create an account to use the site?',
        answer:
          'No, you don\'t need an account to browse recipes and read our blog content. However, creating a free account allows you to save favorite recipes, create custom meal plans, and access your saved items across devices.',
      },
      {
        id: 4,
        question: 'How often is new content added?',
        answer:
          'We update our recipe database daily with new recipes from verified sources. Our blog publishes new articles 2-3 times weekly, covering nutrition tips, cooking techniques, and meal planning strategies. Our cooking video tutorials are updated weekly.',
      },
    ],
    Recipes: [
      {
        id: 5,
        question: 'How are recipes tested and verified?',
        answer:
          'Every recipe on Recipe Finder is tested in our kitchens and by our network of verified home cooks. We provide detailed nutritional information calculated by registered dietitians. Recipes include prep/cook times, ingredient lists, step-by-step instructions, and user reviews.',
      },
      {
        id: 6,
        question: 'Can I modify recipes to fit my dietary needs?',
        answer:
          'Absolutely! Our ingredient substitution guide helps you adapt any recipe. We provide alternatives for common allergies (nuts, dairy, gluten), dietary preferences (vegan, keto, low-carb), and other modifications. Each recipe shows nutritional impact of substitutions.',
      },
      {
        id: 7,
        question: 'How do I scale a recipe for different serving sizes?',
        answer:
          'Use our Serving Calculator tool available on every recipe page. Simply enter your desired serving size, and we automatically adjust all ingredient quantities and cooking times. This is especially useful for meal planning or cooking for different group sizes.',
      },
      {
        id: 8,
        question: 'How are recipes organized by difficulty level?',
        answer:
          'Each recipe includes a difficulty rating (Beginner, Intermediate, Advanced) based on technique complexity, equipment needed, and preparation steps. Beginners can filter to show only simple recipes, while experienced cooks can challenge themselves with advanced preparations.',
      },
      {
        id: 9,
        question: 'Can I print recipes or save them for offline use?',
        answer:
          'Yes, every recipe has a print-friendly version optimized for paper. You can also save recipes to your favorites, which are accessible offline if you\'ve downloaded our mobile app or bookmarked pages in your browser.',
      },
    ],
    Nutrition: [
      {
        id: 10,
        question: 'Where does the nutritional information come from?',
        answer:
          'All nutritional data is calculated using industry-standard USDA nutrition databases and verified by registered dietitians. We provide complete macronutrient breakdown (protein, carbs, fats, fiber, sugars) and micronutrients per serving.',
      },
      {
        id: 11,
        question: 'Are the calorie counts accurate?',
        answer:
          'Nutritional information is calculated using standardized ingredient databases and verified by nutritionists. However, actual values may vary based on specific brands used, preparation methods, and ingredient variations. Use this as a guide, not a definitive measurement.',
      },
      {
        id: 12,
        question: 'How do I use meal planning for weight loss?',
        answer:
          'Our blog includes comprehensive guides on calorie-controlled meal planning. Start by determining your daily calorie needs, then use our recipe filters to find meals matching your target calories. Our meal planner automatically tracks daily totals, making it easy to maintain a caloric deficit for sustainable weight loss.',
      },
      {
        id: 13,
        question: 'What nutritional guidance does Recipe Finder provide?',
        answer:
          'We publish evidence-based nutrition articles written by registered dietitians. Topics include macro and micronutrient needs, dietary approaches (Mediterranean, keto, vegan), food allergies, and disease-specific nutrition (diabetes, heart health). We recommend consulting your healthcare provider for personalized nutrition advice.',
      },
      {
        id: 14,
        question: 'How can I track my daily nutrition intake?',
        answer:
          'Premium members can use our nutrition tracking tool, which logs daily meals and automatically calculates totals for calories, macronutrients, and key micronutrients. You can set personal nutrition goals and track progress over time.',
      },
    ],
    MealPlanning: [
      {
        id: 15,
        question: 'How do I create a weekly meal plan?',
        answer:
          'Our interactive meal planner guides you through the process: (1) Set nutrition goals, (2) Select number of meals per day, (3) Choose from recipe suggestions based on your criteria, (4) Generate a shopping list. The entire process typically takes 15-20 minutes for a weekly plan.',
      },
      {
        id: 16,
        question: 'Can the meal planner generate shopping lists?',
        answer:
          'Yes! After creating your meal plan, our system generates a comprehensive shopping list organized by store section (produce, meat, dairy, pantry, etc.). You can check items as you shop, and the app can be used on your phone at the store.',
      },
      {
        id: 17,
        question: 'How does meal planning save money?',
        answer:
          'Research shows planned shoppers spend 25-30% less on groceries because meal planning eliminates impulse purchases and food waste. Our tool helps you buy only what you\'ll use, plan around sales, and take advantage of seasonal produce prices.',
      },
      {
        id: 18,
        question: 'Can I save multiple meal plans?',
        answer:
          'Yes, premium members can save unlimited meal plans and access them anytime. You can create plans for different goals (weight loss, muscle building, cost-saving), dietary restrictions, or family preferences.',
      },
      {
        id: 19,
        question: 'How do I handle dietary restrictions in meal planning?',
        answer:
          'Specify your dietary restrictions (allergies, vegan, gluten-free, keto, etc.) in your profile. The meal planner will automatically filter to show only compatible recipes. You can add multiple restrictions and the tool adapts accordingly.',
      },
    ],
    CookingTechniques: [
      {
        id: 20,
        question: 'Where can I learn cooking techniques?',
        answer:
          'Our Cooking Tutorials section includes written guides with photos and step-by-step instructions for essential techniques (knife skills, heat control, cooking methods). We also offer video tutorials on our YouTube channel demonstrating proper technique.',
      },
      {
        id: 21,
        question: 'What are common cooking mistakes and how do I avoid them?',
        answer:
          'Our blog regularly publishes articles on common cooking mistakes and how to fix them. Topics include improper heat control, overcooking proteins, not seasoning properly, and inadequate prep work. Each article includes tips to improve your results.',
      },
      {
        id: 22,
        question: 'How do cooking methods affect nutritional content?',
        answer:
          'Different cooking methods preserve nutrients differently. Our guide explains how grilling, roasting, steaming, and boiling impact vitamins and minerals. Generally, gentler methods like steaming preserve more heat-sensitive nutrients than high-heat frying.',
      },
      {
        id: 23,
        question: 'What equipment do beginners need?',
        answer:
          'Check our Beginner\'s Kitchen Guide for essential equipment (sharp knives, cutting board, pots, pans, mixing bowls). Most recipes can be prepared with basic kitchen equipment. We provide recipes organized by equipment needed.',
      },
    ],
    Community: [
      {
        id: 24,
        question: 'Can I share my own recipes?',
        answer:
          'Yes! Members can submit their own recipes to our community platform. Submitted recipes go through a verification process and are featured in a "Community Recipes" section with proper attribution to the recipe creator.',
      },
      {
        id: 25,
        question: 'How do recipe ratings and reviews work?',
        answer:
          'Users can rate recipes (1-5 stars) and write reviews sharing their experience, modifications made, or tips for success. These reviews help other cooks decide which recipes to try and provide valuable feedback to recipe creators.',
      },
      {
        id: 26,
        question: 'Can I follow other users and see their recipes?',
        answer:
          'Yes, our community features allow you to follow other users, see their saved recipes, and get inspired by their meal planning choices. You can also create a public or private profile with your favorite recipes.',
      },
      {
        id: 27,
        question: 'Is there a way to get recipe recommendations?',
        answer:
          'Our algorithm provides personalized recipe recommendations based on your saved recipes, ratings, cooking frequency, and dietary preferences. The more you interact with the platform, the better our recommendations become.',
      },
    ],
    Account: [
      {
        id: 28,
        question: 'How do I reset my password?',
        answer:
          'Click "Forgot Password" on the login page and enter your email address. We\'ll send you a password reset link. Click the link and follow instructions to create a new password. The link expires for security reasons, so reset promptly if needed.',
      },
      {
        id: 29,
        question: 'How is my personal data protected?',
        answer:
          'We use industry-standard encryption (SSL/TLS) for all data transmission and storage. Your password is hashed and never stored in plain text. We don\'t sell your data to third parties. Review our Privacy Policy for complete details.',
      },
      {
        id: 30,
        question: 'Can I delete my account?',
        answer:
          'Yes, you can request account deletion anytime in your account settings. This removes all personal data and recipes you\'ve submitted. Downloaded content can no longer be accessed, but archived recipes remain available.',
      },
      {
        id: 31,
        question: 'Do you collect my data for marketing?',
        answer:
          'We use analytics to understand user behavior and improve our service. You can manage your preferences in account settings to limit marketing emails. We respect your privacy and don\'t sell data to third parties.',
      },
    ],
  };

  const handleToggle = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const categories = Object.keys(faqData);
  const activeItems = faqData[activeCategory] || [];

  // Create FAQ schema for SEO
  const faqSchema = createFAQSchema(activeItems);

  return (
    <>
      <SEO
        title="FAQ - Recipe Finder | Common Questions About Recipes & Meal Planning"
        description="Get answers to common questions about Recipe Finder, recipes, nutrition, meal planning, cooking techniques, and more."
        keywords="FAQ, frequently asked questions, recipe help, meal planning help, cooking tips"
        url="/faq"
        type="FAQPage"
        schema={faqSchema}
      />

      <div className="faq-container">
        {/* Hero Section */}
        <section className="faq-hero">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about Recipe Finder and cooking</p>
        </section>

        <div className="faq-wrapper">
          {/* Category Navigation */}
          <div className="faq-categories">
            <h3>Categories</h3>
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(category);
                  setExpandedItems({});
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="faq-content">
            <h2>{activeCategory}</h2>
            {activeItems.map((item) => (
              <div key={item.id} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => handleToggle(item.id)}
                >
                  <span>{item.question}</span>
                  {expandedItems[item.id] ? (
                    <FaChevronUp className="faq-icon" />
                  ) : (
                    <FaChevronDown className="faq-icon" />
                  )}
                </button>
                {expandedItems[item.id] && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support Section */}
        <section className="faq-support">
          <h2>Didn't find your answer?</h2>
          <p>Contact our support team for additional help with your questions.</p>
          <a href="/contact" className="btn btn-primary">
            Contact Support
          </a>
        </section>
      </div>
    </>
  );
};

export default FAQPage;
