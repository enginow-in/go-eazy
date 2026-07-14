import React, { useEffect, useRef } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'

// mapbox-gl is loaded via CDN script in index.html (window.mapboxgl)
// NOT imported/bundled — prevents "Cannot access X before initialization" TDZ
// error caused by mapbox-gl's circular deps in Vite/Rolldown Web Worker bundles.

export const LocationViewer = ({ latitude, longitude, title = 'Location', address }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!latitude || !longitude || map.current) return
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) { console.error('mapbox-gl not loaded from CDN'); return }

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 15,
      interactive: false,
      attributionControl: false,
    })

    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

    map.current.on('load', () => {
      // Prevent running if component unmounted before map loaded
      if (!map.current || !isMounted.current) return

      const size = 120
      const pulsingDot = {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),
        onAdd() {
          const canvas = document.createElement('canvas')
          canvas.width = this.width
          canvas.height = this.height
          this.context = canvas.getContext('2d', { willReadFrequently: true })
        },
        render() {
          // Strict check: Map handle check to prevent background canvas memory leak
          if (!map.current || !isMounted.current) return false

          const duration = 1500
          const t = (performance.now() % duration) / duration
          const radius = (size / 2) * 0.3
          const outerRadius = (size / 2) * 0.7 * t + radius
          const ctx = this.context
          
          if (!ctx) return false

          ctx.clearRect(0, 0, this.width, this.height)
          ctx.beginPath()
          ctx.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(202, 52, 51, ${1 - t})`
          ctx.fill()
          
          ctx.beginPath()
          ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(202, 52, 51, 1)'
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 3
          ctx.fill()
          ctx.stroke()
          
          try {
            const imageData = ctx.getImageData(0, 0, this.width, this.height)
            this.data = imageData.data
          } catch (e) {
            // Silence silent browser DOM exceptions during rapid unmounts
            return false
          }

          if (map.current) {
            map.current.triggerRepaint()
          }
          return true
        },
      }

      // Safe registration guard to avoid duplication errors on hot-reload
      if (map.current && !map.current.hasImage('pulsing-dot')) {
        map.current.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 })
      }

      if (map.current) {
        map.current.addSource('location-point', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [longitude, latitude] },
              properties: { title },
            }],
          },
        })

        map.current.addLayer({
          id: 'pulsing-dot-layer',
          type: 'symbol',
          source: 'location-point',
          layout: { 'icon-image': 'pulsing-dot', 'icon-allow-overlap': true },
        })
      }
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [latitude, longitude, title])

  if (!latitude || !longitude) return null

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`

  return (
    <div className="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight font-display flex items-center gap-2">
          <MapPin size={22} className="text-[#CA3433]" />
          Location on Map
        </h2>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-[#CA3433] hover:text-[#ac2d2c] transition-colors"
        >
          Open in Maps <ExternalLink size={12} />
        </a>
      </div>

      {address && (
        <p className="text-sm text-gray-500 mb-4 leading-relaxed flex items-start gap-2">
          <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
          {address}
        </p>
      )}

      <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: '260px' }}>
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        📍 Approximate location shown for privacy
      </p>
    </div>
  )
}