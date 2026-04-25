// src/components/BlogDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  getArticleBySlug,
  blogArticles
} from "../data/blog-articles";
import "../style/blog-detail.css";

const BlogDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(undefined); // ✅ important fix
  const [relatedArticles, setRelatedArticles] = useState([]);

  // ✅ Scroll helper
  const handleNavigation = () => {
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const foundArticle = getArticleBySlug(slug);

    if (foundArticle) {
      setArticle(foundArticle);

      // ✅ Better related articles (same category)
      const related = blogArticles
        .filter(
          (a) =>
            a.category === foundArticle.category &&
            a.id !== foundArticle.id
        )
        .slice(0, 3);

      setRelatedArticles(related);

      // ✅ SEO improvements
      document.title = `${foundArticle.title} | Recipe Finder Blog`;

      window.scrollTo(0, 0);
    } else {
      setArticle(null); // ✅ mark as not found
    }
  }, [slug]);

  // ✅ Loading state (important)
  if (article === undefined) {
    return <div className="loading">Loading article...</div>;
  }

  // ✅ Redirect if not found
  if (article === null) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="blog-detail-container">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/" onClick={handleNavigation}>Home</Link>
        <span>/</span>
        <Link to="/blog" onClick={handleNavigation}>Blog</Link>
        <span>/</span>
        <span>{article.category}</span>
      </nav>

      <article className="blog-detail-article">
        {/* Header */}
        <header className="article-header">
          <img
            src={
              article.image ||
              "https://via.placeholder.com/800x400?text=No+Image"
            }
            alt={article.title}
            className="article-main-image"
          />

          <div className="article-tags">
            <span className="category-tag">{article.category}</span>
            <span className="read-time">
              📖 {article.readTime || 5} min read
            </span>
          </div>

          <h1>{article.title}</h1>

          <div className="article-info">
            <span className="author">
              By {article.author || "Admin"}
            </span>
            <span className="date">{article.date}</span>
          </div>
        </header>

        {/* Content */}
        <div
          className="article-body"
          dangerouslySetInnerHTML={{
            __html: article.content || "<p>No content available</p>",
          }}
        />

        {/* Footer */}
        <footer className="article-footer">
          <div className="article-actions">
            <button
              className="share-btn"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: article.title,
                    text: article.excerpt,
                    url: window.location.href,
                  });
                } else {
                  alert("Sharing not supported on this device");
                }
              }}
            >
              📤 Share
            </button>
          </div>
        </footer>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="related-articles">
          <h2>Related Articles</h2>

          <div className="related-grid">
            {relatedArticles.map((related) => (
              <div key={related.id} className="related-card">
                <img
                  src={
                    related.image ||
                    "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  alt={related.title}
                />

                <div className="related-content">
                  <h3>
                    <Link
                      to={related.slug ? `/blog/${related.slug}` : "#"}
                      onClick={handleNavigation}
                    >
                      {related.title}
                    </Link>
                  </h3>

                  <p className="related-excerpt">
                    {related.excerpt}
                  </p>

                  <Link
                    to={related.slug ? `/blog/${related.slug}` : "#"}
                    className="related-link"
                    onClick={handleNavigation}
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="blog-cta">
        <h2>Ready to Transform Your Cooking?</h2>
        <p>
          Use Recipe Finder to discover recipes, plan meals,
          and eat healthier.
        </p>

        <Link to="/" className="cta-button" onClick={handleNavigation}>
          Start Your Journey
        </Link>
      </section>
    </div>
  );
};

export default BlogDetail;