import React from 'react'
import { useTranslation } from 'react-i18next'
import { LegalLayout } from '../../components/legal/LegalLayout'

const RefundPolicy = () => {
  const { t } = useTranslation()
  const content = t('legal.refund', { returnObjects: true }) || {}
  const sections = Array.isArray(content.sections) ? content.sections : []

  // Bug Fix 1: Dynamically find non-refundable section instead of hardcoded index access
  const nonRefundableSection = sections.find(
    (sec) => sec.id === 'ref-2' || sec.h?.toLowerCase().includes('non-refundable')
  ) || sections[1]

  return (
    <LegalLayout title={content.title || 'Refund Policy'} lastUpdated={content.lastUpdated || ''}>
      <div className="space-y-10">
        {/* Bug Fix 2: Safe array traversal with deterministic key reconciliation */}
        {sections.map((section, idx) => {
          const sectionKey = section.id || section.h || `ref-sec-${idx}`
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
        
        {nonRefundableSection?.p && (
          <div className="p-6 bg-red-50 rounded-2xl border border-red-100 mt-12">
            <p className="text-red-800 font-semibold leading-relaxed">
              {nonRefundableSection.p}
            </p>
          </div>
        )}
      </div>
    </LegalLayout>
  )
}

export default RefundPolicy