/**
 * IMPLEMENTATION EXAMPLES
 * Code snippets showing how to use the new SEO components and structured data
 */

// ========================================
// EXAMPLE 1: Using SEO in a Blog Article Component
// ========================================

/*
File: src/components/BlogDetail.jsx

import React from 'react';
import SEO from './SEO';
import { createArticleSchema } from './StructuredData';

const BlogDetail = ({ article }) => {
  // Assuming article object with: title, slug, content, excerpt, date, author, image, keywords

  const articleSchema = createArticleSchema({
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    date: article.date,
    modified: article.modified || article.date,
    author: article.author,
    image: article.image,
    keywords: article.keywords,
  });

  return (
    <>
      <SEO
        title={`${article.title} - Recipe Finder | Cooking & Nutrition Tips`}
        description={article.excerpt}
        keywords={article.keywords.join(', ')}
        url={`/blog/${article.slug}`}
        type="article"
        author={article.author}
        publishedDate={article.date}
        image={article.image}
        schema={articleSchema}
      />
      
      <article>
        <h1>{article.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </article>
    </>
  );
};

export default BlogDetail;
*/

// ========================================
// EXAMPLE 2: Using SEO in a Recipe Page Component
// ========================================

/*
File: src/components/RecipeDetail.jsx

import React from 'react';
import SEO from './SEO';
import { createRecipeSchema } from './StructuredData';

const RecipeDetail = ({ recipe }) => {
  // Assuming recipe object with: name, description, ingredients, instructions, etc.

  const recipeSchema = createRecipeSchema({
    name: recipe.name,
    description: recipe.description,
    image: recipe.image,
    author: 'Recipe Finder Team',
    prepTime: recipe.prepTime || 'PT15M',
    cookTime: recipe.cookTime || 'PT30M',
    totalTime: recipe.totalTime || 'PT45M',
    servings: recipe.servings || 4,
    category: recipe.category,
    cuisine: recipe.cuisine,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    nutrition: {
      calories: recipe.nutrition?.calories,
      protein: recipe.nutrition?.protein,
      carbs: recipe.nutrition?.carbs,
      fat: recipe.nutrition?.fat,
      fiber: recipe.nutrition?.fiber,
    },
    keywords: recipe.keywords,
    datePublished: recipe.datePublished,
    dateModified: recipe.dateModified,
  });

  return (
    <>
      <SEO
        title={`${recipe.name} - Healthy Recipe | Recipe Finder`}
        description={recipe.description}
        keywords={recipe.keywords?.join(', ')}
        url={`/recipes/${recipe.slug}`}
        type="article"
        image={recipe.image}
        schema={recipeSchema}
      />
      
      <div className="recipe-container">
        <h1>{recipe.name}</h1>
        <img src={recipe.image} alt={recipe.name} />
        <p>{recipe.description}</p>
        
        {/* Recipe details */}
        <section>
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients?.map((ingredient, idx) => (
              <li key={idx}>{ingredient}</li>
            ))}
          </ul>
        </section>
        
        <section>
          <h2>Instructions</h2>
          <ol>
            {recipe.instructions?.map((instruction, idx) => (
              <li key={idx}>{instruction}</li>
            ))}
          </ol>
        </section>
        
        {recipe.nutrition && (
          <section>
            <h2>Nutrition Info (per serving)</h2>
            <ul>
              <li>Calories: {recipe.nutrition.calories}</li>
              <li>Protein: {recipe.nutrition.protein}g</li>
              <li>Carbs: {recipe.nutrition.carbs}g</li>
              <li>Fat: {recipe.nutrition.fat}g</li>
            </ul>
          </section>
        )}
      </div>
    </>
  );
};

export default RecipeDetail;
*/

// ========================================
// EXAMPLE 3: Using FAQ Schema in FAQ Page
// ========================================

/*
File: src/components/FAQPage.jsx (already implemented, but here's how schema works)

import React from 'react';
import SEO from './SEO';
import { createFAQSchema } from './StructuredData';

const FAQPage = () => {
  const faqItems = [
    {
      question: "What is Recipe Finder?",
      answer: "Recipe Finder is a comprehensive cooking platform..."
    },
    // ... more FAQ items
  ];

  const faqSchema = createFAQSchema(faqItems);

  return (
    <>
      <SEO
        title="FAQ - Recipe Finder"
        description="Frequently asked questions about Recipe Finder"
        url="/faq"
        type="FAQPage"
        schema={faqSchema}
      />
      
      {faqItems.map((item, idx) => (
        <div key={idx} className="faq-item">
          <h3>{item.question}</h3>
          <p>{item.answer}</p>
        </div>
      ))}
    </>
  );
};

export default FAQPage;
*/

// ========================================
// EXAMPLE 4: Using Breadcrumb Schema
// ========================================

/*
File: src/components/Breadcrumbs.jsx

import React from 'react';
import { createBreadcrumbSchema } from './StructuredData';

const Breadcrumbs = ({ items }) => {
  // items example:
  // [
  //   { label: 'Home', url: '/' },
  //   { label: 'Blog', url: '/blog' },
  //   { label: 'Recipes', url: '/category/recipes' },
  //   { label: 'Current Article', url: '/blog/article-slug' }
  // ]

  const breadcrumbSchema = createBreadcrumbSchema(items);

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      
      <nav className="breadcrumbs">
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="separator"> / </span>}
            <a href={item.url}>{item.label}</a>
          </React.Fragment>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumbs;
*/

