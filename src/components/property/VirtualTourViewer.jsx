import React, { useEffect, useRef } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'

export const VirtualTourViewer = ({ panorama }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !panorama) return undefined
    const viewer = new Viewer({
      container: containerRef.current,
      panorama,
      navbar: ['zoom', 'fullscreen'],
    })
    return () => viewer.destroy()
  }, [panorama])

  return <div ref={containerRef} className="h-[360px] w-full overflow-hidden rounded-2xl bg-gray-900 sm:h-[480px]" aria-label="Interactive 360 degree virtual tour" />
}
