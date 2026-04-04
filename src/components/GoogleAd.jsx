import { useEffect, useRef } from "react";

/**
 * ✅ ADSENSE POLICY COMPLIANT GoogleAd Component
 * 
 * Only shows ads on pages with substantial publisher content.
 * Prevents violations by NOT showing ads on:
 * - Error pages (404, etc)
 * - Login/Auth pages
 * - Loading screens
 * - Forms/Settings pages
 * - Modals/Popups
 * - Pages without content
 * 
 * Props:
 * - pageHasContent: boolean (required) - Only show if page has real content
 * - isLoading: boolean - Hide ads while loading
 * - hasRecipes: number - Only show if there are recipes to display
 */
const GoogleAd = ({ pageHasContent = false, isLoading = false, hasRecipes = 0 }) => {
  const adInitialized = useRef(false);

  // ✅ ADSENSE POLICY: Only show ads if ALL conditions are met
  const shouldShowAd = pageHasContent && !isLoading && hasRecipes > 0;

  useEffect(() => {
    // Only initialize if ad should be shown
    if (!shouldShowAd || adInitialized.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adInitialized.current = true;
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [shouldShowAd]);

  // Return null if ad shouldn't show (no rendering at all)
  if (!shouldShowAd) {
    return null;
  }

  return (
    <div style={{ overflow: "hidden", width: "100%", textAlign: "center", margin: "10px 0" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
        data-ad-client="ca-pub-7458323864944754"
        data-ad-slot="2042837535"
      ></ins>
    </div>
  );
};

export default GoogleAd;