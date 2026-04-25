# Quick Start Guide - Recipe Finder React App

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

```bash
# Navigate to project directory
cd RecipeFinder

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:5173
```

### Build for Production

```bash
# Build optimized version
npm run build

# Preview production build
npm run preview

# Deploy dist/ folder to your hosting service
```

---

## 📚 Project Structure Overview

### Key Directories

```
src/
├── components/        # React components
│   ├── Blog.jsx                [BLOG LIST PAGE]
│   ├── BlogDetail.jsx          [INDIVIDUAL ARTICLES]
│   ├── BlogCategory.jsx        [CATEGORY PAGES]
│   ├── LandingPage.jsx         [PUBLIC HOMEPAGE]
│   ├── Footer.jsx              [SITE FOOTER]
│   ├── Home.jsx                [USER DASHBOARD - Protected]
│   └── ...other components
│
├── style/            # CSS Stylesheets
│   ├── blog.css                [Blog styling]
│   ├── blog-detail.css         [Article styling]
│   ├── blog-category.css       [Category styling]
│   ├── landing-page.css        [Landing page styling]
│   ├── footer.css              [Footer styling]
│   └── ...other styles
│
├── data/            # Data files
│   └── blog-articles.js        [20 blog articles]
│
├── config/          # Configuration
│   └── firebase.js             [Firebase config]
│
└── App.jsx          # Main app with routing
```

---

## 🔄 How It Works

### Routing Logic

```
User NOT logged in:
  / → LandingPage (public)
  /blog → Blog (public)
  /blog/article-slug → BlogDetail (public)
  /category/Recipes → BlogCategory (public)
  /about, /contact → Public pages

User logs in:
  / → Home (user dashboard)
  All public pages still work
  /favorites → Protected
  /meal-planner → Protected
  /profile → Protected
```

### Component Flow

1. **App.jsx** - Main router, handles auth state
2. **Header.jsx** - Navigation (shown when logged in)
3. **LandingPage.jsx** - Public homepage (shown when not logged in)
4. **Blog.jsx** - Blog list with pagination & filtering
5. **BlogDetail.jsx** - Individual article with related content
6. **BlogCategory.jsx** - Category browsing
7. **Footer.jsx** - Site footer (shown on all pages)

---

## 📝 Working with Blog Articles

### Viewing Articles

Edit `src/data/blog-articles.js` to see the article data structure:

```javascript
const blogArticles = [
  {
    id: 1,
    slug: "ultimate-guide-healthy-meal-planning",
    title: "The Ultimate Guide to Healthy Meal Planning",
    category: "Meal Planning",
    author: "Recipe Finder Team",
    date: "2024-01-15",
    featured: true,
    image: "/images/blog/meal-planning.jpg",
    excerpt: "Learn the...",
    readTime: 12,
    content: `<h2>Article content...</h2>` // Full HTML content
  }
  // ... more articles
]
```

### Adding New Articles

1. Open `src/data/blog-articles.js`
2. Add new object to `blogArticles` array
3. Increment the `id`
4. Use a descriptive `slug` (no spaces, lowercase)
5. Fill in all fields (title, content, etc.)
6. Categories must match existing: 
   - "Recipes"
   - "Meal Planning"
   - "Diet Guides"
   - "Cooking Tutorials"
   - "Healthy Eating"

```javascript
{
  id: 21,
  slug: "my-new-recipe",
  title: "My New Recipe Title",
  category: "Recipes",
  author: "Recipe Finder Team",
  date: "2024-04-25",
  featured: false,
  image: "/images/blog/my-recipe.jpg",
  excerpt: "Short description of the article...",
  readTime: 10,
  content: `
    <h2>Heading</h2>
    <p>Your article content here...</p>
    <h3>Subheading</h3>
    <p>More content...</p>
  `,
}
```

### Creating HTML Content

Use HTML tags for article content:

```html
<h2>Main Heading</h2>
<p>Paragraph text with <strong>bold</strong> and <em>italic</em>.</p>

<h3>Subsection</h3>
<ul>
  <li>Bullet point 1</li>
  <li>Bullet point 2</li>
</ul>

<ol>
  <li>Numbered item 1</li>
  <li>Numbered item 2</li>
</ol>

<blockquote>Important quote or note</blockquote>
```

---

## 🎨 Styling System

### Adding New Styles

Create new CSS file in `src/style/`:

```css
/* src/style/my-component.css */
.my-class {
  background: #667eea;
  padding: 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.my-class:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
}
```

Import in component:

```javascript
import React from 'react';
import '../style/my-component.css';

function MyComponent() {
  return <div className="my-class">Content</div>;
}
```

### Color Scheme

