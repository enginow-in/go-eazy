import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProperties } from '../../hooks/useProperties'

export const AppInitializer = () => {
  const { user } = useAuth()
  const { fetchFavorites, fetchRecentlyViewed } = useProperties()

  
  useEffect(() => {
    if (user?.id) {
      fetchFavorites()
      fetchRecentlyViewed()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return null // This component doesn't render anything UI-wise
}
