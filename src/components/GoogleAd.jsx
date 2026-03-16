import { useEffect, useRef } from "react";

const GoogleAd = () => {
  const adInitialized = useRef(false);

  useEffect(() => {
    // Only push if we haven't already initialized this specific instance
    if (!adInitialized.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adInitialized.current = true;
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, []);

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