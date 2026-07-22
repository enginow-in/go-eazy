import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Only scroll to top when the actual page (pathname) changes.
    // This prevents jumping when just switching filters/categories on the search page.
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
