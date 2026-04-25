// src/components/BlogCategory.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  getArticlesByCategory,
  blogArticles,
  categories,
} from "../data/blog-articles";
import "../style/blog-category.css";

const BlogCategory = () => {
  const { name } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 6;

  // ✅ Reset page when category changes (IMPORTANT FIX)
  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [name]);

  // ✅ Scroll to top on navigation
  const handleNavigation = () => {
    window.scrollTo(0, 0);
  };

  // Filter articles
  const categoryArticles = useMemo(() => {
    return getArticlesByCategory(name);
  }, [name]);

  // Validate category
  const isValidCategory =
    categories.some((cat) => cat.name === name) ||
    categoryArticles.length > 0;

  if (!isValidCategory) {
    return <Navigate to="/blog" replace />;
  }

  // Pagination
  const totalPages = Math.ceil(
    categoryArticles.length / articlesPerPage
  );
  const startIndex = (currentPage - 1) * articlesPerPage;

  const displayedArticles = categoryArticles.slice(
    startIndex,
    startIndex + articlesPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="category-container">
      {/* Hero */}
      <section className="category-hero">
        <h1>{name} Recipes & Tips</h1>
        <p>
          Discover {categoryArticles.length} articles in the {name} category
        </p>
      </section>

      <div className="category-wrapper">
        {/* Sidebar */}
        <aside className="category-sidebar">
          <h3>Browse Categories</h3>

          <nav className="category-nav">
            <Link
              to="/blog"
              className="category-nav-link"
              onClick={handleNavigation}
            >
              All Articles ({blogArticles.length})
            </Link>

            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.name}`}
                className={`category-nav-link ${
                  name === category.name ? "active" : ""
                }`}
                onClick={handleNavigation}
              >
                {category.name} ({category.count})
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="category-main">
          {displayedArticles.length > 0 ? (
            <>
              <div className="category-articles">
                {displayedArticles.map((article) => (
                  <div key={article.id} className="category-article">
                    {/* Image */}
                    <Link
                      to={article.slug ? `/blog/${article.slug}` : "#"}
                      onClick={handleNavigation}
                    >
                      <img
                        src={
                          article.image ||
                          "https://via.placeholder.com/400x250?text=No+Image"
                        }
                        alt={article.title}
                        className="category-article-image"
                      />
                    </Link>

                    {/* Title */}
                    <h2>
                      <Link
                        to={article.slug ? `/blog/${article.slug}` : "#"}
                        onClick={handleNavigation}
                      >
                        {article.title}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    <p>{article.excerpt}</p>

                    {/* Read More */}
                    <Link
                      to={article.slug ? `/blog/${article.slug}` : "#"}
                      className="read-more-btn"
                      onClick={handleNavigation}
                    >
                      Read More →
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  {currentPage > 1 && (
                    <button
                      onClick={() =>
                        handlePageChange(currentPage - 1)
                      }
                      className="pagination-btn"
                    >
                      ← Previous
                    </button>
                  )}

                  <div className="page-numbers">
                    {Array.from(
                      { length: totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`page-number ${
                          currentPage === page ? "active" : ""
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {currentPage < totalPages && (
                    <button
                      onClick={() =>
                        handlePageChange(currentPage + 1)
                      }
                      className="pagination-btn"
                    >
                      Next →
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            // ✅ Better Empty State
            <div className="no-articles">
              <h3>No articles found 😕</h3>
              <p>Try exploring other categories.</p>
              <Link to="/blog" onClick={handleNavigation}>
                Browse all articles
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlogCategory;