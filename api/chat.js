// Comprehensive knowledge base for Recipe Finder
const knowledgeBase = {
  // Search & Recipes
  "search recipe": "Use the search bar on the home page to find recipes by name. You can also search by specific ingredients!",
  "search by ingredients": "Enter the ingredients you have in the search box. Recipe Finder will show you recipes that use those ingredients.",
  "how to search": "Type any recipe name or ingredient in the search bar on the home page and press Enter or click Search.",
  "recipe not loading": "Try refreshing the page (Ctrl+R) or check your internet connection. If it still doesn't work, try searching again.",
  "no results found": "Try searching with different keywords or check the spelling. You can also search by ingredient instead of recipe name.",
  
  // AI Cook Feature
  "cook with ai": "On the home page, scroll to 'Cook with AI' section. Enter ingredients you have, set your preferences (veg/non-veg, cooking time, cuisine), and click Search. AI will generate a custom recipe!",
  "ai cook not working": "Check your internet connection and try again. The AI cook feature generates recipes based on ingredients you provide.",
  "ai recipe suggestions": "Set filters like: vegetarian/non-vegetarian, cooking time (under 15/30/60 mins), cuisine type, and difficulty level for personalized recipes.",
  
  // Favorites
  "save recipe": "Click the red heart icon (❤️) on any recipe card to add it to your favorites. You can view all saved recipes in the Favorites section.",
  "how to save favorites": "Look for the heart icon on recipe cards. Click it once to save, click again to remove from favorites.",
  "view favorites": "Click on 'Favorites' in the navigation menu to see all your saved recipes.",
  "favorite recipe not saved": "Make sure you're logged in. Favorites are saved per user account.",
  
  // Meal Planner
  "meal planner": "Go to 'Meal Planner' section to plan your weekly meals. Add recipes to specific days and get reminders for grocery shopping.",
  "use meal planner": "1. Click Meal Planner in menu. 2. Select a day. 3. Add recipes. 4. Save your plan. You'll get reminders!",
  "meal planner reminder": "Enable notifications in your browser settings. We'll send you reminders for your planned meals.",
  "meal planner not saving": "Click the Save button after adding recipes. Make sure you're logged in to your account.",
  "how to plan meals": "Use the meal planner to organize your meals for the week. Add recipes you want to cook and get smart reminders.",
  
  // Serving Calculator
  "serving calculator": "On any recipe page, look for the serving size adjuster. Change the number and all ingredient quantities automatically adjust.",
  "adjust servings": "Find the serving input field on recipe page. Enter desired servings and ingredient amounts will calculate automatically.",
  "change recipe servings": "Use the serving size changer next to ingredients. All portions adjust proportionally.",
  
  // Cooking Videos
  "cooking videos": "Each recipe has a 'Watch Video' button or YouTube suggestion. Click to see step-by-step cooking instructions on video.",
  "recipe video not playing": "Refresh the page or check your internet. Videos are hosted on YouTube.",
  "video suggestions": "Many recipes include YouTube search suggestions. Click to find visual cooking guides.",
  
  // Community & Comments
  "community recipes": "Check 'Community Recipes' section to see recipes shared by other users in the Recipe Finder community.",
  "share recipe": "Create a recipe and submit it to the community. Other users can see and cook your recipes!",
  "comment on recipe": "Scroll to the comments section on any recipe and type your feedback. Other users can see your thoughts.",
  "like or dislike recipe": "Click the thumbs up 👍 to like or thumbs down 👎 to dislike recipes. Help other users find the best recipes!",
  
  // Shopping & Cart
  "shopping list": "Click 'Add to Cart' on any recipe to create a shopping list of all ingredients you need.",
  "amazon shopping": "Click 'Shop on Amazon' to search for ingredients. Get links to buy them online.",
  "ingredient search": "Use the shopping feature to search for specific ingredients and find prices online.",
  
  // Account & Login
  "login": "Click 'Login' in the menu. Enter your email and password. New users can click 'Sign Up' to create an account.",
  "sign up": "Click 'Sign Up' button. Enter email, password, and click Create Account. Verify your email to complete signup.",
  "forgot password": "Click 'Forgot Password' on login page. Enter your email and follow the reset link sent to your inbox.",
  "reset password": "Go to Forgot Password, enter email, check inbox for reset link, and create a new password.",
  "login problem": "Check your email/password spelling. Make sure caps lock is off. Refresh page and try again.",
  "cannot login": "Try resetting your password. If still having issues, use the contact form to reach support.",
  "create account": "Click Sign Up, enter email, create strong password, and verify your email address.",
  "account not verified": "Check your email inbox and spam folder for verification email. Click the verification link.",
  
  // Profile & Settings
  "profile settings": "Click on your profile icon in top right corner to access profile settings and account options.",
  "change profile": "Go to 'Profile Settings' to update your name, email, password, and preferences.",
  "update account info": "Visit Profile Settings to change your display name, email, and other account details.",
  "dark mode": "Look for the theme toggle (usually moon/sun icon) in settings or navigation menu to switch between light and dark mode.",
  "toggle dark mode": "Click the theme icon in the header to switch between light and dark mode.",
  
  // Technical Issues
  "page not loading": "Refresh the page (Ctrl+R) or clear browser cache. Check internet connection.",
  "recipes loading slow": "Check your internet connection. Disable browser extensions that might slow down loading.",
  "app not responding": "Refresh the page. Clear browser cache. Try different browser if problem persists.",
  "website slow": "Clear browser cache and cookies. Disable ad blockers. Check internet speed.",
  "error message": "Take a screenshot of the error and contact support using the Contact Us form.",
  "browser issue": "Try using Chrome, Firefox, Safari, or Edge browser. Make sure browser is up to date.",
  
  // General Help
  "features": "Recipe search, meal planner, favorites, cooking videos, serving calculator, community recipes, shopping list, AI cook.",
  "how to use": "Search recipes by name or ingredients, save favorites, plan meals, watch videos, and get shopping lists.",
  "what can i do": "Search recipes, save favorites, plan weekly meals, watch cooking videos, adjust servings, share with community.",
  "recipe not found": "Try different keywords or ingredient names. Search is case-insensitive so don't worry about capitalization.",
  "recipe suggestions": "Use filters and sorting options. Check community recipes for new ideas. Use AI Cook feature.",
  
  // Contact & Support
  "contact support": "Use the Contact Us form to reach our team directly. We'll respond within 24 hours.",
  "need help": "Fill out the Contact Us form with your issue and we'll help you solve it quickly.",
  "report bug": "Use Contact Us form to report bugs. Include what you were doing when the issue occurred.",
  "feedback": "We love hearing from you! Use the Contact Us form to share feedback and suggestions.",
  "support hours": "Monday-Friday: 9am-8pm EST, Saturday: 10am-4pm EST, Sunday: Closed",
  
  // Cooking Tips
  "cooking tips": "Check individual recipe pages for tips and tricks from other users in comments.",
  "recipe substitutions": "Read recipe comments for ingredient substitution suggestions from other cooks.",
  "cooking advice": "Check the recipe details and comments for cooking tips and advice from the community.",
  "ingredient alternatives": "Ask in comments or check other similar recipes for ingredient alternatives.",
};

// Smart matching function
function findBestMatch(userMessage) {
  const message = userMessage.toLowerCase().trim();
  let bestMatch = null;
  let bestScore = 0;

  for (const [question, answer] of Object.entries(knowledgeBase)) {
    const keywords = question.split(" ");
    let score = 0;

    // Check for exact phrase match
    if (message.includes(question)) {
      score = 100;
    } else {
      // Check for individual keyword matches
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          score += 10;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = answer;
    }
  }

  return bestMatch;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Find matching response from knowledge base
    const reply = findBestMatch(message);

    // If we have a good match, return it
    if (reply) {
      return res.status(200).json({
        reply: reply,
        timestamp: new Date().toISOString(),
        source: 'knowledge_base'
      });
    }

    // If no match found, provide helpful default response
    return res.status(200).json({
      reply: "I'm not sure about that topic. Could you ask about recipe search, meal planning, favorites, cooking videos, serving calculator, or account issues? Or use the Contact Us form for other questions! 😊",
      timestamp: new Date().toISOString(),
      source: 'default'
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return res.status(200).json({
      reply: "Sorry, I'm having trouble right now. Please try again or use the Contact Us form to reach our team. 🙏"
    });
  }
}
