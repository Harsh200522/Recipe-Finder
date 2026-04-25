// src/components/Blog.jsx
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { blogArticles, categories } from "../data/blog-articles";
import "../style/blog.css";

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 9;

  // ✅ Scroll to top on navigation
  const handleNavigation = () => {
    window.scrollTo(0, 0);
  };

  // ✅ Filter articles by category
  const filteredArticles = useMemo(() => {
    if (selectedCategory === "All") {
      return blogArticles;
    }
    return blogArticles.filter(
      (article) => article.category === selectedCategory
    );
  }, [selectedCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const displayedArticles = filteredArticles.slice(
    startIndex,
    startIndex + articlesPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="blog-container">
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="hero-content">
          <h1>Recipe & Nutrition Blog</h1>
          <p>Expert tips, healthy recipes, and meal planning strategies</p>
        </div>
      </section>

      <div className="blog-wrapper">
        {/* Sidebar */}
        <aside className="blog-sidebar">
          <div className="categories-section">
            <h3>Categories</h3>

            <button
              className={`category-btn ${
                selectedCategory === "All" ? "active" : ""
              }`}
              onClick={() => handleCategoryChange("All")}
            >
              All Articles ({blogArticles.length})
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${
                  selectedCategory === category.name ? "active" : ""
                }`}
                onClick={() => handleCategoryChange(category.name)}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>

          {/* ✅ Featured Articles (limited to 3) */}
          <div className="featured-articles-sidebar">
            <h3>Featured Articles</h3>

            {blogArticles
              .filter((a) => a.featured)
              .slice(0, 3)
              .map((article) => (
                <Link
                  key={article.id}
                  to={article.slug ? `/blog/${article.slug}` : "#"}
                  className="featured-item"
                  onClick={handleNavigation}
                >
                  <img
                    src={
                      article.image ||
                      "https://via.placeholder.com/150?text=No+Image"
                    }
                    alt={article.title}
                    className="featured-item-image"
                  />
                  <div className="featured-item-body">
                    <div className="featured-badge">Featured</div>
                    <h4>{article.title}</h4>
                    <p className="featured-date">{article.date}</p>
                  </div>
                </Link>
              ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="blog-main">
          <div className="articles-grid">
            {displayedArticles.length > 0 ? (
              <div className="blog-articles">
                {displayedArticles.map((article) => (
                  <div key={article.id} className="blog-article">
                    {/* Image */}
                    <Link
                      to={article.slug ? `/blog/${article.slug}` : "#"}
                      className="blog-article-link"
                      onClick={handleNavigation}
                    >
                      <img
                        src={
                          article.image ||
                          "https://via.placeholder.com/400x250?text=No+Image"
                        }
                        alt={article.title}
                        className="blog-article-image"
                      />
                    </Link>

                    {/* Content */}
                    <div className="blog-article-body">
                      <span className="blog-article-category">
                        {article.category}
                      </span>

                      <h2>
                        <Link
                          to={article.slug ? `/blog/${article.slug}` : "#"}
                          className="blog-article-title-link"
                          onClick={handleNavigation}
                        >
                          {article.title}
                        </Link>
                      </h2>

                      <p>{article.excerpt}</p>

                      {/* ✅ Read More */}
                      <Link
                        to={article.slug ? `/blog/${article.slug}` : "#"}
                        className="read-more-btn"
                        onClick={handleNavigation}
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // ✅ Better Empty State
              <div className="no-articles">
                <h3>No articles found 😕</h3>
                <p>Try selecting a different category.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
              )}

              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`page-number ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="pagination-btn"
                >
                  Next →
                </button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Blog;