import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const About = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="pt-12 md:pt-16 pb-20 min-h-screen bg-gray-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-12 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-[#CA3433]/40 rounded px-1 py-0.5"
          aria-label={t('aboutPage.back', 'Back')}
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t('aboutPage.back', 'Back')}
        </button>

        {/* Aesthetic Note Section */}
        <div className="max-w-3xl mx-auto mt-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-10 tracking-tight font-display text-center">
            {t('aboutPage.title', 'The Story of GoEazy')}
          </h1>
          
          {/* Bug Fix 1: Relaxed overcrowded italic rules to ensure clean line-height and layout reading */}
          <div className="space-y-8 text-lg sm:text-xl text-gray-600 font-normal leading-relaxed tracking-normal relative">
            
            {/* Top Quote Mark Icon */}
            <div className="absolute -top-6 -left-8 text-[#ffc9c9] text-6xl hidden sm:block opacity-50 font-serif select-none pointer-events-none">"</div>

            <p>
              {t('aboutPage.section1Text', "It all started during our early college days. We vividly remember the struggle—wandering from street to street, knocking on random doors just hoping to find a decent, affordable room in a good location. Instead of focusing on our new college life, we were wasting weeks going door-to-door and dealing with unresponsive brokers.")}
            </p>
            <p>
              {t('aboutPage.section2Text', "We realized there had to be a better way, and that's how GoEazy was born. We built the exact platform we desperately needed back then. Today, we personally verify every listing and connect you directly with genuine owners, so no other student or professional has to go through that exhausting door-to-door hunt ever again.")}
            </p>
          </div>

          <div className="mt-20 text-center">
            <p className="font-display text-2xl md:text-3xl font-extrabold italic text-gray-900 tracking-tight leading-relaxed">
              {t('aboutPage.thankYouNote', '"Thank you for trusting GoEazy. We are constantly working to bring you better homes, better experiences, and complete peace of mind."')}
            </p>
            <div className="w-16 h-1 bg-[#CA3433] rounded-full mx-auto mt-8 mb-6"></div>
          </div>
        </div>
        
      </div>
    </div>
  )
}