```
Primary: #667eea (Purple-blue)
Secondary: #764ba2 (Purple)
Success: #10b981 (Green)
Danger: #ef4444 (Red)
Dark: #1a1a1a (Dark gray)
Light: #f8f9fa (Light gray)
```

---

## 🔗 Navigation Tips

### Linking to Pages

```javascript
import { Link } from 'react-router-dom';

// Link to blog
<Link to="/blog">Blog</Link>

// Link to specific article
<Link to={`/blog/${article.slug}`}>
  {article.title}
</Link>

// Link to category
<Link to="/category/Recipes">Recipes</Link>

// Link with query params
<Link to="/blog?search=dinner">Search Dinners</Link>
```

### Programmatic Navigation

```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const goToArticle = (slug) => {
    navigate(`/blog/${slug}`);
  };
  
  return <button onClick={() => goToArticle('my-article')}>Read</button>;
}
```

---

## 🐛 Debugging Tips

### Check Console Logs

```javascript
// In component
console.log('Article data:', article);
console.log('Route params:', useParams());
```

### Common Issues

**Blog page not loading:**
- Check `blog-articles.js` exists in `src/data/`
- Verify import: `import { blogArticles } from "../data/blog-articles"`
- Check browser console for errors

**Styling not applied:**
- Verify CSS file imported: `import "../style/blog.css"`
- Check class names match between JSX and CSS
- Clear browser cache (Ctrl+Shift+Delete)

**Routing not working:**
- Verify routes in `App.jsx`
- Check component imports
- Verify pages exist in `components/` folder

---

## 📱 Testing Responsiveness

### Mobile Testing

```bash
# Option 1: Browser DevTools
# Press F12 → Toggle device toolbar (Ctrl+Shift+M)

# Option 2: Test on real device
# Ensure you're on same network
# Access http://YOUR_IP:5173 from phone
```

### Check Breakpoints

CSS uses these breakpoints:

```css
/* Desktop: 1024px and up */
/* Tablet: 768px to 1023px */
/* Mobile: 767px and down */

@media (max-width: 768px) {
  /* Mobile styles */
}
```

---

## 🔒 Authentication

### Current User

```javascript
import { useContext } from 'react';
import { auth } from '../config/firebase.js';

// Get current user
if (auth.currentUser) {
  console.log(auth.currentUser.email);
  console.log(auth.currentUser.uid);
}
```

### Protected Routes

Already implemented in `App.jsx`:

```javascript
<Route
  path="/favorites"
  element={user ? <Favorites /> : <Navigate to="/auth" />}
/>
```

---

## 📊 Performance Monitoring

### Image Optimization

```javascript
// Load images lazily
<img loading="lazy" src="path/to/image.jpg" alt="Description" />

// Optimize image size
// Use JPEG for photos, PNG for graphics, WebP for better compression

// Fallback for missing images
<img 
  src="image.jpg" 
  alt="Description"
  onError={(e) => {
    e.target.src = "https://via.placeholder.com/400x250?text=Recipe";
  }}
/>
```

### Page Load Speed

- Font sizes are optimized
- CSS is minimal
- Images are compressed
- No heavy JavaScript libraries
- React components are lazy-loaded where possible

---

## 🚀 Deployment Checklist

- [ ] Update domain in code (robots.txt, sitemap.xml, index.html)
- [ ] Set environment variables (.env)
- [ ] Run `npm run build`
- [ ] Test build with `npm run preview`
- [ ] Deploy `dist/` folder
- [ ] Enable HTTPS
- [ ] Set up redirects (http → https)
- [ ] Test on mobile devices
- [ ] Submit to Google Search Console
- [ ] Apply for Google AdSense

---

## 📞 Common Tasks

### Add New Blog Category

Edit `src/data/blog-articles.js`:

```javascript
// Add to categories array
export const categories = [
  // ... existing categories
  { id: 6, name: "New Category", count: 0 }
];

// Then add articles with this category
```

### Change Site Title

Edit `index.html`:
```html
<title>Your New Title | Recipe Finder</title>
```

### Update Meta Description

Edit `index.html`:
```html
<meta name="description" content="Your new description here..." />
```

### Add Social Links

Edit `src/components/Footer.jsx`:
```javascript
<a href="https://facebook.com/your-page">f</a>
<a href="https://twitter.com/your-handle">𝕏</a>
```

---

## 🎓 Learning Resources

- React Docs: https://react.dev
- React Router: https://reactrouter.com
- Firebase: https://firebase.google.com/docs
- CSS Tricks: https://css-tricks.com
- MDN Web Docs: https://developer.mozilla.org

---

## 💬 Need Help?

1. Check `IMPLEMENTATION_SUMMARY.md` for architecture details
2. Check `ADSENSE_SETUP_GUIDE.md` for AdSense questions
3. Review code comments in components
4. Check browser console for error messages
5. Test in different browsers

---

Happy coding! 🎉
