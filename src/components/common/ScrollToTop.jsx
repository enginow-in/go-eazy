import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  try {
    window.history.scrollRestoration = 'manual';
  } catch (err) {
    console.error('ScrollToTop: failed to set scrollRestoration', err);
  }
}

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('ScrollToTop: scrollTo failed', err);
    }
    // Only scroll to top when the actual page (pathname) changes.
    // This prevents jumping when just switching filters/categories on the search page.
  }, [pathname]);

  return null;
};

export default ScrollToTop;
