import React from 'react'
import { CheckCircle2, ShieldCheck, Printer, FileText, Calendar, IndianRupee } from 'lucide-react'

export const LeaseDocumentView = ({ lease, onSignClick }) => {
  if (!lease) return null

  const isExecuted = Boolean(lease.landlordSignature && lease.tenantSignature)

  return (
    <div className="lease-document-print-target bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden max-w-4xl mx-auto my-6 print:shadow-none print:border-none print:m-0 print:max-w-none print:w-full">
      
      {/* Official Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-[#CA3433] text-white p-6 sm:p-8 flex items-center justify-between border-b-4 border-[#CA3433] print:bg-white print:text-black print:p-0 print:border-b-2 print:border-black">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#CA3433] text-white text-[10px] font-bold uppercase tracking-widest print:hidden">
              GoEazy SmartLease™ Certified
            </span>
            <span className="text-xs text-gray-300 font-mono print:text-black">
              Ref: {lease.id}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight print:text-2xl">
            RESIDENTIAL LEASE AGREEMENT
          </h1>
          <p className="text-xs sm:text-sm text-gray-200 mt-1 print:text-gray-700">
            Legally Binding Tenancy Contract under E-Sign Regulations
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end print:hidden">
          <div className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 ${isExecuted ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
            <ShieldCheck size={16} />
            {isExecuted ? 'Fully Executed Contract' : 'Pending Counterparty Signature'}
          </div>
        </div>
      </div>

      {/* Main Legal Document Content */}
      <div className="p-6 sm:p-10 space-y-8 text-gray-800 font-serif leading-relaxed text-sm print:p-6 print:space-y-6">
        
        {/* Preamble */}
        <section className="space-y-3 pb-6 border-b border-gray-100">
          <h2 className="text-base font-bold font-sans text-gray-900 uppercase tracking-wide border-l-4 border-[#CA3433] pl-3">
            1. Parties to the Agreement
          </h2>
          <p className="text-gray-700">
            This Residential Lease Agreement ("Agreement") is made and entered into on this day 
            <strong className="text-gray-900 font-sans"> {new Date(lease.createdAt).toLocaleDateString()}</strong>, by and between:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 font-sans">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LANDLORD / LESSOR</span>
              <p className="text-sm font-bold text-gray-900 mt-1">{lease.landlordName}</p>
              <p className="text-xs text-gray-600 mt-0.5">Email: {lease.landlordEmail || 'Provided on verification'}</p>
              <p className="text-xs text-gray-600">Phone: {lease.landlordPhone || 'Provided on verification'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TENANT / LESSEE</span>
              <p className="text-sm font-bold text-gray-900 mt-1">{lease.tenantName}</p>
              <p className="text-xs text-gray-600 mt-0.5">Email: {lease.tenantEmail || 'Provided on verification'}</p>
              <p className="text-xs text-gray-600">Phone: {lease.tenantPhone || 'Provided on verification'}</p>
            </div>
          </div>
        </section>

        {/* Property & Term Details */}
        <section className="space-y-3 pb-6 border-b border-gray-100">
          <h2 className="text-base font-bold font-sans text-gray-900 uppercase tracking-wide border-l-4 border-[#CA3433] pl-3">
            2. Demised Property & Tenancy Term
          </h2>
          <p className="text-gray-700">
            The Landlord hereby demises and leases unto the Tenant, and the Tenant hereby hires from the Landlord, 
            the premises described as <strong>"{lease.propertyTitle}"</strong>, located in <strong>{lease.propertyCity}</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs pt-2">
            <div className="flex justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 font-medium">Lease Commencement Date:</span>
              <strong className="text-gray-900">{lease.leaseStartDate}</strong>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500 font-medium">Lease Expiry Date:</span>
              <strong className="text-gray-900">{lease.leaseEndDate}</strong>
            </div>
          </div>
        </section>

        {/* Financial Covenants */}
        <section className="space-y-3 pb-6 border-b border-gray-100">
          <h2 className="text-base font-bold font-sans text-gray-900 uppercase tracking-wide border-l-4 border-[#CA3433] pl-3">
            3. Rent, Security Deposit & Utility Covenants
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>
              <strong>Monthly Rent:</strong> The Tenant agrees to pay a monthly rent of 
              <strong className="font-sans text-gray-900"> ₹{lease.monthlyRent?.toLocaleString()}</strong> per month, 
              payable on or before the 5th day of every calendar month.
            </li>
            <li>
              <strong>Security Deposit:</strong> The Tenant has deposited a refundable security deposit of 
              <strong className="font-sans text-gray-900"> ₹{lease.securityDeposit?.toLocaleString()}</strong> with the Landlord.
            </li>
            <li>
              <strong>Notice Period:</strong> Either party may terminate this agreement by providing a minimum written notice of 
              <strong className="font-sans text-gray-900"> {lease.noticePeriodDays} Days</strong>.
            </li>
          </ul>
        </section>

        {/* Special Terms & Rules */}
        {lease.specialTerms && lease.specialTerms.length > 0 && (
          <section className="space-y-3 pb-6 border-b border-gray-100">
            <h2 className="text-base font-bold font-sans text-gray-900 uppercase tracking-wide border-l-4 border-[#CA3433] pl-3">
              4. Special Terms & Conduct Rules
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
              {lease.specialTerms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ol>
          </section>
        )}

        {/* Digital Signatures Block */}
        <section className="space-y-4 pt-4">
          <h2 className="text-base font-bold font-sans text-gray-900 uppercase tracking-wide border-l-4 border-[#CA3433] pl-3">
            5. Digital Execution & Signatures
          </h2>
          <p className="text-xs text-gray-500 font-sans">
            IN WITNESS WHEREOF, the parties hereto have set their digital hand signatures below on the dates indicated.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 font-sans">
            
            {/* Landlord Signature Box */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">LANDLORD SIGNATURE</span>
                <p className="text-sm font-bold text-gray-900 mt-1">{lease.landlordName}</p>
              </div>

              {lease.landlordSignature ? (
                <div className="my-3 border-b border-gray-200 pb-2">
                  <img src={lease.landlordSignature} alt="Landlord Signature" className="h-12 object-contain" />
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    ✓ Signed on {new Date(lease.landlordSignedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="my-4 py-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold text-center border border-amber-200">
                  ⏳ Awaiting Landlord Signature
                </div>
              )}
            </div>

            {/* Tenant Signature Box */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TENANT SIGNATURE</span>
                <p className="text-sm font-bold text-gray-900 mt-1">{lease.tenantName}</p>
              </div>

              {lease.tenantSignature ? (
                <div className="my-3 border-b border-gray-200 pb-2">
                  <img src={lease.tenantSignature} alt="Tenant Signature" className="h-12 object-contain" />
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    ✓ Signed on {new Date(lease.tenantSignedAt).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="my-4 py-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold text-center border border-amber-200">
                  ⏳ Awaiting Tenant Signature
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Verification Seal */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-sans text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#CA3433]" />
            <span>Authenticated via GoEazy SmartLease™ Cryptographic Registry</span>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold flex items-center gap-2 print:hidden transition-all active:scale-95 cursor-pointer"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>

      </div>
    </div>
  )
}
