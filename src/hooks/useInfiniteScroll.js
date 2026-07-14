import { useEffect, useRef } from "react";

export const useInfiniteScroll = ({
  loading,
  hasMore,
  onLoadMore,
  root = null,
  rootMargin = "200px",
  threshold = 0,
}) => {
  const observer = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    const element = targetRef.current;

    if (!element || loading || !hasMore) return;

    observer.current?.disconnect();

    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore?.();
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.current.observe(element);

    return () => {
      observer.current?.disconnect();
    };
  }, [loading, hasMore, onLoadMore, root, rootMargin, threshold]);

  return targetRef;
};