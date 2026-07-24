import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'
import { ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, Upload } from 'lucide-react'
import { useFraudSafety } from '../../hooks/useFraudSafety'
import { useAuth } from '../../hooks/useAuth'
import { validateAadhaar, validatePAN } from '../../utils/fraudDetection'
import toast from 'react-hot-toast'

export const IdVerificationModal = () => {
  const { idModalOpen, closeIdModal, submitIDVerification, loading } = useFraudSafety()

  const [idType, setIdType] = useState('aadhaar')
  const [idNumber, setIdNumber] = useState('')
  const [_docFile, setDocFile] = useState(null)
  const [previewName, setPreviewName] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleIdNumberChange = (val) => {
    setIdNumber(val)
    setValidationError('')
    
    // Real-time checksum feedback
    if (idType === 'aadhaar' && val.replace(/[\s-]/g, '').length === 12) {
      const res = validateAadhaar(val)
      if (!res.valid) setValidationError(res.message)
    } else if (idType === 'pan' && val.trim().length === 10) {
      const res = validatePAN(val)
      if (!res.valid) setValidationError(res.message)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB')
      return
    }
    setDocFile(file)
    setPreviewName(file.name)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate checksum before submit
    let check = idType === 'aadhaar' ? validateAadhaar(idNumber) : validatePAN(idNumber)
    if (!check.valid) {
      setValidationError(check.message)
      toast.error(check.message)
      return
    }

    try {
      await submitIDVerification({
        idType,
        idNumber,
        documentUrl: previewName ? `docs/${previewName}` : null
      })
      handleClose()
    } catch {
      // error handled in hook
    }
  }

  const handleClose = () => {
    closeIdModal()
    setIdNumber('')
    setDocFile(null)
    setPreviewName('')
    setValidationError('')
  }

  return (
    <Modal open={idModalOpen} onClose={handleClose} size="lg">
      <div className="p-4 sm:p-6 text-gray-900">
        
        {/* Header Icon */}
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShieldCheck size={32} />
        </div>

        <h2 className="text-2xl font-black text-center font-display mb-1">
          Government ID Verification
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
          Verify your identity with Aadhaar or PAN card to get a <strong>Verified Landlord / User Badge</strong> and build trust with renters.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Select
                id="id-type-select"
                label="Document Type *"
                value={idType}
                onChange={e => { setIdType(e.target.value); setIdNumber(''); setValidationError('') }}
              >
                <option value="aadhaar">Aadhaar Card (12 Digits)</option>
                <option value="pan">PAN Card (10 Chars)</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Input
                id="id-number-input"
                label={idType === 'aadhaar' ? 'Aadhaar Number *' : 'PAN Card Number *'}
                placeholder={idType === 'aadhaar' ? 'e.g. 5432 8765 4321' : 'e.g. ABCDE1234F'}
                value={idNumber}
                onChange={e => handleIdNumberChange(e.target.value)}
                required
              />
            </div>
          </div>

          {validationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
              <AlertTriangle size={16} className="shrink-0" />
              {validationError}
            </div>
          )}

          {/* File Upload Section */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Upload Front Side Photo / PDF (Optional for Demo)
            </label>
            <label className="border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-300 transition-colors flex items-center justify-center gap-3 cursor-pointer text-gray-600">
              <Upload size={20} className="text-gray-400" />
              <span className="text-sm font-semibold">
                {previewName ? `Selected: ${previewName}` : 'Click to select Aadhaar/PAN image or document'}
              </span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 flex items-center gap-2">
            <FileCheck size={16} className="text-green-600 shrink-0" />
            Your ID number will be securely masked (e.g. XXXX-XXXX-1234) and stored with encryption.
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !!validationError}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
            >
              {loading ? 'Verifying...' : 'Verify ID Now'}
            </Button>
          </div>

        </form>

      </div>
    </Modal>
  )
}
