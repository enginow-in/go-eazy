import { useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'

export const useRoommates = () => {
  const { user, profile } = useSelector(s => s.auth)
  const [roommates, setRoommates] = useState([])
  const [loading, setLoading] = useState(false)

  // 1. Compatibility scoring function
  const calculateCompatibility = useCallback((userProfile, otherProfile) => {
    if (!userProfile?.roommate_profile || !otherProfile?.roommate_profile) return 0

    const up = userProfile.roommate_profile
    const op = otherProfile.roommate_profile

    let score = 0
    let totalWeights = 0

    // 1. Sleeping habits (Weight: 25)
    if (up.sleeping_habits && op.sleeping_habits) {
      totalWeights += 25
      if (up.sleeping_habits === op.sleeping_habits) {
        score += 25
      } else if (up.sleeping_habits === 'Flexible' || op.sleeping_habits === 'Flexible') {
        score += 15
      }
    }

    // 2. Smoking & Drinking (Weight: 25)
    if (up.smoking_drinking && op.smoking_drinking) {
      totalWeights += 25
      if (up.smoking_drinking === op.smoking_drinking) {
        score += 25
      } else if (up.smoking_drinking === 'None' || op.smoking_drinking === 'None') {
        if (up.smoking_drinking === 'Occasional' || op.smoking_drinking === 'Occasional') {
          score += 10
        }
      } else {
        score += 12.5
      }
    }

    // 3. Food Preference (Weight: 25)
    if (up.food_preference && op.food_preference) {
      totalWeights += 25
      if (up.food_preference === op.food_preference) {
        score += 25
      } else if (up.food_preference === 'Veg & Non-Veg' || op.food_preference === 'Veg & Non-Veg') {
        score += 20
      }
    }

    // 4. College / University (Weight: 25)
    if (up.college_name && op.college_name) {
      totalWeights += 25
      if (up.college_name.toLowerCase().trim() === op.college_name.toLowerCase().trim()) {
        score += 25
      }
    }

    if (totalWeights === 0) return 0
    return Math.round((score / totalWeights) * 100)
  }, [])

  // 2. Fetch Roommate Profiles from Supabase
  const fetchRoommates = useCallback(async (filters = {}) => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_looking_for_roommate', true)

      // Exclude current user if logged in
      if (user) {
        query = query.neq('id', user.id)
      }

      // Filter by city (from roommate_profile or profile address/city)
      if (filters.city) {
        query = query.ilike('roommate_profile->>city', `%${filters.city}%`)
      }

      // Filter by college name
      if (filters.college_name) {
        query = query.ilike('roommate_profile->>college_name', `%${filters.college_name}%`)
      }

      // Filter by budget max
      if (filters.priceMax && filters.priceMax < 100000) {
        query = query.lte('roommate_profile->>budget', filters.priceMax)
      }

      // Filter by gender preference
      if (filters.gender && filters.gender !== 'Any') {
        query = query.eq('roommate_profile->>gender', filters.gender)
      }

      // Filter by food preference
      if (filters.food_preference) {
        query = query.eq('roommate_profile->>food_preference', filters.food_preference)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Calculate compatibility scores and sort by match percentage
      const enrichedRoommates = (data || []).map(r => {
        const matchScore = calculateCompatibility(profile, r)
        return { ...r, matchScore }
      })

      // Sort by compatibility score desc
      enrichedRoommates.sort((a, b) => b.matchScore - a.matchScore)

      setRoommates(enrichedRoommates)
      return enrichedRoommates
    } catch (e) {
      console.error('Error fetching roommates:', e)
      setRoommates([])
      return []
    } finally {
      setLoading(false)
    }
  }, [user, profile, calculateCompatibility])

  return {
    roommates,
    loading,
    fetchRoommates,
    calculateCompatibility
  }
}
