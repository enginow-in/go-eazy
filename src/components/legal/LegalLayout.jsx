import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const LegalLayout = ({ children, title, lastUpdated }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="pt-12 md:pt-16 pb-20 min-h-screen bg-gray-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-12 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-[#CA3433]/40 rounded px-1 py-0.5"
          aria-label={t('property.labels.back') || 'Go Back'}
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t('property.labels.back')}
        </button>

        <div className="mb-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight font-display">
            {title}
          </h1>
          <p className="text-gray-500 font-medium text-lg">{lastUpdated}</p>
        </div>

        {/* Bug Fix 1: Removed overcrowded italic forcing rules to guarantee clean structural reading layouts */}
        <div className="relative max-w-3xl mx-auto [&_h2]:!text-2xl [&_h2]:sm:!text-3xl [&_h2]:!font-extrabold [&_h2]:!text-gray-900 [&_h2]:!mb-6 [&_h2]:!mt-12 [&_h2]:!font-display [&_p]:!text-[16px] [&_p]:sm:!text-[17px] [&_p]:!font-normal [&_p]:!leading-[1.7] [&_p]:!text-gray-600 [&_p]:!mb-6">
          {children}
        </div>
        
        {/* Bug Fix 2: Isolated static layout text blocks and aligned theme metrics */}
        <div className="mt-20 text-center max-w-2xl mx-auto px-4 pt-10">
          <p className="font-display text-2xl md:text-3xl font-extrabold italic text-gray-800 tracking-tight leading-relaxed">
            {t('aboutPage.thankYouNote') || '"Thank you for trusting GoEazy."'}
          </p>
          <div className="w-12 h-1.5 bg-[#CA3433] rounded-full mx-auto mt-8 mb-6"></div>
        </div>
      </div>
    </div>
  )
}