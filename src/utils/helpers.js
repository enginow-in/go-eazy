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

export const truncate = (str, n = 80) => {
  if (!str || typeof str !== 'string') return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}

export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return ''
  return name.trim().split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

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
