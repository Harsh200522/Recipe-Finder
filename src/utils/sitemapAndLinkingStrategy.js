/**
 * SITEMAP & SEO STRATEGY GUIDE
 * Complete system for XML sitemaps and internal linking
 * Designed for Google AdSense approval
 */

// ==========================================
// SITEMAP STRATEGY
// ==========================================

/**
 * Sitemap Structure for Recipe Finder
 * 
 * Main sitemap.xml - Entry point listing all sitemap files
 * ├── sitemap-blog.xml - All blog articles (30+ articles)
 * ├── sitemap-recipes.xml - Recipe pages
 * ├── sitemap-pages.xml - Static pages (about, contact, guides)
 * └── sitemap-categories.xml - Blog categories
 * 
 * Priority Recommendations for AdSense Approval:
 * - Blog articles: 0.8 (high value content)
 * - Static pages (about, faq, guides): 0.9 (essential pages)
 * - Recipes: 0.7 (support content)
 * - Categories: 0.6 (secondary navigation)
 * - Homepage: 1.0 (highest priority)
 */

export const sitemapConfig = {
  // Sitemap generation configuration
  sitemapBaseUrl: 'https://recipefinder.com',
  
  // Blog articles sitemap
  blogSitemap: {
    filename: 'sitemap-blog.xml',
    priority: 0.8,
    changefreq: 'weekly',
    // Include all 30 blog articles with metadata
    routes: [
      {
        path: '/blog/ultimate-guide-healthy-meal-planning',
        lastmod: '2024-01-15',
        priority: 0.9,
        changefreq: 'monthly',
      },
      {
        path: '/blog/protein-rich-recipes-muscle-building',
        lastmod: '2024-01-20',
        priority: 0.85,
        changefreq: 'monthly',
      },
      // ... 28 more articles following the same structure
    ],
  },

  // Static pages sitemap
  pagesSitemap: {
    filename: 'sitemap-pages.xml',
    priority: 0.9,
    changefreq: 'monthly',
    routes: [
      { path: '/', priority: 1.0, changefreq: 'weekly' },
      { path: '/about', priority: 0.9, changefreq: 'monthly' },
      { path: '/contact', priority: 0.8, changefreq: 'monthly' },
      { path: '/faq', priority: 0.9, changefreq: 'monthly' },
      { path: '/nutrition-guide', priority: 0.9, changefreq: 'monthly' },
      { path: '/meal-planning-guide', priority: 0.9, changefreq: 'monthly' },
      { path: '/privacy-policy', priority: 0.5, changefreq: 'yearly' },
      { path: '/terms', priority: 0.5, changefreq: 'yearly' },
      { path: '/blog', priority: 0.8, changefreq: 'weekly' },
    ],
  },

  // Blog categories sitemap
  categoriesSitemap: {
    filename: 'sitemap-categories.xml',
    priority: 0.6,
    changefreq: 'weekly',
    routes: [
      { path: '/category/recipes', priority: 0.7 },
      { path: '/category/meal-planning', priority: 0.7 },
      { path: '/category/diet-guides', priority: 0.7 },
      { path: '/category/cooking-tutorials', priority: 0.7 },
      { path: '/category/healthy-eating', priority: 0.7 },
    ],
  },

  // Recipe pages sitemap (if available)
  recipesSitemap: {
    filename: 'sitemap-recipes.xml',
    priority: 0.7,
    changefreq: 'weekly',
    // Dynamically populated from recipe database
  },
};

// ==========================================
// INTERNAL LINKING STRATEGY
// ==========================================

/**
 * Internal Linking Blueprint for Content Interconnection
 * Improves SEO, user experience, and AdSense approval chances
 */

