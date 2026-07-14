import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'
import { MOCK_PROPERTIES } from '../utils/constants'
import {
  setListings, appendListings, setFeatured, setCurrentProperty,
  setFavorites, toggleFavorite as toggleFav,
  setRecentlyViewed, addRecentlyViewed,
  setLoading, setHasMore, setPage, setFilters, setTotalCount, resetFilters,
  setReviews, addReview, removeReview, setReviewsLoading, updatePropertyInStore
} from '../store/propertySlice'

const PAGE_SIZE = 12

const PUBLIC_PROPERTY_FIELDS = `
  id, landlord_id, type, title, description, price, city, area, pincode, 
  amenities, images, availability, views, created_at
`

const PUBLIC_PROFILE_FIELDS = 'full_name, avatar_url, bio'

export const useProperties = () => {
  const dispatch = useDispatch()
  const { 
    listings, featured, currentProperty, 
    favorites, recentlyViewed, filters, 
    loading, hasMore, page, totalCount,
    reviews, reviewsLoading 
  } = useSelector(s => s.property)
  const { user, profile } = useSelector(s => s.auth)

  useEffect(() => {
    const channel = supabase
      .channel('public:properties')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'properties' }, (payload) => {
        dispatch(updatePropertyInStore(payload.new))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])

  const fetchProperties = useCallback(async (reset = false) => {
    dispatch(setLoading(true))
    try {
      let query = supabase
        .from('properties')
        .select(`${PUBLIC_PROPERTY_FIELDS}, profiles!properties_landlord_id_fkey(${PUBLIC_PROFILE_FIELDS})`, { count: 'exact' })
        .eq('availability', true)

      if (filters.type) query = query.eq('type', filters.type)
      if (filters.priceMin > 0) query = query.gte('price', filters.priceMin)
      if (filters.priceMax < 100000) query = query.lte('price', filters.priceMax)
      
      if (filters.amenities?.length > 0) {
        query = query.contains('amenities', filters.amenities)
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`)
      }

      if (filters.area) {
        const fuzzyPattern = '%' + filters.area.toLowerCase().split('').filter(c => c.trim()).join('%') + '%'
        query = query.ilike('area', fuzzyPattern)
      }

      const from = reset ? 0 : page * PAGE_SIZE
      const { data, error, count: dbCount } = await query
        .order(filters.sortBy || 'created_at', { ascending: filters.sortOrder === 'asc' })
        .range(from, from + PAGE_SIZE - 1)

      if (error) throw error

      if (reset) {
        dispatch(setListings(data || []))
        dispatch(setTotalCount(dbCount || 0))
      } else {
        dispatch(appendListings(data || []))
      }

      dispatch(setHasMore((data || []).length === PAGE_SIZE))
      dispatch(setPage(reset ? 1 : page + 1))
    } catch (err) {
      console.error('fetchProperties error:', err)
      dispatch(setListings([]))
    } finally {
      dispatch(setLoading(false))
    }
  }, [filters, page, dispatch])

  const fetchFeatured = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`${PUBLIC_PROPERTY_FIELDS}, profiles!properties_landlord_id_fkey(${PUBLIC_PROFILE_FIELDS})`)
        .eq('availability', true)
        .order('views', { ascending: false })
        .limit(8)
      if (error) throw error
      dispatch(setFeatured(data?.length ? data : MOCK_PROPERTIES.sort((a, b) => b.views - a.views).slice(0, 8)))
    } catch {
      dispatch(setFeatured(MOCK_PROPERTIES.sort((a, b) => b.views - a.views).slice(0, 8)))
    }
  }, [dispatch])

  const fetchByType = useCallback(async (type) => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`${PUBLIC_PROPERTY_FIELDS}`)
        .eq('type', type)
        .eq('availability', true)
        .order('views', { ascending: false })
        .limit(10)
      if (error) throw error
      return data?.length ? data : MOCK_PROPERTIES.filter(p => p.type === type)
    } catch {
      return MOCK_PROPERTIES.filter(p => p.type === type)
    }
  }, [])

  const fetchPropertyById = useCallback(async (id) => {
    dispatch(setLoading(true))
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`${PUBLIC_PROPERTY_FIELDS}, profiles!properties_landlord_id_fkey(${PUBLIC_PROFILE_FIELDS})`)
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      dispatch(setCurrentProperty(data))
      
      if (user && data) {
        dispatch(addRecentlyViewed(id))
        await supabase.from('recently_viewed').upsert({ user_id: user.id, property_id: id, viewed_at: new Date().toISOString() })
      }
    } catch (err) {
      console.error('Error fetching property:', err)
    } finally {
      dispatch(setLoading(false))
    }
  }, [user, dispatch])

  const fetchGatedData = useCallback(async (id) => {
    if (!user) return null
    try {
      // 1. Try the RPC first
      const rpcResult = await supabase.rpc('get_unlocked_property_details', { prop_id: id })
      const rpcData = rpcResult.data?.[0] || {}

      // 2. ALWAYS also directly fetch contact_phone + contact_email from properties table
      //    (the RPC may not include these fields, and landlords can always read their own data)
      const { data: directData } = await supabase
        .from('properties')
        .select('contact_phone, contact_email, exact_location')
        .eq('id', id)
        .maybeSingle()

      // 3. Merge — RPC fields take priority, direct fields fill any gaps
      return {
        ...rpcData,
        contact_phone: rpcData?.contact_phone || directData?.contact_phone || null,
        contact_email: rpcData?.contact_email || directData?.contact_email || null,
        exact_location: rpcData?.exact_location || directData?.exact_location || null,
      }
    } catch (err) {
      console.error('Error fetching gated data:', err)
      return null
    }
  }, [user])

  const fetchReviews = useCallback(async (propertyId) => {
    dispatch(setReviewsLoading(true))
    try {
      const { data, error } = await supabase
        .from('property_reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      dispatch(setReviews(data || []))
    } catch (err) {
      console.error('fetchReviews error:', err)
    } finally {
      dispatch(setReviewsLoading(false))
    }
  }, [dispatch])

  const submitReview = async (propertyId, rating, feedback) => {
    if (!user) throw new Error('Must be logged in to submit a review')

    const reviewData = {
      property_id: propertyId,
      reviewer_id: user.id,
      rating,
      feedback,
    }

    const { data, error } = await supabase
      .from('property_reviews')
      .upsert(reviewData, { onConflict: 'property_id,reviewer_id' })
      .select('*, profiles(full_name, avatar_url)')
      .maybeSingle()

    if (error) throw error
    dispatch(addReview(data))
    return data
  }

  const deleteReview = async (reviewId) => {
    if (!user) return
    const { error } = await supabase
      .from('property_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('reviewer_id', user.id)

    if (error) throw error
    dispatch(removeReview(reviewId))
  }

  const createProperty = async (propertyData, images) => {
    const imageUrls = []
    for (const img of images) {
      const ext = img.name.split('.').pop()
      const path = `properties/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('property-images').upload(path, img)
      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)
      const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(path)
      imageUrls.push(publicUrl)
    }
    const { data, error } = await supabase.from('properties').insert({ ...propertyData, landlord_id: user.id, images: imageUrls, views: 0 }).select().maybeSingle()
    if (error) throw error
    return data
  }

  const updateProperty = async (id, updates, newImages) => {
    let imageUrls = updates.images || []
    if (newImages?.length) {
      for (const img of newImages) {
        const ext = img.name.split('.').pop()
        const path = `properties/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('property-images').upload(path, img)
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(path)
        imageUrls.push(publicUrl)
      }
    }
    const { data, error } = await supabase.from('properties').update({ ...updates, images: imageUrls }).eq('id', id).eq('landlord_id', user.id).select().maybeSingle()
    if (error) throw error
    return data
  }

  const deleteProperty = async (id) => {
    const { count, error } = await supabase.from('properties').delete({ count: 'exact' }).eq('id', id).eq('landlord_id', user.id)
    if (error) throw error
    return count > 0
  }

  const fetchFavorites = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('favorites').select('property_id').eq('user_id', user.id)
      if (error) throw error
      dispatch(setFavorites(data?.map(f => f.property_id) || []))
    } catch { /* silent */ }
  }, [user, dispatch])

  const toggleFavorite = async (propertyId) => {
    if (!user) return
    const isFav = favorites.includes(propertyId)
    dispatch(toggleFav(propertyId))
    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId)
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, property_id: propertyId })
      }
    } catch (err) {
      dispatch(toggleFav(propertyId))
    }
  }

  const fetchRecentlyViewed = useCallback(async () => {
    if (!user) return
    try {
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      const { data } = await supabase.from('recently_viewed').select('property_id').eq('user_id', user.id).gte('viewed_at', seventyTwoHoursAgo).order('viewed_at', { ascending: false }).limit(20)
      dispatch(setRecentlyViewed(data?.map(r => r.property_id) || []))
    } catch {}
  }, [user, dispatch])

  const getLandlordProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  const getRecommendedProperties = useCallback(() => {
    // If no listings or no quiz data, return empty
    if (!listings || listings.length === 0 || !profile?.onboarding_data) return []

    const prefs = profile.onboarding_data

    // If user explicitly skipped or haven't finished quiz
    if (prefs?.skipped || !prefs?.persona) return []

    let filtered = [...listings]

    // 1. Strict filtering (City + Type)
    if (prefs?.type) {
      filtered = filtered.filter(p => p.type === prefs.type)
    }
    
    if (prefs?.city) {
      filtered = filtered.filter(p => 
        p.city?.toLowerCase() === prefs.city.toLowerCase() || 
        p.address?.toLowerCase().includes(prefs.city.toLowerCase())
      )
    }

    // 2. Budget filtering
    if (prefs?.budget?.range) {
      const [min, max] = prefs.budget.range
      filtered = filtered.filter(p => p.price >= min && p.price <= max)
    }

    // 3. Fallback logic: if strictly filtered is empty, try type only
    if (filtered.length === 0 && prefs?.type) {
      filtered = listings.filter(p => p.type === prefs.type).slice(0, 10)
    }

    // Sort randomly and limit to 8 results for the section
    return filtered.sort(() => 0.5 - Math.random()).slice(0, 8)
  }, [listings, profile])

  return {
    listings, featured, currentProperty, favorites, recentlyViewed, filters,
    loading, hasMore, page, totalCount,
    fetchProperties, fetchFeatured, fetchByType, fetchPropertyById,
    createProperty, updateProperty, deleteProperty,
    fetchFavorites, toggleFavorite, fetchRecentlyViewed, getLandlordProperties,
    updateFilters: useCallback((f) => dispatch(setFilters(f)), [dispatch]),
    resetFilters: useCallback(() => dispatch(resetFilters()), [dispatch]),
    getRecommendedProperties,
    fetchGatedData,
    reviews, reviewsLoading,
    fetchReviews, submitReview, deleteReview
  }
}
