import React, { useState, useEffect, useRef } from 'react'
import { MapPin, ExternalLink, Navigation } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// mapbox-gl is loaded via CDN script in index.html (window.mapboxgl)
// NOT imported/bundled — prevents "Cannot access X before initialization" TDZ
// error caused by mapbox-gl's circular deps in Vite/Rolldown Web Worker bundles.

export const LocationViewer = ({ latitude, longitude, title = 'Location', address }) => {
  const { t } = useTranslation()
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    if (!latitude || !longitude || map.current) return
    const mapboxgl = window.mapboxgl
    const token = import.meta.env.VITE_MAPBOX_TOKEN

    if (!token || !token.startsWith('pk.') || !mapboxgl) {
      setMapError(true)
      console.warn('Mapbox token is missing or invalid. Map rendering skipped.')
      return
    }

    try {
      mapboxgl.accessToken = token

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 15,
        interactive: false,
        attributionControl: false,
      })

      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')
    } catch (err) {
      console.error('Error initializing map:', err)
      setMapError(true)
    }

    map.current.on('load', () => {
      if (!map.current) return

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
          const duration = 1500
          const t = (performance.now() % duration) / duration
          const radius = (size / 2) * 0.3
          const outerRadius = (size / 2) * 0.7 * t + radius
          const ctx = this.context
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
          this.data = ctx.getImageData(0, 0, this.width, this.height).data
          map.current?.triggerRepaint()
          return true
        },
      }

      if (!map.current.hasImage('pulsing-dot')) {
        map.current.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 })
      }

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
    })

    return () => {
      map.current?.remove()
      map.current = null
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

      <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm animate-in fade-in duration-300" style={{ height: '260px' }}>
        {mapError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-6 text-center text-gray-500">
            <MapPin size={32} className="text-gray-300 mb-2" />
            <p className="font-bold text-gray-700 text-sm">Map Preview Unavailable</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              VITE_MAPBOX_TOKEN is missing or invalid in your .env file.
            </p>
          </div>
        ) : (
          <div ref={mapContainer} className="w-full h-full" />
        )}
      </div>

      <div className="mt-4">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl font-bold text-white bg-[#CA3433] hover:bg-[#ac2d2c] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
        >
          <Navigation size={16} />
          {t('property.sections.getDirections')}
        </a>
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        📍 Approximate location shown for privacy
      </p>
    </div>
  )
}
