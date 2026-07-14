import React, { useState, useEffect } from 'react'
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export const UserPreferences = () => {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState({
    budget_min: '',
    budget_max: '',
    preferred_locations: [],
    property_types: [],
    amenities: [],
    notification_settings: {
      price_drops: true,
      new_matches: true,
      booking_updates: true,
      messages: true
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const propertyTypes = ['Studio', '1RK', '1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Penthouse']
  const amenitiesList = ['Parking', 'WiFi', 'AC', 'Gym', 'Pool', 'Security', 'Power Backup', 'Water Supply']
  const popularLocations = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Chennai', 'Hyderabad', 'Gurgaon', 'Noida']

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setPreferences(prev => ({
          ...prev,
          ...data,
          preferred_locations: data.preferred_locations || [],
          property_types: data.property_types || [],
          amenities: data.amenities || [],
          notification_settings: data.notification_settings || prev.notification_settings
        }))
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      setError('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleArrayToggle = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const handleNotificationToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings,
        [key]: !prev.notification_settings[key]
      }
    }))
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings size={20} className="text-[#CA3433]" />
          Your Preferences
        </h3>
        <button
          onClick={savePreferences}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            saved 
              ? 'bg-green-100 text-green-700' 
              : saving
              ? 'bg-gray-100 text-gray-500'
              : 'bg-[#CA3433] text-white hover:bg-red-600'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle size={16} />
              Saved!
            </>
          ) : saving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Preferences
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Budget Range */}
        <div>
          <h4 className="font-bold text-gray-800 mb-3">Budget Range</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Min Budget</label>
              <input
                type="number"
                value={preferences.budget_min}
                onChange={(e) => setPreferences(prev => ({ ...prev, budget_min: e.target.value }))}
                placeholder="₹10,000"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CA3433] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Budget</label>
              <input
                type="number"
                value={preferences.budget_max}
                onChange={(e) => setPreferences(prev => ({ ...prev, budget_max: e.target.value }))}
                placeholder="₹50,000"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CA3433] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Preferred Locations */}
        <div>
          <h4 className="font-bold text-gray-800 mb-3">Preferred Locations</h4>
          <div className="flex flex-wrap gap-2">
            {popularLocations.map(location => (
              <button
                key={location}
                onClick={() => handleArrayToggle('preferred_locations', location)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  preferences.preferred_locations.includes(location)
                    ? 'bg-[#CA3433] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        {/* Property Types */}
        <div>
          <h4 className="font-bold text-gray-800 mb-3">Property Types</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {propertyTypes.map(type => (
              <button
                key={type}
                onClick={() => handleArrayToggle('property_types', type)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  preferences.property_types.includes(type)
                    ? 'bg-[#CA3433] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h4 className="font-bold text-gray-800 mb-3">Preferred Amenities</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {amenitiesList.map(amenity => (
              <button
                key={amenity}
                onClick={() => handleArrayToggle('amenities', amenity)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  preferences.amenities.includes(amenity)
                    ? 'bg-[#CA3433] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <h4 className="font-bold text-gray-800 mb-3">Notification Preferences</h4>
          <div className="space-y-3">
            {Object.entries(preferences.notification_settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium capitalize text-gray-700">
                  {key.replace('_', ' ')}
                </span>
                <button
                  onClick={() => handleNotificationToggle(key)}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                    value ? 'bg-[#CA3433]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-1 ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}