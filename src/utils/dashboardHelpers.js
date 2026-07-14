import { supabase } from '../lib/supabase'

// Save user search to history
export const saveSearchToHistory = async (userId, searchParams) => {
  try {
    const { data, error } = await supabase
      .from('search_history')
      .insert({
        user_id: userId,
        location: searchParams.location,
        property_type: searchParams.propertyType,
        budget: searchParams.budget,
        query_params: searchParams
      })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error saving search history:', error)
    return { success: false, error }
  }
}

// Create notification for user
export const createNotification = async (userId, type, title, message, relatedPropertyId = null) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_property_id: relatedPropertyId
      })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }
}

// Add property to recently viewed
export const addToRecentlyViewed = async (userId, propertyId) => {
  try {
    const { data, error } = await supabase
      .from('recently_viewed')
      .upsert({
        user_id: userId,
        property_id: propertyId,
        viewed_at: new Date().toISOString()
      })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error adding to recently viewed:', error)
    return { success: false, error }
  }
}

// Toggle property favorite
export const toggleFavorite = async (userId, propertyId) => {
  try {
    // Check if already favorited
    const { data: existing, error: checkError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existing) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId)

      if (error) throw error
      return { success: true, action: 'removed' }
    } else {
      // Add to favorites
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          property_id: propertyId
        })

      if (error) throw error
      return { success: true, action: 'added', data }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return { success: false, error }
  }
}

// Submit rental application
export const submitRentalApplication = async (userId, propertyId, landlordId, message, documents = {}) => {
  try {
    const { data, error } = await supabase
      .from('rental_applications')
      .insert({
        user_id: userId,
        property_id: propertyId,
        landlord_id: landlordId,
        message,
        documents,
        status: 'pending'
      })

    if (error) throw error

    // Create notification for landlord
    await createNotification(
      landlordId,
      'booking',
      'New Rental Application',
      `You have received a new rental application for your property.`,
      propertyId
    )

    return { success: true, data }
  } catch (error) {
    console.error('Error submitting application:', error)
    return { success: false, error }
  }
}

// Schedule site visit
export const scheduleSiteVisit = async (userId, propertyId, landlordId, visitDate, message) => {
  try {
    const { data, error } = await supabase
      .from('site_visits')
      .insert({
        user_id: userId,
        property_id: propertyId,
        landlord_id: landlordId,
        visit_date: visitDate,
        message,
        status: 'pending'
      })

    if (error) throw error

    // Create notification for landlord
    await createNotification(
      landlordId,
      'booking',
      'New Site Visit Request',
      `Someone wants to visit your property on ${new Date(visitDate).toLocaleDateString()}.`,
      propertyId
    )

    return { success: true, data }
  } catch (error) {
    console.error('Error scheduling visit:', error)
    return { success: false, error }
  }
}

// Get user preferences
export const getUserPreferences = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return { success: true, data: data || null }
  } catch (error) {
    console.error('Error getting user preferences:', error)
    return { success: false, error }
  }
}

// Save user preferences
export const saveUserPreferences = async (userId, preferences) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error saving preferences:', error)
    return { success: false, error: error.message }
  }
}

// Mark notifications as read
export const markNotificationsAsRead = async (userId, notificationIds = null) => {
  try {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)

    if (notificationIds) {
      query = query.in('id', notificationIds)
    }

    const { data, error } = await query

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return { success: false, error }
  }
}

// Get property recommendations based on user preferences and activity
export const getPersonalizedRecommendations = async (userId, limit = 6) => {
  try {
    // Get user preferences first
    const { data: preferences } = await getUserPreferences(userId)
    
    // Get user's favorite locations and property types from activity
    const [favoritesRes, searchHistoryRes] = await Promise.all([
      supabase
        .from('favorites')
        .select('property:properties(city, property_type, rent)')
        .eq('user_id', userId)
        .limit(20),
      supabase
        .from('search_history')
        .select('location, property_type, budget')
        .eq('user_id', userId)
        .limit(20)
    ])

    // Extract user activity patterns
    const activityLocations = [
      ...favoritesRes.data?.map(f => f.property?.city).filter(Boolean) || [],
      ...searchHistoryRes.data?.map(s => s.location).filter(Boolean) || []
    ]

    const activityTypes = [
      ...favoritesRes.data?.map(f => f.property?.property_type).filter(Boolean) || [],
      ...searchHistoryRes.data?.map(s => s.property_type).filter(Boolean) || []
    ]

    // Build query based on preferences and activity
    let query = supabase
      .from('properties')
      .select('*')
      .neq('user_id', userId) // Don't recommend user's own properties

    // Apply filters based on preferences or activity
    const locations = preferences?.preferred_locations?.length > 0 
      ? preferences.preferred_locations 
      : [...new Set(activityLocations)].slice(0, 5)

    const propertyTypes = preferences?.property_types?.length > 0 
      ? preferences.property_types 
      : [...new Set(activityTypes)].slice(0, 3)

    if (locations.length > 0) {
      query = query.in('city', locations)
    }
    
    if (propertyTypes.length > 0) {
      query = query.in('property_type', propertyTypes)
    }

    // Apply budget filter if available
    if (preferences?.budget_min && preferences?.budget_max) {
      query = query
        .gte('rent', preferences.budget_min)
        .lte('rent', preferences.budget_max)
    }

    const { data, error } = await query
      .order('views', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return { success: false, error, data: [] }
  }
}