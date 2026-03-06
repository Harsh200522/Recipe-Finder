import { useEffect } from "react";

const GoogleAd = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-format="fluid"
      data-ad-layout-key="-6t+ed+2i-1n-4w"
      data-ad-client="ca-pub-7458323864944754"
      data-ad-slot="2042837535"
    ></ins>
  );
};

export default GoogleAd;