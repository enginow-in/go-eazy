import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addRecentlyViewed, setRecentlyViewed } from '../store/propertySlice';

const STORAGE_KEY = 'recently_viewed_properties';
const MAX_RECENT = 20;

export function useRecentlyViewed() {
  const dispatch = useDispatch();
  const recentlyViewed = useSelector((state) => state.property.recentlyViewed);

  // Sync from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids) && ids.length > 0) {
          dispatch(setRecentlyViewed(ids.slice(0, MAX_RECENT)));
        }
      }
    } catch (err) {
      console.error('Error loading recently viewed from storage:', err);
    }
  }, [dispatch]);

  // Sync to localStorage when Redux state changes
  useEffect(() => {
    if (recentlyViewed && recentlyViewed.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
      } catch (err) {
        console.error('Error saving recently viewed to storage:', err);
      }
    }
  }, [recentlyViewed]);

  const addToRecentlyViewed = (propertyId) => {
    if (!propertyId) return;
    dispatch(addRecentlyViewed(propertyId));
  };

  const clearRecentlyViewed = () => {
    dispatch(setRecentlyViewed([]));
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    recentlyViewed: recentlyViewed || [],
    addToRecentlyViewed,
    clearRecentlyViewed,
  };
}