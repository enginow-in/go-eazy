import React from 'react'
import { useTranslation } from 'react-i18next'
import { LegalLayout } from '../../components/legal/LegalLayout'

const TermsOfService = () => {
  const { t } = useTranslation()
  const content = t('legal.terms', { returnObjects: true }) || {}
  const sections = Array.isArray(content.sections) ? content.sections : []

  return (
    <LegalLayout title={content.title || 'Terms of Service'} lastUpdated={content.lastUpdated || ''}>
      <div className="space-y-10">
        {/* Bug Fix: Defensive array traversal with deterministic key reconciliation */}
        {sections.map((section, idx) => {
          const sectionKey = section.id || section.h || `term-sec-${idx}`
          return (
            <section key={sectionKey}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 font-display">
                {section.h}
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {section.p}
              </p>
            </section>
          )
        })}
      </div>
    </LegalLayout>
  )
}

export default TermsOfService