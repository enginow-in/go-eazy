import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setRecentlyViewed, addRecentlyViewed } from '../store/propertySlice'
import { supabase } from '../lib/supabase'

export const useRecentlyViewed = () => {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const recentlyViewedIds = useSelector(s => s.property.recentlyViewed)

  // Load initial list from localStorage
  const loadLocal = useCallback(() => {
    try {
      const localData = localStorage.getItem('goeazy_recently_viewed')
      if (localData) {
        const ids = JSON.parse(localData)
        if (Array.isArray(ids)) {
          dispatch(setRecentlyViewed(ids))
        }
      }
    } catch (e) {
      console.error('Error reading localStorage for recently viewed:', e)
    }
  }, [dispatch])

  // Sync to localStorage whenever Redux state changes
  useEffect(() => {
    try {
      localStorage.setItem('goeazy_recently_viewed', JSON.stringify(recentlyViewedIds))
    } catch (e) {
      console.error('Error writing recently viewed to localStorage:', e)
    }
  }, [recentlyViewedIds])

  // Initial load
  useEffect(() => {
    loadLocal()
  }, [loadLocal])

  // Add a property to recently viewed
  const trackView = useCallback(async (propertyId) => {
    if (!propertyId) return
    
    // Add to Redux (which will sync to localStorage via effect)
    dispatch(addRecentlyViewed(propertyId))
    
    // If logged in, upsert to Supabase too
    if (user) {
      try {
        await supabase.from('recently_viewed').upsert({
          user_id: user.id,
          property_id: propertyId,
          viewed_at: new Date().toISOString()
        })
      } catch (err) {
        console.error('Error upserting recently viewed to DB:', err)
      }
    }
  }, [user, dispatch])

  return {
    recentlyViewedIds,
    trackView
  }
}
