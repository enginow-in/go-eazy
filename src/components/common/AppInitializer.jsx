import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProperties } from '../../hooks/useProperties'
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed'

export const AppInitializer = () => {
  const { user } = useAuth()
  const { fetchFavorites, fetchRecentlyViewed } = useProperties()
  useRecentlyViewed() // Initialize and sync recently viewed properties

  // Initialize global data once on login — use user.id to avoid re-firing
  // on every render when hook references change
  useEffect(() => {
    if (user?.id) {
      fetchFavorites()
      fetchRecentlyViewed()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return null // This component doesn't render anything UI-wise
}