export const internalLinkingStrategy = {
  // Link from homepage to key content areas
  homepage: {
    linkTo: [
      { anchor: 'Latest Blog Articles', url: '/blog', title: 'Read our latest nutrition and cooking articles' },
      { anchor: 'Meal Planning Guide', url: '/meal-planning-guide', title: 'Learn how to plan meals effectively' },
      { anchor: 'Nutrition Guide', url: '/nutrition-guide', title: 'Understand macronutrients and micronutrients' },
      { anchor: 'Featured Recipes', url: '/category/recipes', title: 'Browse our collection of recipes' },
    ],
  },

  // Each blog article should link to related content
  blogArticles: {
    linkTo: [
      'Related blog articles (3-5 recommendations)',
      'Related recipes (if applicable)',
      'Relevant category pages',
      'Nutrition guide (for nutrition-related articles)',
      'Meal planning guide (for planning-related articles)',
    ],
    exampleLinks: {
      articleSlug: 'ultimate-guide-healthy-meal-planning',
      internalLinks: [
        { text: 'Learn more about macronutrients', url: '/nutrition-guide' },
        { text: 'Quick meal prep tips', url: '/blog/meal-prep-beginners' },
        { text: 'Budget-friendly recipes', url: '/blog/budget-friendly-healthy-recipes' },
        { text: 'Shop healthy recipes', url: '/category/recipes' },
      ],
    },
  },

  // Navigation pages should link to premium content
  premiumGuides: {
    nutritionGuide: {
      linkTo: [
        { text: 'Explore recipes by nutrition profile', url: '/blog' },
        { text: 'Meal planning basics', url: '/meal-planning-guide' },
        { text: 'Healthy eating habits', url: '/blog' },
      ],
    },
    mealPlanningGuide: {
      linkTo: [
        { text: 'Start your meal plan', url: '/meal-planner' },
        { text: 'Browse recipes', url: '/category/recipes' },
        { text: 'Nutrition fundamentals', url: '/nutrition-guide' },
      ],
    },
  },

  // Blog categories should link to articles and guides
  categoryPages: {
    strategicLinks: [
      'Link to most popular articles in that category',
      'Link to related guides',
      'Link to "view all articles" in category',
      'Link to 2-3 popular recipes if applicable',
    ],
    example: {
      categoryName: 'Diet Guides',
      internalLinks: [
        { text: 'Mediterranean Diet Guide', url: '/blog/mediterranean-diet-health-benefits' },
        { text: 'Intermittent Fasting Guide', url: '/blog/intermittent-fasting-guide' },
        { text: 'Complete Nutrition Guide', url: '/nutrition-guide' },
      ],
    },
  },

  // Footer navigation for consistent linking
  footer: {
    importantLinks: [
      { text: 'About Us', url: '/about' },
      { text: 'Contact Us', url: '/contact' },
      { text: 'Privacy Policy', url: '/privacy-policy' },
      { text: 'Terms & Conditions', url: '/terms' },
      { text: 'FAQ', url: '/faq' },
    ],
    contentLinks: [
      { text: 'Latest Blog', url: '/blog' },
      { text: 'Recipes', url: '/category/recipes' },
      { text: 'Meal Planning', url: '/meal-planning-guide' },
      { text: 'Nutrition Guide', url: '/nutrition-guide' },
    ],
  },

  // Breadcrumb navigation for hierarchy
  breadcrumbs: {
    examplePaths: [
      { path: '/ > Blog > Recipes > Protein-Rich Recipes', url: '/blog/protein-rich-recipes-muscle-building' },
      { path: '/ > Guides > Nutrition > Macronutrients', url: '/nutrition-guide' },
      { path: '/ > Categories > Meal Planning', url: '/category/meal-planning' },
    ],
  },
};

// ==========================================
// LINKING BEST PRACTICES FOR ADSENSE
// ==========================================

export const seoLinkingBestPractices = {
  // Natural anchor text is crucial
  anchorTextGuidelines: {
    do: [
      'Use descriptive anchor text that indicates page content',
      'Vary anchor text (avoid "click here" on every link)',
      'Include keywords naturally',
      'Use exact match or partial match keywords',
    ],
    dont: [
      'Keyword stuffing in anchor text',
      'Generic anchors like "link" or "page"',
      'Exact same anchor text throughout site',
      'Non-descriptive links',
    ],
    examples: {
      good: 'Learn about protein requirements for muscle building',
      bad: 'click here for more info',
    },
  },

  // Quantity recommendations
  linksPerPage: {
    minimum: 5,
    recommended: 8,
    maximum: 15,
    note: 'Quality over quantity - ensure every link adds value',
  },

  // Link placement strategy
  linkPlacement: {
    header: {
      links: ['Main navigation menu', 'Logo link to homepage'],
      count: '3-5 links',
    },
    body: {
      links: ['Contextual internal links within content', 'Related articles section', 'Next/previous navigation'],
      count: '5-8 links',
    },
    sidebar: {
      links: ['Related posts', 'Featured content', 'Category links'],
      count: '5-10 links',
    },
    footer: {
      links: ['Important pages', 'Categories', 'Latest content'],
      count: '10-15 links',
    },
  },

  // Avoid these linking mistakes
  avoidCommonMistakes: {
    noOrphanPages: 'Every page should be reachable from at least 2 other pages',
    noInfiniteLoops: 'Avoid circular internal linking patterns',
    noDeadEnds: 'Ensure navigation options exist on every page',
    noHiddenLinks: 'All links should be visible and crawlable',
    noLinkFarms: 'Don\'t create pages just for linking',
  },
};

// ==========================================
// IMPLEMENTATION GUIDELINES
// ==========================================

export const implementationGuide = {
  step1: {
    title: 'Generate XML Sitemaps',
    description: 'Create separate sitemaps for different content types',
    files: [
      'sitemap.xml (main)',
      'sitemap-blog.xml',
      'sitemap-pages.xml',
      'sitemap-categories.xml',
      'sitemap-recipes.xml',
    ],
    tools: [
      'Yoast SEO (WordPress)',
      'Screaming Frog',
      'Google Search Console',
      'Online sitemap generators',
    ],
  },

  step2: {
    title: 'Submit Sitemaps to Google',
    process: [
      'Go to Google Search Console',
      'Select your property',
      'Navigate to Sitemaps section',
      'Submit all sitemap URLs',
      'Verify successful submission',
    ],
  },

  step3: {
    title: 'Implement Internal Linking',
    implementation: [
      'Add contextual links within blog article content',
      'Create "Related Articles" sections',
      'Implement proper breadcrumb navigation',
      'Enhance navigation menu with key content',
      'Add strategic footer links',
    ],
  },

  step4: {
    title: 'Monitor and Maintain',
    monitoring: [
      'Check Google Search Console for crawl errors',
      'Review indexing status monthly',
      'Update sitemaps when adding content',
      'Fix broken internal links promptly',
      'Analyze user navigation patterns',
    ],
  },
};

export default {
  sitemapConfig,
  internalLinkingStrategy,
  seoLinkingBestPractices,
  implementationGuide,
};
