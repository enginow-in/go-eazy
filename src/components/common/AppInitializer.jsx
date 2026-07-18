import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useAuth } from '../../hooks/useAuth'
import { useProperties } from '../../hooks/useProperties'
import { setFavorites, setRecentlyViewed } from '../../store/propertySlice'

export const AppInitializer = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { fetchFavorites, fetchRecentlyViewed } = useProperties()

  // Initialize global data once on login — use user.id to avoid re-firing
  // on every render when hook references change
  useEffect(() => {
    // These collections belong to one account. Clear them before loading
    // another user, and keep them empty after logout.
    dispatch(setFavorites([]))
    dispatch(setRecentlyViewed([]))

    if (user?.id) {
      fetchFavorites()
      fetchRecentlyViewed()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, dispatch])

  return null // This component doesn't render anything UI-wise
}
