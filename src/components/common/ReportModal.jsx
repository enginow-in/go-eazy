import React, { useState } from 'react'
import { Flag, AlertTriangle, Ban, ShieldAlert, HelpCircle, Loader2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', icon: Ban, color: 'text-orange-500 bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { value: 'fake_listing', label: 'Fake Listing', icon: AlertTriangle, color: 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100' },
  { value: 'inappropriate', label: 'Inappropriate Content', icon: ShieldAlert, color: 'text-purple-500 bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100' },
]

/**
 * ReportModal – lets users report a property or service listing.
 *
 * @param {boolean}  open        - Whether the modal is visible
 * @param {function} onClose     - Callback to close the modal
 * @param {string}   [propertyId] - Property UUID (mutually exclusive with serviceId)
 * @param {string}   [serviceId]  - Service UUID (mutually exclusive with propertyId)
 */
export const ReportModal = ({ open, onClose, propertyId = null, serviceId = null }) => {
  const [selectedReason, setSelectedReason] = useState(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const resetAndClose = () => {
    setSelectedReason(null)
    setDetails('')
    setSubmitted(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to report a listing')
        setSubmitting(false)
        return
      }

      const payload = {
        reporter_id: user.id,
        reason: selectedReason,
        details: details.trim() || null,
      }

      if (propertyId) payload.property_id = propertyId
      if (serviceId) payload.service_id = serviceId

      const { error } = await supabase.from('reports').insert(payload)

      if (error) throw error

      setSubmitted(true)
      toast.success('Report submitted — thank you for keeping the community safe!')
    } catch (err) {
      console.error('Report submission error:', err)
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose} title={submitted ? null : '🚩 Report Listing'} size="sm">
      {submitted ? (
        /* ── Success state ── */
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Report Submitted</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-[260px] mx-auto">
            Our team will review this listing and take appropriate action. Thank you for helping keep the community safe.
          </p>
          <Button variant="primary" onClick={resetAndClose} className="rounded-xl px-8">
            Done
          </Button>
        </div>
      ) : (
        /* ── Report form ── */
        <div className="space-y-5">
          <p className="text-sm text-gray-500 -mt-1">
            Help us maintain a safe community. Select a reason for flagging this listing.
          </p>

          {/* Reason chips */}
          <div className="grid grid-cols-2 gap-2.5">
            {REPORT_REASONS.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedReason(value)}
                className={`
                  flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left text-sm font-semibold
                  transition-all duration-200 cursor-pointer
                  ${selectedReason === value
                    ? `${color} ring-2 ring-offset-1 ring-current shadow-sm scale-[1.02]`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Optional details */}
          <div>
            <label htmlFor="report-details" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Additional Details <span className="font-normal text-gray-300">(optional)</span>
            </label>
            <textarea
              id="report-details"
              rows={3}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Tell us more about what's wrong with this listing..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 resize-none transition-all"
              maxLength={500}
            />
            {details.length > 0 && (
              <p className="text-right text-[10px] text-gray-400 mt-1">{details.length}/500</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button
              variant="secondary"
              className="flex-1 rounded-xl font-bold"
              onClick={resetAndClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1 rounded-xl font-bold"
              onClick={handleSubmit}
              disabled={submitting || !selectedReason}
              leftIcon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={14} />}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
