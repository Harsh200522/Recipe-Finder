import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';

/**
 * SEO Component - Handles all meta tags and structured data
 * Usage: Wrap your component content with <SEO> tags
 */
export const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedDate,
  modifiedDate,
  articleBody,
  schema,
}) => {
  const siteUrl = 'https://recipefinder.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const finalImage = image || `${siteUrl}/og-image.png`;

  return (
    <Helmet>
      {/* Essential Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="utf-8" />

      {/* Open Graph Tags (Social Media) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Recipe Finder" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalImage} />

      {/* Article-Specific Tags */}
      {type === 'article' && (
        <>
          <meta property="article:published_time" content={publishedDate} />
          {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
          {author && <meta property="article:author" content={author} />}
          <meta property="article:section" content="Nutrition" />
        </>
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content={author || 'Recipe Finder Team'} />
    </Helmet>
  );
};

export default SEO;
