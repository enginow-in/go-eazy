import React, { useEffect, useRef } from 'react'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

export const DrawMap = ({ onPolygonChange, listings }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const draw = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (map.current) return

    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [78.0322, 30.3165],
      zoom: 11,
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

    // Import MapboxDraw dynamically since it relies on window
    import('@mapbox/mapbox-gl-draw').then(MapboxDraw => {
      draw.current = new MapboxDraw.default({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        }
      })

      map.current.addControl(draw.current, 'top-left')

      const updatePolygon = () => {
        const data = draw.current.getAll()
        if (data.features.length > 0) {
          onPolygonChange(data.features[0].geometry)
        } else {
          onPolygonChange(null)
        }
      }

      map.current.on('draw.create', updatePolygon)
      map.current.on('draw.delete', updatePolygon)
      map.current.on('draw.update', updatePolygon)
    })

    return () => {
      markersRef.current.forEach(m => m.remove())
      map.current?.remove()
      map.current = null
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!map.current || !window.mapboxgl) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    listings.forEach(prop => {
      if (prop.latitude && prop.longitude) {
        const el = document.createElement('div')
        el.style.cssText = `
          width: 20px; height: 20px;
          background: #CA3433; border: 2px solid white;
          border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        `
        const marker = new window.mapboxgl.Marker({ element: el })
          .setLngLat([prop.longitude, prop.latitude])
          .addTo(map.current)
        markersRef.current.push(marker)
      }
    })
  }, [listings])

  return (
    <div className="relative w-full h-[500px] sm:h-[600px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-4 left-14 bg-white px-4 py-2 rounded-xl shadow-md text-sm font-bold text-gray-700 pointer-events-none z-10">
        Draw a shape to filter properties
      </div>
    </div>
  )
}
