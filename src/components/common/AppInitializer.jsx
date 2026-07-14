import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useProperties } from '../../hooks/useProperties'

export const AppInitializer = () => {
  const { user } = useSelector(s => s.auth)
  const { fetchFavorites, fetchRecentlyViewed } = useProperties()

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
