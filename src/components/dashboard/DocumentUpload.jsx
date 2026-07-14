import React, { useState } from 'react'
import { Upload, FileText, Check, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export const DocumentUpload = ({ onUploadComplete }) => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const documentTypes = [
    { id: 'aadhar', label: 'Aadhar Card', required: true },
    { id: 'pan', label: 'PAN Card', required: true },
    { id: 'income_proof', label: 'Income Proof', required: false },
    { id: 'passport', label: 'Passport', required: false },
    { id: 'driving_license', label: 'Driving License', required: false },
  ]

  const handleFileUpload = async (file, documentType) => {
    if (!file || !user) return

    setUploading(true)
    setUploadProgress(prev => ({ ...prev, [documentType]: 'uploading' }))

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(fileName)

      // Save document record
      const { error: dbError } = await supabase
        .from('user_documents')
        .upsert({
          user_id: user.id,
          document_type: documentType,
          file_url: publicUrl,
          file_name: file.name,
          verified: false
        })

      if (dbError) throw dbError

      setUploadProgress(prev => ({ ...prev, [documentType]: 'success' }))
      onUploadComplete?.()

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [documentType]: null }))
      }, 3000)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadProgress(prev => ({ ...prev, [documentType]: 'error' }))
      
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [documentType]: null }))
      }, 3000)
    } finally {
      setUploading(false)
    }
  }

  const getProgressStatus = (docType) => {
    const status = uploadProgress[docType]
    switch (status) {
      case 'uploading':
        return { icon: <Loader2 className="animate-spin" size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' }
      case 'success':
        return { icon: <Check size={16} />, color: 'text-green-600', bg: 'bg-green-50' }
      case 'error':
        return { icon: <X size={16} />, color: 'text-red-600', bg: 'bg-red-50' }
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {documentTypes.map((docType) => {
        const progress = getProgressStatus(docType.id)
        
        return (
          <div key={docType.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-500" />
                <span className="font-medium text-gray-700">{docType.label}</span>
                {docType.required && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Required</span>
                )}
              </div>
              {progress && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${progress.bg} ${progress.color}`}>
                  {progress.icon}
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="file"
                id={`upload-${docType.id}`}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file, docType.id)
                }}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor={`upload-${docType.id}`}
                className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  progress?.color === 'text-green-600'
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-[#CA3433] hover:bg-red-50'
                }`}
              >
                <Upload size={20} />
                <span className="text-sm font-medium">
                  {progress?.color === 'text-green-600' 
                    ? `${docType.label} Uploaded` 
                    : `Upload ${docType.label}`
                  }
                </span>
              </label>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Supported formats: PDF, JPG, PNG. Max size: 10MB
            </p>
          </div>
        )
      })}
    </div>
  )
}