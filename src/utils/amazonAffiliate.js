const DEFAULT_AFFILIATE_TAG = "youraffid-21";

export const buildAmazonIndiaIngredientsSearchUrl = (
  recipeTitle,
  affiliateTag = DEFAULT_AFFILIATE_TAG
) => {
  const normalizedTitle = (recipeTitle || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!normalizedTitle) return "";

  const query = `${normalizedTitle} ingredients`;
  const encodedQuery = encodeURIComponent(query).replace(/%20/g, "+");

  return `https://www.amazon.in/s?k=${encodedQuery}&tag=${affiliateTag}`;
};

export const openAmazonIndiaIngredientsSearch = (
  recipeTitle,
  affiliateTag = DEFAULT_AFFILIATE_TAG
) => {
  const url = buildAmazonIndiaIngredientsSearchUrl(recipeTitle, affiliateTag);
  if (!url) return;

  window.open(url, "_blank", "noopener,noreferrer");
};
