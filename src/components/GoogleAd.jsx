import { useEffect, useRef } from "react";

const GoogleAd = () => {
  const adRef = useRef(null);
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  useEffect(() => {
    if (!adRef.current) return;

    // Prevent duplicate initialization on the same <ins> element.
    if (adRef.current.getAttribute("data-adsbygoogle-status")) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.log("AdSense error:", e);
    }
  }, []);

  return (
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={{ display: "block", margin: "20px 0", minHeight: "90px" }}
      data-ad-client="ca-pub-7458323864944754"
      data-ad-slot="1234567890"
      data-ad-format="auto"
      data-full-width-responsive="true"
      data-adtest={isLocalhost ? "on" : undefined}
    ></ins>
  );
};

export default GoogleAd;
