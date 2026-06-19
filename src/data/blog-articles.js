import { comprehensiveBlogArticles, categories } from "./comprehensive-blog-articles";

export const blogArticles = comprehensiveBlogArticles;
export { categories };

export const getFeaturedArticles = () => {
  return blogArticles.filter(article => article.featured).slice(0, 3);
};

export const getArticleBySlug = (slug) => {
  return blogArticles.find(article => article.slug === slug);
};

export const getArticlesByCategory = (category) => {
  return blogArticles.filter(article => article.category === category);
};

export const getLatestArticles = (count = 6) => {
  return blogArticles.slice(-count).reverse();
};
