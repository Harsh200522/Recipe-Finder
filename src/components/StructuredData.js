/**
 * Structured Data Schemas for Google Search & Rich Snippets
 * Implements Recipe, FAQ, Breadcrumb, and Organization schemas
 */

// Recipe Schema for recipe pages
export const createRecipeSchema = (recipe) => ({
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: recipe.name,
  description: recipe.description,
  image: recipe.image,
  author: {
    '@type': 'Person',
    name: recipe.author || 'Recipe Finder Team',
  },
  prepTime: recipe.prepTime || 'PT15M',
  cookTime: recipe.cookTime || 'PT30M',
  totalTime: recipe.totalTime || 'PT45M',
  recipeYield: recipe.servings || 4,
  recipeCategory: recipe.category || 'Main Course',
  recipeCuisine: recipe.cuisine || 'International',
  recipeIngredient: recipe.ingredients || [],
  recipeInstructions: (recipe.instructions || []).map((instruction, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    text: instruction,
  })),
  nutrition: recipe.nutrition && {
    '@type': 'NutritionInformation',
    calories: recipe.nutrition.calories,
    proteinContent: recipe.nutrition.protein,
    carbohydrateContent: recipe.nutrition.carbs,
    fatContent: recipe.nutrition.fat,
    fiberContent: recipe.nutrition.fiber,
  },
  keywords: recipe.keywords || [],
  aggregateRating: recipe.rating && {
    '@type': 'AggregateRating',
    ratingValue: recipe.rating.value,
    ratingCount: recipe.rating.count,
    bestRating: '5',
    worstRating: '1',
  },
  datePublished: recipe.datePublished,
  dateModified: recipe.dateModified,
});

// FAQ Schema
export const createFAQSchema = (faqItems) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});

// Breadcrumb Schema for navigation
export const createBreadcrumbSchema = (breadcrumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: item.url,
  })),
});

// Organization Schema
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Recipe Finder',
  url: 'https://recipefinder.com',
  logo: 'https://recipefinder.com/logo.png',
  description:
    'Recipe Finder: Your Complete Cooking & Meal Planning Platform. Discover recipes, plan meals, and master cooking techniques.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: 'support@recipefinder.com',
    availableLanguage: ['en-US'],
  },
  sameAs: [
    'https://www.facebook.com/recipefinder',
    'https://www.instagram.com/recipefinder',
    'https://www.pinterest.com/recipefinder',
    'https://www.youtube.com/recipefinder',
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Main Street',
    addressLocality: 'City',
    addressRegion: 'State',
    postalCode: '12345',
    addressCountry: 'US',
  },
};

// Blog Article Schema
export const createArticleSchema = (article) => ({
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: article.title,
  description: article.excerpt,
  image: article.image,
  datePublished: article.date,
  dateModified: article.modified || article.date,
  author: {
    '@type': 'Person',
    name: article.author,
  },
  publisher: {
    '@type': 'Organization',
    name: 'Recipe Finder',
    logo: {
      '@type': 'ImageObject',
      url: 'https://recipefinder.com/logo.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://recipefinder.com/blog/${article.slug}`,
  },
  articleBody: article.content,
  keywords: article.keywords,
});

// Meal Plan Schema
export const createMealPlanSchema = (mealPlan) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: mealPlan.name || 'Weekly Meal Plan',
  description: mealPlan.description,
  url: 'https://recipefinder.com/meal-planner',
  hasPart: mealPlan.meals.map((meal) => ({
    '@type': 'Recipe',
    name: meal.name,
    description: meal.description,
    image: meal.image,
    recipeYield: meal.servings,
  })),
});

// Video Schema (for cooking tutorial videos)
export const createVideoSchema = (video) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: video.title,
  description: video.description,
  thumbnailUrl: video.thumbnail,
  uploadDate: video.uploadDate,
  duration: video.duration,
  contentUrl: video.url,
  embedUrl: video.embedUrl,
});

// How-To Schema (for cooking techniques)
export const createHowToSchema = (howTo) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: howTo.name,
  description: howTo.description,
  image: howTo.image,
  totalTime: howTo.totalTime,
  step: howTo.steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
    image: step.image,
  })),
});

export default {
  createRecipeSchema,
  createFAQSchema,
  createBreadcrumbSchema,
  organizationSchema,
  createArticleSchema,
  createMealPlanSchema,
  createVideoSchema,
  createHowToSchema,
};
