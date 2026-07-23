import React, { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Printer, Edit3, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react'
import { useLease } from '../hooks/useLease'
import { useAuth } from '../hooks/useAuth'
import { LeaseDocumentView } from '../components/lease/LeaseDocumentView'
import { SignatureModal } from '../components/lease/SignatureModal'
import { LeaseBuilderModal } from '../components/lease/LeaseBuilderModal'

export const LeaseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { agreements, fetchLeaseById, openSign } = useLease()

  const lease = fetchLeaseById(id) || agreements[0]

  const isLandlord = user?.id ? lease?.landlordId === user.id : (profile?.role === 'landlord')
  const userHasSigned = isLandlord ? Boolean(lease?.landlordSignature) : Boolean(lease?.tenantSignature)
  const isExecuted = Boolean(lease?.landlordSignature && lease?.tenantSignature)

  return (
    <div className="min-h-screen bg-gray-50/50 pt-6 pb-20 print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Actions Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors w-fit"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            {!userHasSigned && (
              <button
                onClick={() => openSign(lease?.id)}
                className="px-5 py-2.5 bg-[#CA3433] hover:bg-[#ac2d2c] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-[#CA3433]/20 transition-all active:scale-95 cursor-pointer"
              >
                <Edit3 size={16} /> E-Sign Contract Now
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Printer size={16} /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Status Callout Banner if unsigned */}
        {!isExecuted && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 mb-6 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                !
              </div>
              <div>
                <p className="text-xs font-bold">Counterparty Action Required</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {!userHasSigned 
                    ? 'Your signature is required to execute this lease contract.' 
                    : 'Your signature has been attached. Waiting for counterparty signature.'}
                </p>
              </div>
            </div>

            {!userHasSigned && (
              <button
                onClick={() => openSign(lease?.id)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Sign Now
              </button>
            )}
          </div>
        )}

        {/* Render Legal Document View */}
        <LeaseDocumentView lease={lease} />

        {/* Signature Pad Modal */}
        <SignatureModal />

        {/* Builder Modal */}
        <LeaseBuilderModal />

      </div>
    </div>
  )
}
