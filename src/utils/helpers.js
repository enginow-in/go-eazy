import React from 'react'
import { Wifi, Snowflake, Utensils, Box, WashingMachine, Dumbbell, ShieldCheck, Video, Zap, Droplets } from 'lucide-react'

export const formatPrice = (price) => {
  if (!price && price !== 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export const formatPriceShort = (price) => {
  if (!price) return '—'
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`
  return `₹${price}`
}

export const truncate = (str, n = 80) =>
  str && str.length > n ? str.slice(0, n) + '…' : str

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

export const cn = (...classes) =>
  classes.filter(Boolean).join(' ')

export const sleep = (ms) => new Promise(r => setTimeout(r, ms))

export const AMENITY_ICONS = {
  wifi: Wifi,
  ac: Snowflake,
  food: Utensils,
  parking: Box,
  laundry: WashingMachine,
  gym: Dumbbell,
  security: ShieldCheck,
  cctv: Video,
  power: Zap,
  water: Droplets,
}

export const getFurnishingLabel = (type) => {
  const map = { full: 'Fully Furnished', semi: 'Semi Furnished', none: 'Unfurnished' }
  return map[type] || '—'
}

export const getTimeAgo = (dateStr) => {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export const filterProperties = (properties, filters) => {
  return properties.filter(p => {
    if (filters.type && p.type !== filters.type) return false
    if (filters.city && !p.city?.toLowerCase().includes(filters.city.toLowerCase())) return false
    if (filters.area && !p.area?.toLowerCase().includes(filters.area.toLowerCase())) return false
    if (filters.priceMin > 0 && p.price < filters.priceMin) return false
    if (filters.priceMax < 100000 && p.price > filters.priceMax) return false
    if (filters.amenities?.length > 0 && !filters.amenities.every(a => p.amenities?.includes(a))) return false
    if (filters.query && !p.title?.toLowerCase().includes(filters.query.toLowerCase()) && !p.city?.toLowerCase().includes(filters.query.toLowerCase()) && !p.area?.toLowerCase().includes(filters.query.toLowerCase())) return false
    if (filters.bedrooms) {
      const count = parseInt(filters.bedrooms)
      if (filters.bedrooms === '4+') {
        if ((p.bedrooms || 1) < 4) return false
      } else if (p.bedrooms !== count) return false
    }
    if (filters.furnishing_type && p.furnishing_type !== filters.furnishing_type) return false
    if (filters.pet_friendly && !p.pet_friendly) return false
    return true
  })
}
