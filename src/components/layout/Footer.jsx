import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Footer = () => {
  const { t } = useTranslation()

  return (
    <footer className="bg-gray-950 text-gray-300 mt-12">
      <div className="w-full mx-auto px-4 sm:px-10 md:px-16 lg:px-20 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Brand */}
          <div>
            <Link
              to="/"
              aria-label="GoEazy home"
              className="flex items-center gap-3 mb-6 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#CA3433] shadow-md flex items-center justify-center font-bold font-display rotate-3 group-hover:rotate-0 transition-all duration-300 overflow-hidden">
                <div className="-rotate-3 flex items-center justify-center translate-y-0.5">
                  <span className="text-[#CA3433] text-[22px] font-black leading-none">G</span>
                  <span className="text-[#CA3433] text-[15px] font-black leading-none -ml-0.5 mb-2">E</span>
                </div>
              </div>
              <span className="font-display font-black text-2xl text-white tracking-tight leading-none pt-1">
                Go<span className="text-[#CA3433]">Eazy</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              {/* Add social links here if needed */}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{t('footer.contact')}</h4>
            <div className="space-y-3">
              <a href="mailto:supportgoeazy@gmail.com" className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors">
                <Mail size={15} className="text-[#CA3433]" /> supportgoeazy@gmail.com
              </a>
              <a href="tel:8979452055" className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors">
                <Phone size={15} className="text-[#CA3433]" /> +91 89794 52055
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">{t('footer.allRights')}</p>
          <div className="flex flex-wrap gap-6 justify-center sm:justify-end">
            {[
              { label: t('footer.links.privacy'), to: '/privacy' },
              { label: t('footer.links.terms'), to: '/terms' },
              { label: t('footer.links.cookie'), to: '/cookies' },
              { label: t('footer.links.refund'), to: '/refund' }
            ].map(item => (
              <Link key={item.label} to={item.to} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">{item.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
