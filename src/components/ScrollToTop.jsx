// ScrollToTop.jsx
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Scroll window
    window.scrollTo(0, 0);

    // Scroll document
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Scroll ALL possible containers (this is the real fix)
    const containers = document.querySelectorAll("*");
    containers.forEach((el) => {
      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop = 0;
      }
    });

  }, [pathname]);

  return null;
};

export default ScrollToTop;