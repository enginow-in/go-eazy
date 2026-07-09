import { useState, useEffect } from 'react';

/**
 * Custom hook to cleanly preload an image and manage its loading state.
 * This guarantees the browser has cached the HD image before we attempt to swap it,
 * preventing any mid-render layout shifts.
 */
export const useFluidZLS = (src) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    // Reset states if src changes
    setIsLoaded(false);
    setHasError(false);

    const img = new Image();
    img.src = src;

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setHasError(true);

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // If it's already in browser cache, it might load instantly
    if (img.complete) {
      setIsLoaded(true);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src]);

  return { isLoaded, hasError };
};
