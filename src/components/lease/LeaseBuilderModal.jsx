import React, { useState, useEffect } from 'react'
import { X, FileText, Calendar, IndianRupee, Plus, Trash2, CheckCircle2, Shield } from 'lucide-react'
import { useLease } from '../../hooks/useLease'
import { useProperties } from '../../hooks/useProperties'
import { useAuth } from '../../hooks/useAuth'

export const LeaseBuilderModal = () => {
  const { builderModalOpen, builderPrefillData, closeBuilder, createLease } = useLease()
  const { listings } = useProperties()
  const { user, profile } = useAuth()
  
  const [propertyId, setPropertyId] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [landlordName, setLandlordName] = useState('')
  const [monthlyRent, setMonthlyRent] = useState(15000)
  const [securityDeposit, setSecurityDeposit] = useState(30000)
  const [leaseStartDate, setLeaseStartDate] = useState('')
  const [leaseEndDate, setLeaseEndDate] = useState('')
  const [noticePeriodDays, setNoticePeriodDays] = useState(30)
  const [specialTerms, setSpecialTerms] = useState([
    'Rent is payable on or before the 5th day of each calendar month.',
    'No structural modifications or painting without written landlord consent.'
  ])
  const [newTermInput, setNewTermInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (builderModalOpen) {
      if (builderPrefillData) {
        setPropertyId(builderPrefillData.propertyId || listings[0]?.id || '1')
        setTenantName(builderPrefillData.tenantName || '')
        setTenantEmail(builderPrefillData.tenantEmail || '')
        setLandlordName(builderPrefillData.landlordName || profile?.full_name || '')
        if (builderPrefillData.monthlyRent) setMonthlyRent(builderPrefillData.monthlyRent)
      } else if (listings.length > 0) {
        setPropertyId(listings[0].id)
        setMonthlyRent(listings[0].price || 15000)
        setSecurityDeposit((listings[0].price || 15000) * 2)
      }

      // Default start date = 1st of next month, end date = 1 year later
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      nextMonth.setDate(1)
      const startDateStr = nextMonth.toISOString().split('T')[0]
      setLeaseStartDate(startDateStr)

      const endDate = new Date(nextMonth)
      endDate.setFullYear(endDate.getFullYear() + 1)
      endDate.setDate(endDate.getDate() - 1)
      setLeaseEndDate(endDate.toISOString().split('T')[0])
    }
  }, [builderModalOpen, builderPrefillData, listings, profile])

  if (!builderModalOpen) return null

  const selectedProperty = listings.find(p => p.id === propertyId) || listings[0] || {
    id: '1',
    title: '2BHK Luxury Flat, Rajpur Road',
    city: 'Dehradun',
    images: ['/1.webp']
  }

  const handleAddTerm = () => {
    if (!newTermInput.trim()) return
    setSpecialTerms(prev => [...prev, newTermInput.trim()])
    setNewTermInput('')
  }

  const handleRemoveTerm = (index) => {
    setSpecialTerms(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createLease({
        propertyId: selectedProperty.id,
        propertyTitle: selectedProperty.title,
        propertyCity: selectedProperty.city,
        propertyImage: selectedProperty.images?.[0] || '/1.webp',
        landlordName: landlordName || profile?.full_name || 'Landlord',
        tenantName: tenantName || 'Tenant',
        tenantEmail: tenantEmail || 'tenant@example.com',
        tenantPhone,
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit),
        leaseStartDate,
        leaseEndDate,
        noticePeriodDays: Number(noticePeriodDays),
        specialTerms
      })
    } catch (err) {
      console.error('Lease creation error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 via-gray-800 to-[#CA3433] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display leading-tight">Draft Smart Digital Lease</h3>
              <p className="text-xs text-gray-200">GoEazy SmartLease™ Generator</p>
            </div>
          </div>

          <button
            onClick={closeBuilder}
            className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* Property Selection */}
          <div>
            <label htmlFor="lease-property" className="block text-xs font-bold text-gray-700 mb-1.5">Select Rental Property</label>
            <select
              id="lease-property"
              value={propertyId}
              onChange={(e) => {
                const id = e.target.value
                setPropertyId(id)
                const prop = listings.find(p => p.id === id)
                if (prop?.price) {
                  setMonthlyRent(prop.price)
                  setSecurityDeposit(prop.price * 2)
                }
              }}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433]"
            >
              {listings.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} - ₹{p.price?.toLocaleString()}/mo ({p.city})
                </option>
              ))}
            </select>
          </div>

          {/* Tenant Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tenantName" className="block text-xs font-bold text-gray-700 mb-1.5">Tenant Full Name</label>
              <input
                type="text"
                id="tenantName"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
                placeholder="E.g. Ankit Mehta"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
              />
            </div>
            <div>
              <label htmlFor="tenantEmail" className="block text-xs font-bold text-gray-700 mb-1.5">Tenant Email Address</label>
              <input
                type="email"
                id="tenantEmail"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                required
                placeholder="tenant@example.com"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
              />
            </div>
          </div>

          {/* Financial Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="monthlyRent" className="block text-xs font-bold text-gray-700 mb-1.5">Monthly Rent (₹)</label>
              <input
                type="number"
                id="monthlyRent"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                required
                min="1000"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
              />
            </div>

            <div>
              <label htmlFor="securityDeposit" className="block text-xs font-bold text-gray-700 mb-1.5">Security Deposit (₹)</label>
              <input
                type="number"
                id="securityDeposit"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                required
                min="0"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
              />
            </div>

            <div>
              <label htmlFor="noticePeriod" className="block text-xs font-bold text-gray-700 mb-1.5">Notice Period (Days)</label>
              <select
                id="noticePeriod"
                value={noticePeriodDays}
                onChange={(e) => setNoticePeriodDays(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
              >
                <option value={15}>15 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
              </select>
            </div>
          </div>

          {/* Lease Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="leaseStartDate" className="block text-xs font-bold text-gray-700 mb-1.5">Lease Start Date</label>
              <input
                type="date"
                id="leaseStartDate"
                value={leaseStartDate}
                onChange={(e) => setLeaseStartDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
              />
            </div>

            <div>
              <label htmlFor="leaseEndDate" className="block text-xs font-bold text-gray-700 mb-1.5">Lease End Date</label>
              <input
                type="date"
                id="leaseEndDate"
                value={leaseEndDate}
                onChange={(e) => setLeaseEndDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
              />
            </div>
          </div>

          {/* Special Rules & Clauses */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Special Terms & Rules</label>
            <div className="space-y-2 mb-3">
              {specialTerms.map((term, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium">
                  <span className="pr-3">• {term}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(index)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTermInput}
                onChange={(e) => setNewTermInput(e.target.value)}
                placeholder="Add custom clause (e.g. Quiet hours after 10 PM)..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTerm() } }}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
              <Shield size={13} className="text-emerald-500" /> Auto-Formatted E-Sign Contract
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeBuilder}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#CA3433] hover:bg-[#ac2d2c] text-white text-xs font-bold rounded-xl shadow-md shadow-[#CA3433]/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Generate & Dispatch Lease
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  )
}
