import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, Calendar, IndianRupee, Edit3, ExternalLink, Printer, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useLease } from '../../hooks/useLease'
import { formatPrice } from '../../utils/helpers'

export const LeaseCard = ({ lease }) => {
  const { openSign } = useLease()

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 size={13} className="text-emerald-600" /> Active & Executed
          </span>
        )
      case 'pending_signatures':
        return (
          <span className="px-3 py-1 bg-[#fff5f5] text-[#CA3433] border border-[#CA3433]/30 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs animate-pulse">
            <Clock size={13} className="text-[#CA3433]" /> Signature Required
          </span>
        )
      case 'draft':
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold flex items-center gap-1.5">
            <FileText size={13} /> Draft Stage
          </span>
        )
    }
  }

  const isSignedByBoth = Boolean(lease.landlordSignature && lease.tenantSignature)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4 group">
      
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {getStatusBadge(lease.status)}
          <span className="text-[11px] font-mono text-gray-400 font-bold uppercase">
            ID: {lease.id}
          </span>
        </div>

        <div className="flex gap-4 items-start">
          <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
            <img src={lease.propertyImage || '/1.webp'} alt={lease.propertyTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 font-display truncate group-hover:text-[#CA3433] transition-colors">
              {lease.propertyTitle}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{lease.propertyCity}</p>
            
            <div className="flex items-center gap-4 mt-2 text-xs font-bold text-gray-800">
              <span className="flex items-center gap-0.5">
                <IndianRupee size={12} className="text-[#CA3433]" />
                {formatPrice(lease.monthlyRent)} <span className="text-[10px] font-medium text-gray-400">/mo</span>
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600 font-medium">
                Deposit: ₹{formatPrice(lease.securityDeposit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dates & Signature Track */}
      <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
        <div className="flex items-center justify-between text-gray-600">
          <span className="flex items-center gap-1.5 text-gray-500 font-medium">
            <Calendar size={13} /> Duration
          </span>
          <span className="font-bold text-gray-800">
            {lease.leaseStartDate} ➔ {lease.leaseEndDate}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-gray-500 font-medium">Landlord: <strong className="text-gray-800">{lease.landlordName}</strong></span>
          <span className={lease.landlordSignature ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
            {lease.landlordSignature ? '✓ Signed' : '⏳ Pending'}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-500 font-medium">Tenant: <strong className="text-gray-800">{lease.tenantName}</strong></span>
          <span className={lease.tenantSignature ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
            {lease.tenantSignature ? '✓ Signed' : '⏳ Pending'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <Link
          to={`/agreements/${lease.id}`}
          className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <FileText size={14} /> View Agreement
        </Link>

        {!isSignedByBoth ? (
          <button
            onClick={() => openSign(lease.id)}
            className="px-4 py-2 rounded-xl bg-[#CA3433] hover:bg-[#ac2d2c] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#CA3433]/20 transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 size={14} /> E-Sign Now
          </button>
        ) : (
          <Link
            to={`/agreements/${lease.id}`}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Printer size={14} /> Print PDF
          </Link>
        )}
      </div>

    </div>
  )
}
