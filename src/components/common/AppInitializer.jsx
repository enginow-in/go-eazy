import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useProperties } from '../../hooks/useProperties'

export const AppInitializer = () => {
  const user = useSelector(s => s.auth.user)
  const { fetchFavorites, fetchRecentlyViewed } = useProperties()

  // Initialize global data once per signed-in user.
  useEffect(() => {
    if (user?.id) {
      fetchFavorites()
      fetchRecentlyViewed()
    }
  }, [user?.id, fetchFavorites, fetchRecentlyViewed])

  return null // This component doesn't render anything UI-wise
}
