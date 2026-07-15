import React, { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Search, Navigation, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { logger } from '../../utils/logger'

// mapbox-gl is loaded via CDN script in index.html (window.mapboxgl)
// NOT imported/bundled — prevents "Cannot access X before initialization" TDZ
// error caused by mapbox-gl's circular deps in Vite/Rolldown Web Worker bundles.

const DEFAULT_CENTER = [78.0322, 30.3165]
const DEFAULT_ZOOM = 11

export const LocationPicker = ({ value, onChange, label = 'Pin Location on Map' }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  const [gpsLoading, setGpsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [hasPin, setHasPin] = useState(false)

  // Reverse geocode coordinates → human-readable address
  const reverseGeocode = useCallback(async (lng, lat) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&language=en&country=IN`
      )
      const data = await res.json()
      return data.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }, [])

  // Place/update the draggable marker
  const placeMarker = useCallback(async (lng, lat, addressOverride) => {
    const mapboxgl = window.mapboxgl
    if (!map.current || !mapboxgl) return

    if (marker.current) marker.current.remove()

    const el = document.createElement('div')
    el.style.cssText = `
      width: 40px; height: 40px;
      background: #CA3433; border: 3px solid white;
      border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
      box-shadow: 0 4px 16px rgba(202,52,51,0.4);
      cursor: grab;
    `

    marker.current = new mapboxgl.Marker({ element: el, draggable: true, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(map.current)

    map.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 })
    setHasPin(true)

    const address = addressOverride || await reverseGeocode(lng, lat)
    onChange?.({ latitude: lat, longitude: lng, map_address: address })

    marker.current.on('dragend', async () => {
      const { lng: newLng, lat: newLat } = marker.current.getLngLat()
      const newAddress = await reverseGeocode(newLng, newLat)
      onChange?.({ latitude: newLat, longitude: newLng, map_address: newAddress })
    })
  }, [reverseGeocode, onChange])

  // Init map using window.mapboxgl (loaded from CDN in index.html)
  useEffect(() => {
    if (map.current) return
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) { logger.error('mapbox-gl not loaded from CDN'); return }

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: value?.longitude ? [value.longitude, value.latitude] : DEFAULT_CENTER,
      zoom: value?.longitude ? 15 : DEFAULT_ZOOM,
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

    map.current.on('click', (e) => {
      placeMarker(e.lngLat.lng, e.lngLat.lat)
    })

    if (value?.latitude && value?.longitude) {
      map.current.on('load', () => {
        placeMarker(value.longitude, value.latitude, value.map_address)
      })
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, []) // eslint-disable-line

  // GPS: Use Current Location
  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placeMarker(pos.coords.longitude, pos.coords.latitude)
        setGpsLoading(false)
        toast.success('Location detected!')
      },
      (err) => {
        setGpsLoading(false)
        if (err.code === 1) toast.error('Location permission denied. Please allow access.')
        else toast.error('Could not get your location. Try searching instead.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  // Mapbox Geocoding Search
  const handleSearch = useCallback(async (query) => {
    if (!query.trim() || query.trim().length < 3) { setSearchResults([]); setShowResults(false); return }
    setSearchLoading(true)
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&country=IN&proximity=78.0322,30.3165&language=en&limit=5`
      )
      const data = await res.json()
      setSearchResults(data.features || [])
      setShowResults(true)
    } catch {
      toast.error('Search failed, please try again')
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const handleSearchInput = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(q), 500)
  }

  const handleSelectResult = (feature) => {
    const [lng, lat] = feature.center
    placeMarker(lng, lat, feature.place_name)
    setSearchQuery(feature.place_name)
    setShowResults(false)
    setSearchResults([])
  }

  const handleClearPin = () => {
    if (marker.current) { marker.current.remove(); marker.current = null }
    setHasPin(false)
    onChange?.({ latitude: null, longitude: null, map_address: '' })
    map.current?.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 800 })
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!searchRef.current?.contains(e.target)) setShowResults(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-700">
        <MapPin size={14} className="inline mr-1.5 text-[#CA3433]" />
        {label}
      </label>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* GPS Button */}
        <button
          type="button"
          onClick={handleGPS}
          disabled={gpsLoading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#CA3433] text-white text-sm font-bold rounded-xl hover:bg-[#ac2d2c] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {gpsLoading ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
          {gpsLoading ? 'Detecting...' : 'Use My Location'}
        </button>

        {/* Address Search */}
        <div className="relative flex-1" ref={searchRef}>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search address, area or city..."
              className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#CA3433] focus:ring-2 focus:ring-[#CA3433]/10 transition-all"
            />
            {searchLoading && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
            )}
            {searchQuery && !searchLoading && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
              {searchResults.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => handleSelectResult(feature)}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-[#CA3433] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{feature.text}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{feature.place_name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-400">
        {hasPin
          ? '✅ Location pinned — drag the marker to fine-tune'
          : 'Use GPS, search an address, or click directly on the map to drop a pin'}
      </p>

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '320px' }}>
        <div ref={mapContainer} className="w-full h-full" />
        {hasPin && (
          <button
            type="button"
            onClick={handleClearPin}
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-100"
          >
            <X size={12} /> Remove Pin
          </button>
        )}
      </div>
    </div>
  )
}