// ========================================
// EXAMPLE 5: Organization Schema (add to App.jsx or main layout)
// ========================================

/*
File: src/components/Layout.jsx or App.jsx (add to main layout component)

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { organizationSchema } from './StructuredData';

const AppLayout = ({ children }) => {
  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      </Helmet>
      
      {children}
    </>
  );
};

export default AppLayout;
*/

// ========================================
// EXAMPLE 6: How-To Schema for Cooking Guides
// ========================================

/*
File: src/components/CookingTechnique.jsx

import React from 'react';
import SEO from './SEO';
import { createHowToSchema } from './StructuredData';

const CookingTechnique = ({ technique }) => {
  // technique example:
  // {
  //   name: "How to Properly Dice an Onion",
  //   description: "Learn the professional technique for dicing onions",
  //   image: "https://example.com/onion-dicing.jpg",
  //   totalTime: "PT10M",
  //   steps: [
  //     { name: "Step 1", text: "Cut onion in half lengthwise...", image: "..." },
  //     { name: "Step 2", text: "Remove papery skin...", image: "..." },
  //     // ... more steps
  //   ]
  // }

  const howToSchema = createHowToSchema(technique);

  return (
    <>
      <SEO
        title={`${technique.name} - Recipe Finder`}
        description={technique.description}
        url={`/tutorial/${technique.slug}`}
        schema={howToSchema}
      />
      
      <article>
        <h1>{technique.name}</h1>
        <img src={technique.image} alt={technique.name} />
        <p>{technique.description}</p>
        
        <div className="steps">
          {technique.steps.map((step, idx) => (
            <div key={idx} className="step">
              <h3>{step.name}</h3>
              <img src={step.image} alt={step.name} />
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </article>
    </>
  );
};

export default CookingTechnique;
*/

// ========================================
// EXAMPLE 7: Complete Blog Page with SEO
// ========================================

/*
File: src/components/BlogPage.jsx

import React from 'react';
import SEO from './SEO';

const BlogPage = ({ category = 'All' }) => {
  return (
    <>
      <SEO
        title={`${category} Articles - Recipe Finder | Cooking & Nutrition Blog`}
        description={`Read our collection of ${category.toLowerCase()} articles about healthy recipes, meal planning, and cooking techniques.`}
        keywords={`${category.toLowerCase()} recipes, nutrition tips, cooking guide, meal planning`}
        url={category === 'All' ? '/blog' : `/category/${category.toLowerCase()}`}
        type="CollectionPage"
      />
      
      <div className="blog-container">
        <h1>{category} Articles</h1>
        {/* Blog articles list */}
      </div>
    </>
  );
};

export default BlogPage;
*/

// ========================================
// EXAMPLE 8: Static Page (About, Contact, etc.)
// ========================================

/*
File: src/components/About.jsx

import React from 'react';
import SEO from './SEO';

const About = () => {
  return (
    <>
      <SEO
        title="About Recipe Finder | Your Cooking & Nutrition Guide"
        description="Learn about Recipe Finder - a comprehensive platform for discovering recipes, planning meals, and mastering cooking techniques."
        keywords="about us, recipe platform, cooking community"
        url="/about"
        author="Recipe Finder Team"
      />
      
      <div className="about-container">
        <h1>About Recipe Finder</h1>
        {/* About content */}
      </div>
    </>
  );
};

export default About;
*/

// ========================================
// BEST PRACTICES
// ========================================

/*
BEST PRACTICES FOR SEO IMPLEMENTATION:

1. Always include meaningful descriptions (150-160 characters)
2. Use natural, relevant keywords (avoid keyword stuffing)
3. Include schema markup for rich snippets
4. Use canonical URLs to avoid duplicate content
5. Ensure mobile responsiveness on all pages
6. Include social media metadata (Open Graph, Twitter)
7. Use descriptive, unique titles for each page
8. Implement internal linking between related content
9. Keep content fresh and update regularly
10. Monitor Google Search Console for indexing issues

COMMON MISTAKES TO AVOID:

1. ❌ Not including meta descriptions
2. ❌ Duplicate titles across pages
3. ❌ Missing or incorrect schema markup
4. ❌ Poor mobile responsiveness
5. ❌ Slow page load times
6. ❌ Broken links (internal or external)
7. ❌ Content that's too short (under 300 words)
8. ❌ Keyword stuffing
9. ❌ Missing social media tags
10. ❌ Not updating sitemaps when adding content

TESTING YOUR IMPLEMENTATION:

1. Google Rich Results Test: https://search.google.com/test/rich-results
2. Schema.org Validator: https://validator.schema.org/
3. Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
4. Google PageSpeed Insights: https://pagespeed.web.dev/
5. Google Search Console: https://search.google.com/search-console

*/

export default {
  blogDetailExample: 'See Example 1',
  recipeDetailExample: 'See Example 2',
  faqPageExample: 'See Example 3',
  breadcrumbExample: 'See Example 4',
  organizationExample: 'See Example 5',
  howToExample: 'See Example 6',
  blogPageExample: 'See Example 7',
  aboutPageExample: 'See Example 8',
};
