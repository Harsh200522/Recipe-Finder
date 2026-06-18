import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import SEO from './SEO';
import '../style/blog-detail.css';

/**
 * Comprehensive Nutrition Guide
 * Educational content about nutrition, macronutrients, micronutrients, and dietary strategies
 */

const NutritionGuide = () => {
  const [activeTab, setActiveTab] = useState('macronutrients');

  const sections = {
    macronutrients: {
      title: 'Macronutrients: Protein, Carbohydrates & Fats',
      icon: '🥗',
      content: `
<h2>Understanding Macronutrients</h2>
<p>Macronutrients are the three main nutrients your body needs in large quantities for energy and structure: protein, carbohydrates, and fats. Getting the right balance of each is essential for optimal health and achieving your goals.</p>

<h2>Protein: The Building Block</h2>
<h3>What is Protein?</h3>
<p>Protein is composed of amino acids that your body uses to build and repair tissues, produce enzymes and hormones, and support immune function. It's the only macronutrient containing nitrogen, making it unique for tissue building.</p>

<h3>Protein Functions:</h3>
<ul>
<li>Building and repairing muscle tissue</li>
<li>Creating enzymes and hormones</li>
<li>Supporting immune function</li>
<li>Making antibodies</li>
<li>Maintaining steady blood sugar</li>
</ul>

<h3>Daily Protein Recommendations</h3>
<ul>
<li><strong>Sedentary adults:</strong> 0.8g per kg body weight</li>
<li><strong>Active individuals:</strong> 1.2-1.6g per kg body weight</li>
<li><strong>Athletes/muscle building:</strong> 1.6-2.0g per kg body weight</li>
<li><strong>Older adults:</strong> 1.0-1.2g per kg body weight</li>
</ul>

<h3>Complete vs Incomplete Proteins</h3>
<p><strong>Complete proteins</strong> contain all 9 essential amino acids your body cannot produce. Sources: meat, fish, eggs, dairy, soy, quinoa.</p>
<p><strong>Incomplete proteins</strong> lack one or more essential amino acids. Plant proteins often require combining (rice + beans, hummus + pita).</p>

<h2>Carbohydrates: Your Energy Source</h2>
<h3>The Role of Carbs</h3>
<p>Carbohydrates are your body's primary energy source. They're broken down into glucose, which fuels your brain, muscles, and organs. Don't fear carbs - they're essential for optimal function.</p>

<h3>Types of Carbohydrates</h3>
<ul>
<li><strong>Simple carbs:</strong> Quick energy from fruit, honey, milk (use strategically)</li>
<li><strong>Complex carbs:</strong> Slow energy from whole grains, legumes, vegetables</li>
<li><strong>Fiber:</strong> Non-digestible carbs supporting digestion and satiety</li>
</ul>

<h3>Daily Carbohydrate Needs</h3>
<ul>
<li><strong>Sedentary individuals:</strong> 225-325g daily (45-65% of calories)</li>
<li><strong>Active individuals:</strong> 300-400g daily</li>
<li><strong>Endurance athletes:</strong> 400-600g daily</li>
<li><strong>Very low-carb diets:</strong> 50-100g daily (specialized approach)</li>
</ul>

<h2>Fats: Essential for Health</h2>
<h3>Why Fats Matter</h3>
<p>Dietary fats are essential for hormone production, brain function, vitamin absorption, and inflammation regulation. Healthy fats support cardiovascular health and nutrient absorption.</p>

<h3>Types of Dietary Fats</h3>
<ul>
<li><strong>Monounsaturated fats:</strong> Olive oil, avocado, nuts (reduce inflammation)</li>
<li><strong>Polyunsaturated fats:</strong> Omega-3s from fish, flax; Omega-6s from vegetable oils</li>
<li><strong>Saturated fats:</strong> Moderation recommended, found in coconut, meat, dairy</li>
<li><strong>Trans fats:</strong> Avoid artificial trans fats linked to heart disease</li>
</ul>

<h3>Daily Fat Recommendations</h3>
<ul>
<li><strong>General population:</strong> 50-80g daily (20-35% of calories)</li>
<li><strong>Heart-healthy approach:</strong> Focus on unsaturated fats</li>
<li><strong>Omega-3 to Omega-6 ratio:</strong> Aim for 1:4 ratio or better</li>
</ul>

<h2>Macronutrient Ratios for Different Goals</h2>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f0f0f0;">
<th style="border: 1px solid #ddd; padding: 10px;">Goal</th>
<th style="border: 1px solid #ddd; padding: 10px;">Protein</th>
<th style="border: 1px solid #ddd; padding: 10px;">Carbs</th>
<th style="border: 1px solid #ddd; padding: 10px;">Fats</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 10px;"><strong>Weight Loss</strong></td>
<td style="border: 1px solid #ddd; padding: 10px;">30-35%</td>
<td style="border: 1px solid #ddd; padding: 10px;">45-50%</td>
<td style="border: 1px solid #ddd; padding: 10px;">20-25%</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 10px;"><strong>Muscle Gain</strong></td>
<td style="border: 1px solid #ddd; padding: 10px;">30-35%</td>
<td style="border: 1px solid #ddd; padding: 10px;">45-50%</td>
<td style="border: 1px solid #ddd; padding: 10px;">20-25%</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 10px;"><strong>General Health</strong></td>
<td style="border: 1px solid #ddd; padding: 10px;">25-30%</td>
<td style="border: 1px solid #ddd; padding: 10px;">45-65%</td>
<td style="border: 1px solid #ddd; padding: 10px;">20-35%</td>
</tr>
</table>
      `,
    },
    micronutrients: {
      title: 'Micronutrients: Vitamins & Minerals',
      icon: '💊',
      content: `
<h2>Understanding Micronutrients</h2>
<p>Micronutrients are vitamins and minerals needed in small quantities for numerous essential functions. Despite their small amounts, they're critical for energy production, immune function, bone health, and disease prevention.</p>

<h2>Essential Vitamins</h2>
<h3>Fat-Soluble Vitamins (A, D, E, K)</h3>
<p>These vitamins are stored in body fat and don't need to be consumed daily.</p>
<ul>
<li><strong>Vitamin A:</strong> Vision, immune function, skin health | Sources: carrots, sweet potato, spinach</li>
<li><strong>Vitamin D:</strong> Bone health, immune function, mood | Sources: fatty fish, egg yolks, sunlight</li>
<li><strong>Vitamin E:</strong> Antioxidant, protects cells | Sources: nuts, seeds, oils</li>
<li><strong>Vitamin K:</strong> Blood clotting, bone health | Sources: leafy greens, broccoli</li>
</ul>

<h3>Water-Soluble Vitamins (B, C)</h3>
<p>These aren't stored and need regular consumption.</p>
<ul>
<li><strong>B Vitamins:</strong> Energy production, brain function | Sources: whole grains, meat, legumes</li>
<li><strong>Vitamin C:</strong> Immune support, collagen, antioxidant | Sources: citrus, berries, peppers</li>
</ul>

<h2>Essential Minerals</h2>
<ul>
<li><strong>Calcium:</strong> Bone health, muscle function | Recommended: 1000-1200mg daily</li>
<li><strong>Iron:</strong> Oxygen transport, energy | Recommended: 8mg (men), 18mg (women)</li>
<li><strong>Zinc:</strong> Immune function, wound healing | Recommended: 8-11mg daily</li>
<li><strong>Magnesium:</strong> Muscle, nerve, energy | Recommended: 310-400mg daily</li>
<li><strong>Potassium:</strong> Heart function, blood pressure | Recommended: 2600-3400mg daily</li>
</ul>

<h2>Common Nutritional Deficiencies</h2>
<ul>
<li><strong>Vitamin D deficiency:</strong> Affects 1 billion people globally; leads to weak bones and mood issues</li>
<li><strong>Iron deficiency:</strong> Most common nutrient deficiency; causes fatigue and weakness</li>
<li><strong>B12 deficiency:</strong> Common in vegans; requires supplementation or fortified foods</li>
<li><strong>Calcium deficiency:</strong> Risk increases with age, especially in women</li>
</ul>

<h2>Getting Micronutrients from Whole Foods</h2>
<p>The best approach is obtaining micronutrients from whole foods rather than supplements. Whole foods contain fiber, antioxidants, and phytonutrients that work synergistically.</p>

<h3>Nutrient-Dense Foods to Prioritize:</h3>
<ul>
<li><strong>Leafy greens:</strong> Spinach, kale, Swiss chard (iron, calcium, vitamins)</li>
<li><strong>Fatty fish:</strong> Salmon, mackerel, sardines (vitamin D, omega-3s)</li>
<li><strong>Eggs:</strong> Complete protein, vitamin D, choline</li>
<li><strong>Nuts and seeds:</strong> Magnesium, zinc, healthy fats</li>
<li><strong>Colorful vegetables:</strong> Different colors = different nutrients</li>
<li><strong>Whole grains:</strong> B vitamins, minerals, fiber</li>
<li><strong>Legumes:</strong> Iron, zinc, B vitamins</li>
</ul>
      `,
    },
    hydration: {
      title: 'Hydration: The Forgotten Essential',
      icon: '💧',
      content: `
<h2>Why Hydration Matters</h2>
<p>Water makes up 50-70% of your body weight and is essential for every function: temperature regulation, nutrient transport, waste removal, joint lubrication, and cognitive function.</p>

<h2>Daily Hydration Recommendations</h2>
<ul>
<li><strong>General rule:</strong> 8-10 cups (2-2.5 liters) daily for average person</li>
<li><strong>Formula-based:</strong> Divide body weight (lbs) by 2 to get ounces per day</li>
<li><strong>Activity-based:</strong> Add 12-16 oz water per 30 minutes of exercise</li>
<li><strong>Climate-based:</strong> Increase intake in hot weather or high altitude</li>
</ul>

<h2>Signs of Dehydration</h2>
<ul>
<li>Dark urine (pale yellow = well-hydrated)</li>
<li>Excessive thirst</li>
<li>Dry mouth and lips</li>
<li>Fatigue and weakness</li>
<li>Dizziness</li>
<li>Headaches</li>
<li>Poor athletic performance</li>
</ul>

<h2>Optimal Hydration Strategy</h2>
<ul>
<li>Drink water throughout the day, not just when thirsty</li>
<li>Monitor urine color (aim for pale yellow)</li>
<li>Increase intake with exercise and heat</li>
<li>Include hydrating foods (cucumber, watermelon, lettuce = 90%+ water)</li>
<li>Limit caffeine which has mild diuretic effects</li>
<li>Pre-hydrate before long exercise sessions</li>
</ul>

<h2>Electrolytes and Sports Hydration</h2>
<p>For exercise lasting over 60 minutes or intense sweating, consider electrolyte replacement. Sodium helps retain water and maintains muscle function. Sports drinks with 6-8% carbohydrates and electrolytes optimize rehydration and performance.</p>
      `,
    },
  };

  return (
    <>
      <SEO
        title="Nutrition Guide - Recipe Finder | Complete Guide to Macronutrients & Micronutrients"
        description="Learn everything about nutrition: macronutrients, micronutrients, hydration, and dietary strategies for your health goals."
        keywords="nutrition guide, macronutrients, micronutrients, vitamins, minerals, hydration"
        url="/nutrition-guide"
        type="article"
        author="Nutrition Expert"
      />

      <div className="nutrition-guide-container">
        {/* Hero Section */}
        <section className="guide-hero">
          <h1>Complete Nutrition Guide</h1>
          <p>Master the fundamentals of nutrition for optimal health and performance</p>
        </section>

        {/* Tab Navigation */}
        <div className="guide-tabs">
          <button
            className={`tab-btn ${activeTab === 'macronutrients' ? 'active' : ''}`}
            onClick={() => setActiveTab('macronutrients')}
          >
            🥗 Macronutrients
          </button>
          <button
            className={`tab-btn ${activeTab === 'micronutrients' ? 'active' : ''}`}
            onClick={() => setActiveTab('micronutrients')}
          >
            💊 Micronutrients
          </button>
          <button
            className={`tab-btn ${activeTab === 'hydration' ? 'active' : ''}`}
            onClick={() => setActiveTab('hydration')}
          >
            💧 Hydration
          </button>
        </div>

        {/* Content Section */}
        <section className="guide-content">
          <div dangerouslySetInnerHTML={{ __html: sections[activeTab].content }} />
        </section>

        {/* Key Takeaways */}
        <section className="guide-takeaways">
          <h2>Key Takeaways</h2>
          <ul>
            <li>Balance protein (20-35%), carbs (45-65%), and fats (20-35%) based on your goals</li>
            <li>Prioritize whole foods to get comprehensive micronutrients</li>
            <li>Stay hydrated - drink water throughout the day</li>
            <li>Individual needs vary - adjust based on activity level, age, and health status</li>
            <li>Consult healthcare providers for personalized nutrition advice</li>
          </ul>
        </section>

        {/* Related Resources */}
        <section className="guide-resources">
          <h2>Related Resources</h2>
          <div className="resources-grid">
            <a href="/blog" className="resource-card">
              <h3>Nutrition Blog Articles</h3>
              <p>Evidence-based guides on specific dietary approaches</p>
            </a>
            <a href="/meal-planner" className="resource-card">
              <h3>Meal Planner</h3>
              <p>Create balanced meal plans matching your nutrition goals</p>
            </a>
            <a href="/faq" className="resource-card">
              <h3>Nutrition FAQ</h3>
              <p>Common questions about nutrition and healthy eating</p>
            </a>
          </div>
        </section>
      </div>
    </>
  );
};

export default NutritionGuide;
