import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SEOHead from '../components/common/SEOHead'

export const About = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <>
      <SEOHead 
        title="About Us"
        description="Learn about GoEazy's mission to bring transparency, trust, and ease to the rental market in Uttarakhand. Say goodbye to fake listings and broker hassles."
        path="/about"
      />
      <div className="pt-12 md:pt-16 pb-20 min-h-screen bg-gray-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-12 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t('aboutPage.back', 'Back')}
        </button>

        {/* Aesthetic Note Section */}
        <div className="max-w-3xl mx-auto mt-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-10 tracking-tight font-display text-center">
            {t('aboutPage.title', 'The Story of GoEazy')}
          </h1>
          
          <div className="space-y-10 text-[22px] sm:text-2xl text-gray-600 italic font-medium leading-[1.8] sm:leading-[1.9] tracking-wide relative">
            
            {/* Top Quote Mark Icon for aesthetics */}
            <div className="absolute -top-6 -left-8 text-[#ffc9c9] text-6xl hidden sm:block opacity-50 font-serif">"</div>

            <p>
              {t('aboutPage.section1Text', "We've all been there: scrolling through endless fake listings, calling brokers who never answer, and visiting 'premium flats' that look nothing like the photos. Finding a home away from home shouldn't be a nightmare. That's exactly why GoEazy was built—to finally bring transparency, trust, and ease to the rental market.")}
            </p>
            <p>
              {t('aboutPage.section2Text', "We personally vet properties so you don't have to. Real photos, direct contact with owners, and zero hidden surprises. Whether you're a student moving to a new city or a professional seeking a peaceful corner, GoEazy is designed to make your transition as smooth as possible.")}
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
    </>
  )
}
