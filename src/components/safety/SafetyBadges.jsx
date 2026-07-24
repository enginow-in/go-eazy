import React from 'react'
import { ShieldCheck, Smartphone, CheckCircle, Award, AlertCircle } from 'lucide-react'

/**
 * Reusable Trust & Safety Badges for User Profiles and Property Details
 */

export const PhoneVerifiedBadge = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 ${className}`}>
    <Smartphone size={13} className="text-blue-600" />
    Phone Verified
  </span>
)

export const IdVerifiedBadge = ({ idType = 'Government ID', className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 ${className}`}>
    <ShieldCheck size={13} className="text-emerald-600" />
    {idType === 'aadhaar' ? 'Aadhaar Verified' : idType === 'pan' ? 'PAN Verified' : 'KYC Verified'}
  </span>
)

export const PhotoVerifiedBadge = ({ status = 'verified', className = '' }) => {
  if (status === 'flagged_duplicate') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100 ${className}`}>
        <AlertCircle size={13} className="text-red-600" />
        Duplicate Photo Flagged
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100 ${className}`}>
      <Award size={13} className="text-purple-600" />
      AI Authenticated Photo
    </span>
  )
}

export const LandlordTrustBadgeGroup = ({ profile, photoStatus = 'verified' }) => {
  if (!profile) return null

  const isPhoneVerified = profile.phone_verified
  const isIdVerified = profile.id_verification_status === 'verified'

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {isIdVerified && <IdVerifiedBadge idType={profile.id_type} />}
      {isPhoneVerified && <PhoneVerifiedBadge />}
      <PhotoVerifiedBadge status={photoStatus} />
    </div>
  )
}
