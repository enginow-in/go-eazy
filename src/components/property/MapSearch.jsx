import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { PropertyCard } from './PropertyCard'

export const MapSearch = ({ listings }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) {
      console.error('mapbox-gl not loaded from CDN')
      return
    }

    if (!map.current) {
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [78.0322, 30.3165], // default center
        zoom: 6,
        attributionControl: false,
      })
      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    }

    const currentMap = map.current

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    if (listings.length === 0) return

    // Calculate bounds
    const bounds = new mapboxgl.LngLatBounds()
    let hasValidCoords = false

    listings.forEach(p => {
      if (!p.latitude || !p.longitude) return
      hasValidCoords = true
      bounds.extend([p.longitude, p.latitude])

      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'bg-[#CA3433] text-white px-3 py-1.5 rounded-full shadow-lg text-[13px] font-bold border-2 border-white hover:scale-110 transition-transform cursor-pointer flex items-center justify-center'
      el.innerHTML = `₹${(p.price >= 100000 ? (p.price / 100000).toFixed(1) + 'L' : (p.price / 1000).toFixed(1) + 'k')}`

      // Create popup DOM node
      const popupNode = document.createElement('div')
      const root = createRoot(popupNode)
      root.render(
        <div className="w-[280px] -m-3">
          <PropertyCard property={p} layout="grid" hideCompare />
        </div>
      )

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        maxWidth: '300px',
        className: 'rounded-2xl overflow-hidden shadow-2xl border-0'
      }).setDOMContent(popupNode)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([p.longitude, p.latitude])
        .setPopup(popup)
        .addTo(currentMap)

      markersRef.current.push(marker)
    })

    if (hasValidCoords) {
      currentMap.fitBounds(bounds, { padding: 50, maxZoom: 14 })
    }

    return () => {
      // Don't destroy map on every listings change, just cleanup on unmount
    }
  }, [listings])

  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  return (
    <div className="w-full h-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Mapbox global popup styling override */}
      <style dangerouslySetInnerHTML={{__html: `
        .mapboxgl-popup-content {
          padding: 0 !important;
          border-radius: 1rem !important;
          overflow: hidden;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.2) !important;
        }
        .mapboxgl-popup-tip {
          display: none;
        }
      `}} />
    </div>
  )
}
