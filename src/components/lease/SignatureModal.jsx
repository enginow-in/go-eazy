import React, { useRef, useState, useEffect } from 'react'
import { X, Eraser, CheckCircle2, Type, Edit3, ShieldCheck } from 'lucide-react'
import { useLease } from '../../hooks/useLease'

export const SignatureModal = () => {
  const { signatureModalOpen, signatureTargetLeaseId, closeSign, signLease } = useLease()
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [mode, setMode] = useState('draw') // 'draw' | 'type'
  const [typedName, setTypedName] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (signatureModalOpen && mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#1E293B'
    }
  }, [signatureModalOpen, mode])

  if (!signatureModalOpen) return null

  // Drawing Handlers
  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawn(false)
    }
  }

  const handleConfirmSignature = async () => {
    let signatureData = null
    if (mode === 'draw') {
      if (!hasDrawn) return
      const canvas = canvasRef.current
      signatureData = canvas.toDataURL('image/png')
    } else {
      if (!typedName.trim()) return
      // Create SVG data URI from typed name in script font
      signatureData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="70"><text x="15" y="45" font-family="cursive" font-size="28" font-weight="bold" fill="%23CA3433">${encodeURIComponent(typedName.trim())}</text></svg>`
    }

    setSubmitting(true)
    try {
      await signLease(signatureTargetLeaseId, signatureData)
      closeSign()
    } catch (err) {
      console.error('Signature error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const isValid = consentChecked && ((mode === 'draw' && hasDrawn) || (mode === 'type' && typedName.trim().length > 2))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-900 via-gray-800 to-[#CA3433] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Edit3 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display leading-tight">Digital E-Signature Pad</h3>
              <p className="text-xs text-gray-200">GoEazy SmartLease™ Certified Execution</p>
            </div>
          </div>

          <button
            onClick={closeSign}
            className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setMode('draw')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'draw' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Edit3 size={14} /> Draw Signature
            </button>
            <button
              onClick={() => setMode('type')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'type' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Type size={14} /> Type Signature
            </button>
          </div>

          {/* Draw Pad Canvas */}
          {mode === 'draw' ? (
            <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-2 bg-gray-50/50 hover:border-[#CA3433]/40 transition-colors">
              <canvas
                ref={canvasRef}
                width={450}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 bg-white rounded-xl touch-none cursor-crosshair shadow-inner"
              />
              
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400 text-xs font-medium">
                  Draw your signature here using finger or mouse
                </div>
              )}

              {hasDrawn && (
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute bottom-4 right-4 px-3 py-1.5 bg-gray-900/80 hover:bg-gray-900 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Eraser size={13} /> Clear
                </button>
              )}
            </div>
          ) : (
            /* Type Signature Fallback */
            <div className="space-y-3">
              <label htmlFor="typedName" className="block text-xs font-bold text-gray-700">Full Legal Name</label>
              <input
                type="text"
                id="typedName"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Enter your full legal name..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
              />

              {typedName.trim().length > 0 && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                  <span className="text-2xl font-serif italic font-bold text-[#CA3433] tracking-wide">
                    {typedName}
                  </span>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-2">Formal Script Preview</p>
                </div>
              )}
            </div>
          )}

          {/* Legal Consent Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#fff5f5]/60 border border-[#CA3433]/20 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="w-4 h-4 rounded text-[#CA3433] focus:ring-[#CA3433] accent-[#CA3433] shrink-0 mt-0.5"
            />
            <span className="text-xs text-gray-700 leading-relaxed font-medium">
              I understand and agree that this digital signature is legally binding under the Information Technology Act & E-Sign regulations for this agreement.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <ShieldCheck size={14} /> 256-Bit Encrypted E-Sign
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={closeSign}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>

            <button
              disabled={!isValid || submitting}
              onClick={handleConfirmSignature}
              className="px-6 py-2.5 bg-[#CA3433] hover:bg-[#ac2d2c] disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow-md shadow-[#CA3433]/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Confirm & Attach Signature
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
