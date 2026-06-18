import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import SEO from './SEO';
import { createHowToSchema } from './StructuredData';
import '../style/blog-detail.css';

/**
 * Comprehensive Meal Planning Guide
 * Complete system for effective meal planning and preparation
 */

const MealPlanningGuide = () => {
  const [selectedStep, setSelectedStep] = useState(1);

  const planningSteps = [
    {
      id: 1,
      title: 'Step 1: Define Your Goals & Constraints',
      duration: '15 minutes',
      content: `
<h2>Understanding Your Starting Point</h2>
<p>Before planning meals, you need clarity on your objectives and limitations.</p>

<h3>Goal Categories:</h3>
<ul>
<li><strong>Weight Loss:</strong> Create caloric deficit while maintaining energy and satisfaction</li>
<li><strong>Muscle Gain:</strong> Increase calories and protein for muscle protein synthesis</li>
<li><strong>Athletic Performance:</strong> Optimize energy, hydration, and nutrient timing</li>
<li><strong>Disease Management:</strong> Specific dietary approaches (diabetes, heart disease, etc.)</li>
<li><strong>General Health:</strong> Balanced nutrition and sustainable eating patterns</li>
<li><strong>Efficiency/Cost:</strong> Minimize time and money spent on food</li>
</ul>

<h3>Important Constraints to Document:</h3>
<ul>
<li><strong>Dietary Restrictions:</strong> Allergies, intolerances, religious, ethical</li>
<li><strong>Food Preferences:</strong> Foods you love and foods you dislike</li>
<li><strong>Kitchen Equipment:</strong> Access to stove, oven, blender, etc.</li>
<li><strong>Time Available:</strong> How many hours weekly for shopping and prep?</li>
<li><strong>Budget:</strong> Weekly grocery budget limits</li>
<li><strong>Storage:</strong> Refrigerator and freezer space</li>
<li><strong>Cooking Skills:</strong> Beginner, intermediate, or advanced</li>
</ul>

<h3>Action Items:</h3>
<ol>
<li>Write down your primary goal</li>
<li>List non-negotiable dietary restrictions</li>
<li>List 10+ foods you love</li>
<li>List 10 foods you dislike or want to avoid</li>
<li>Calculate weekly time available for meal prep</li>
<li>Set weekly grocery budget</li>
</ol>
      `,
    },
    {
      id: 2,
      title: 'Step 2: Determine Your Nutritional Needs',
      duration: '10 minutes',
      content: `
<h2>Calculating Your Nutrition Target</h2>
<p>Different goals require different nutrition profiles.</p>

<h3>Step 1: Calculate Daily Calorie Needs</h3>
<p><strong>Formula for Basal Metabolic Rate (BMR):</strong></p>
<ul>
<li><strong>Men:</strong> (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5</li>
<li><strong>Women:</strong> (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161</li>
</ul>

<p><strong>Step 2: Multiply by Activity Factor:</strong></p>
<ul>
<li>Sedentary (little exercise): BMR × 1.2</li>
<li>Lightly active (1-3 days/week): BMR × 1.375</li>
<li>Moderately active (3-5 days/week): BMR × 1.55</li>
<li>Very active (6-7 days/week): BMR × 1.725</li>
<li>Extremely active (physical job + training): BMR × 1.9</li>
</ul>

<h3>Calorie Adjustments for Goals</h3>
<ul>
<li><strong>Weight Loss:</strong> Subtract 300-500 calories from maintenance (0.5-1 lb/week loss)</li>
<li><strong>Muscle Gain:</strong> Add 300-500 calories to maintenance</li>
<li><strong>Maintenance:</strong> Your TDEE (Total Daily Energy Expenditure)</li>
</ul>

<h3>Step 3: Determine Macronutrient Split</h3>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f0f0f0;">
<th style="border: 1px solid #ddd; padding: 10px;">Goal</th>
<th style="border: 1px solid #ddd; padding: 10px;">Protein (g/lb)</th>
<th style="border: 1px solid #ddd; padding: 10px;">Carbs %</th>
<th style="border: 1px solid #ddd; padding: 10px;">Fat %</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 10px;">Weight Loss</td>
<td style="border: 1px solid #ddd; padding: 10px;">1.0-1.1</td>
<td style="border: 1px solid #ddd; padding: 10px;">40-50%</td>
<td style="border: 1px solid #ddd; padding: 10px;">20-30%</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 10px;">Muscle Gain</td>
<td style="border: 1px solid #ddd; padding: 10px;">0.8-1.0</td>
<td style="border: 1px solid #ddd; padding: 10px;">45-50%</td>
<td style="border: 1px solid #ddd; padding: 10px;">25-30%</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 10px;">General Health</td>
<td style="border: 1px solid #ddd; padding: 10px;">0.7-0.8</td>
<td style="border: 1px solid #ddd; padding: 10px;">45-65%</td>
<td style="border: 1px solid #ddd; padding: 10px;">20-35%</td>
</tr>
</table>

<h3>Calculation Example</h3>
<p>150-pound woman, moderately active, weight loss goal:</p>
<ul>
<li>BMR ≈ 1400 calories</li>
<li>TDEE = 1400 × 1.55 = 2170 calories</li>
<li>Target = 2170 - 400 = 1770 calories for weight loss</li>
<li>Protein = 150 × 1.1 = 165g (660 calories)</li>
<li>Carbs = 1770 × 0.45 / 4 = 199g</li>
<li>Fat = 1770 × 0.25 / 9 = 49g</li>
</ul>
      `,
    },
    {
      id: 3,
      title: 'Step 3: Build Your Food Foundation',
      duration: '20 minutes',
      content: `
<h2>Creating Your Personal Food List</h2>
<p>The best meal plan includes foods you genuinely enjoy eating.</p>

<h3>Protein Sources to Choose From</h3>
<ul>
<li><strong>Animal proteins:</strong> Chicken, turkey, beef, fish, eggs, Greek yogurt, cottage cheese</li>
<li><strong>Plant proteins:</strong> Lentils, chickpeas, tofu, tempeh, beans, nuts, seeds</li>
<li><strong>Dairy:</strong> Milk, cheese, yogurt (if tolerated)</li>
</ul>

<h3>Carbohydrate Sources</h3>
<ul>
<li><strong>Whole grains:</strong> Brown rice, oats, quinoa, whole wheat bread, sweet potato</li>
<li><strong>Vegetables:</strong> Broccoli, spinach, carrots, peppers, zucchini</li>
<li><strong>Fruits:</strong> Berries, bananas, apples, oranges, melons</li>
<li><strong>Legumes:</strong> Lentils, chickpeas, beans (dual protein + carb source)</li>
</ul>

<h3>Healthy Fats</h3>
<ul>
<li>Olive oil, avocado, nuts, seeds, fatty fish, coconut oil</li>
</ul>

<h3>Your Personal Selection Process</h3>
<ol>
<li>List 3-4 protein sources you'll eat regularly</li>
<li>List 5-6 carbohydrate sources</li>
<li>List 3-4 vegetable options</li>
<li>List 2-3 fruit options</li>
<li>List 2-3 fat sources</li>
<li>List staple seasonings and condiments</li>
</ol>

<h3>Building Balanced Plates</h3>
<p>Simple formula: 1/3 protein + 1/3 carbohydrate + 1/3 vegetables (cooked in healthy fat)</p>
<p><strong>Example:</strong> 5 oz grilled chicken + 3/4 cup brown rice + 1.5 cups roasted broccoli</p>
      `,
    },
    {
      id: 4,
      title: 'Step 4: Plan Your Weekly Menu',
      duration: '30 minutes',
      content: `
<h2>Creating Your Weekly Menu</h2>
<p>This is where the system comes together.</p>

<h3>Weekly Menu Template</h3>
<p>Choose breakfast, lunch, dinner, and 1-2 snacks for each day. Many people use theme nights to simplify:</p>
<ul>
<li><strong>Monday:</strong> Chicken dishes</li>
<li><strong>Tuesday:</strong> Seafood</li>
<li><strong>Wednesday:</strong> Vegetarian/legume-based</li>
<li><strong>Thursday:</strong> Ground meat</li>
<li><strong>Friday:</strong> Lighter meals or favorites</li>
<li><strong>Saturday:</strong> Try new recipe</li>
<li><strong>Sunday:</strong> Leftovers/prep day</li>
</ul>

<h3>Planning Tools & Tips</h3>
<ul>
<li>Use a spreadsheet to track meals and nutrition</li>
<li>Aim for 2-3 dinners worth of leftovers for lunch</li>
<li>Keep breakfast simple (oatmeal, yogurt, eggs)</li>
<li>Pre-decided snacks prevent impulse choices</li>
<li>Plan for 2 unplanned meals/week (restaurant, social events)</li>
</ul>

<h3>Macro Tracking Strategy</h3>
<ul>
<li>Use apps like MyFitnessPal, Cronometer, or LoseIt</li>
<li>Log meals while planning to verify hitting targets</li>
<li>Adjust as needed before shopping</li>
<li>Accept ±5-10% variance from targets as acceptable</li>
</ul>
      `,
    },
    {
      id: 5,
      title: 'Step 5: Generate Shopping List & Shop',
      duration: '25 minutes (shopping)',
      content: `
<h2>Strategic Shopping Execution</h2>

<h3>Creating Your Shopping List</h3>
<ul>
<li><strong>Organize by store layout:</strong> Produce → Meat → Dairy → Pantry</li>
<li><strong>Include quantities:</strong> Specific amounts prevent overbuying</li>
<li><strong>Add staples:</strong> Oil, spices, basic ingredients</li>
<li><strong>Use unit prices:</strong> Calculate per-ounce costs for value</li>
<li><strong>Plan for sales:</strong> Build meal plan around what's on sale</li>
</ul>

<h3>Shopping Smart Tips</h3>
<ul>
<li>Never shop hungry - makes poor impulse choices</li>
<li>Stick to your list religiously</li>
<li>Shop store perimeter first (fresh foods)</li>
<li>Check expiration dates, especially on proteins</li>
<li>Choose frozen vegetables and fruit (just as nutritious, less waste)</li>
<li>Buy store brands for significant savings (95% same quality)</li>
<li>Shopping stores with good sales (weekly ads) saves money</li>
</ul>

<h3>Estimated Budget per Person</h3>
<ul>
<li><strong>Budget meals:</strong> $5-7 per day</li>
<li><strong>Moderate meals:</strong> $8-12 per day</li>
<li><strong>Premium meals:</strong> $13-18 per day</li>
<li>Buying in bulk and using sales reduces costs significantly</li>
</ul>
      `,
    },
    {
      id: 6,
      title: 'Step 6: Meal Prep & Storage',
      duration: '2-3 hours (once weekly)',
      content: `
<h2>Efficient Meal Preparation</h2>

<h3>Prep Day Setup</h3>
<ul>
<li><strong>Choose your day:</strong> Sunday is popular, but choose what works</li>
<li><strong>Block time:</strong> 2-3 hours dedicated to prep</li>
<li><strong>Gather containers:</strong> Glass or BPA-free plastic</li>
<li><strong>Organize workspace:</strong> Clean, organized space speeds up process</li>
</ul>

<h3>Prepping Steps</h3>
<ol>
<li><strong>Wash produce:</strong> Especially leafy greens</li>
<li><strong>Chop vegetables:</strong> Store in containers or bags</li>
<li><strong>Cook grains:</strong> Rice, quinoa, oats in bulk</li>
<li><strong>Cook proteins:</strong> Chicken, ground meat, or tofu</li>
<li><strong>Portion ingredients:</strong> Into individual containers</li>
<li><strong>Combine meals:</strong> Mix components into complete meals</li>
<li><strong>Label containers:</strong> Date and contents for easy identification</li>
</ol>

<h3>Storage Guidelines</h3>
<ul>
<li><strong>Refrigerator:</strong> Most prepared meals last 3-5 days</li>
<li><strong>Freezer:</strong> Portions you won't eat within 3 days; thaw overnight</li>
<li><strong>Room temperature:</strong> Only shelf-stable items (whole grains, canned goods)</li>
<li><strong>Food safety:</strong> Keep hot foods hot, cold foods cold</li>
<li><strong>Portion sizes:</strong> Pre-portion prevents overeating</li>
</ul>

<h3>Container Investment</h3>
<p>Good containers are worth the investment:</p>
<ul>
<li>Glass: Lasts longer, doesn't stain, microwave-safe</li>
<li>Plastic: Lightweight, cheaper, suffices if quality brand</li>
<li>Invest in 10-15 containers that last years</li>
</ul>
      `,
    },
    {
      id: 7,
      title: 'Step 7: Track, Assess & Adjust',
      duration: 'Ongoing',
      content: `
<h2>Continuous Improvement System</h2>

<h3>Tracking Metrics</h3>
<ul>
<li><strong>Weight:</strong> Track weekly (average trend, not daily fluctuation)</li>
<li><strong>Measurements:</strong> Body composition changes (waist, chest, thighs)</li>
<li><strong>Energy levels:</strong> How do you feel throughout the day?</li>
<li><strong>Digestion:</strong> Any bloating, gas, or digestive issues?</li>
<li><strong>Performance:</strong> Strength, endurance, exercise performance</li>
<li><strong>Adherence:</strong> Are you following the plan?</li>
<li><strong>Satisfaction:</strong> Are you enjoying the meals?</li>
</ul>

<h3>Assessment Points (Every 4 Weeks)</h3>
<ol>
<li>Review progress toward goal (weight, energy, performance)</li>
<li>Assess adherence (harder than expected? Too restrictive?)</li>
<li>Note meals you loved and meals you disliked</li>
<li>Consider any digestive issues</li>
<li>Evaluate budget adherence</li>
</ol>

<h3>Adjustment Strategy</h3>
<ul>
<li><strong>No progress:</strong> Reduce calories by 100-200 or increase activity</li>
<li><strong>No adherence:</strong> Plan is too restrictive; include more foods you enjoy</li>
<li><strong>Too much hunger:</strong> Add more protein and fiber; adjust meal timing</li>
<li><strong>Plateaued results:</strong> Change exercises, vary meals, reduce calories further</li>
<li><strong>Bored with meals:</strong> Try new recipes, different seasonings, new protein sources</li>
</ul>

<h3>Long-Term Sustainability</h3>
<p>The goal isn't perfection - it's creating sustainable habits:</p>
<ul>
<li>Accept 80/20 rule (80% adherent, 20% flexible)</li>
<li>Build meals you love, not meals you tolerate</li>
<li>Adjust plan as life changes (work, stress, illness)</li>
<li>Focus on gradual, sustainable changes</li>
<li>Celebrate progress, don't dwell on setbacks</li>
</ul>
      `,
    },
  ];

  const currentStep = planningSteps.find((s) => s.id === selectedStep);

  return (
    <>
      <SEO
        title="Meal Planning Guide - Recipe Finder | Complete 7-Step System"
        description="Master meal planning with this comprehensive 7-step guide covering goals, nutrition calculations, menu planning, shopping, prep, and tracking."
        keywords="meal planning, meal prep, nutrition planning, meal planner guide"
        url="/meal-planning-guide"
        type="article"
        author="Nutrition Coach"
      />

      <div className="meal-plan-guide-container">
        {/* Hero Section */}
        <section className="guide-hero">
          <h1>Complete Meal Planning Guide</h1>
          <p>Master the 7-step system to plan, prep, and maintain healthy eating habits</p>
        </section>

        {/* Introduction */}
        <section className="guide-intro">
          <h2>Why Meal Planning Works</h2>
          <p>Research shows that people who plan their meals:</p>
          <ul>
            <li>✓ Achieve 23% more success with health goals</li>
            <li>✓ Spend 25-30% less on groceries</li>
            <li>✓ Consume 15% fewer calories when dieting</li>
            <li>✓ Save 5-7 hours per week on food decisions</li>
            <li>✓ Waste 30% less food</li>
            <li>✓ Make healthier food choices</li>
          </ul>
        </section>

        <div className="guide-wrapper">
          {/* Step Navigation */}
          <div className="steps-sidebar">
            <h3>7-Step System</h3>
            {planningSteps.map((step) => (
              <button
                key={step.id}
                className={`step-btn ${selectedStep === step.id ? 'active' : ''}`}
                onClick={() => setSelectedStep(step.id)}
              >
                <span className="step-number">{step.id}</span>
                <span className="step-title">{step.title.split(':')[0]}</span>
                <span className="step-duration">{step.duration}</span>
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="step-content">
            <h2>{currentStep.title}</h2>
            <p className="step-duration-header">⏱️ Estimated Time: {currentStep.duration}</p>
            <div dangerouslySetInnerHTML={{ __html: currentStep.content }} />
          </div>
        </div>

        {/* Quick Summary */}
        <section className="guide-summary">
          <h2>Quick Reference</h2>
          <div className="summary-cards">
            <div className="card">
              <h3>✓ Goal Setting</h3>
              <p>Define clear objectives and constraints</p>
            </div>
            <div className="card">
              <h3>✓ Nutrition Math</h3>
              <p>Calculate calories and macronutrients</p>
            </div>
            <div className="card">
              <h3>✓ Food Selection</h3>
              <p>Choose foods you genuinely enjoy</p>
            </div>
            <div className="card">
              <h3>✓ Weekly Planning</h3>
              <p>Create balanced meal combinations</p>
            </div>
            <div className="card">
              <h3>✓ Smart Shopping</h3>
              <p>Generate list and execute strategically</p>
            </div>
            <div className="card">
              <h3>✓ Meal Prep</h3>
              <p>Batch prepare for the week</p>
            </div>
            <div className="card">
              <h3>✓ Track & Adjust</h3>
              <p>Monitor progress and optimize continuously</p>
            </div>
          </div>
        </section>

        {/* Related Resources */}
        <section className="guide-resources">
          <h2>Additional Resources</h2>
          <div className="resources-grid">
            <a href="/nutrition-guide" className="resource-card">
              <h3>Nutrition Guide</h3>
              <p>Learn about macronutrients and micronutrients</p>
            </a>
            <a href="/meal-planner" className="resource-card">
              <h3>Meal Planner Tool</h3>
              <p>Create personalized meal plans instantly</p>
            </a>
            <a href="/blog" className="resource-card">
              <h3>Meal Planning Articles</h3>
              <p>Expert tips and strategies for success</p>
            </a>
          </div>
        </section>
      </div>
    </>
  );
};

export default MealPlanningGuide;
