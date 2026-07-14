import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2,
  Upload, Clock, IndianRupee, MapPin, User,
  FileText, Phone, ChevronDown, Image,
} from 'lucide-react'
import { useServices } from '../hooks/useServices'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'
import { LocationPicker } from '../components/map/LocationPicker'
import { useFileUpload } from '../hooks/useFileUpload'
import { FileUploadList } from '../components/ui/FileUploadList'

const CATEGORIES = [
  { value: 'tiffin',   label: 'Tiffin 🍱',   docs: ['FSSAI License', 'Aadhaar Card', 'PAN Card'] },
  { value: 'laundry',  label: 'Laundry 🧺',  docs: ['Aadhaar Card', 'PAN Card', 'Business Registration (optional)'] },
  { value: 'cleaning', label: 'Cleaning 🧹', docs: ['Aadhaar Card', 'PAN Card', 'Business Registration (optional)'] },
]



const STEPS = [
  { icon: User,         label: 'Basic Info'     },
  { icon: Image,        label: 'Photo'          },
  { icon: MapPin,       label: 'Location'       },
  { icon: IndianRupee,  label: 'Services'       },
  { icon: IndianRupee,  label: 'Plans'          },
  { icon: FileText,     label: 'Documents'      },
  { icon: Phone,        label: 'Contact'        },
]

const InputField = ({ label, required, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-[#CA3433]">*</span>}
    </label>
    <input
      {...props}
      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#CA3433] focus:ring-2 focus:ring-[#CA3433]/10 transition-all"
    />
  </div>
)

const TextareaField = ({ label, required, ...props }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-[#CA3433]">*</span>}
    </label>
    <textarea
      {...props}
      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#CA3433] focus:ring-2 focus:ring-[#CA3433]/10 transition-all resize-none"
    />
  </div>
)

export const ServiceNew = () => {
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)
  const { createService } = useServices()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [basicInfo, setBasicInfo] = useState({
    name: '', category: 'tiffin', description: '', experience: '', speciality: '',
  })

  // Step 1: Photo (Poster) — useFileUpload gives XHR progress + retry
  const [posterPreviews, setPosterPreviews] = useState([])
  const {
    fileStates: posterStates,
    uploadFiles: uploadPosters,
    retryFile: retryPoster,
    removeFile: removePosterEntry,
    successUrls: posterUrls,
    hasErrors: posterHasErrors,
    hasUploading: posterUploading,
  } = useFileUpload('service-images', user?.id ?? 'anon')

  // Step 5: Documents — separate useFileUpload instance
  const {
    fileStates: docStates,
    uploadFiles: uploadDocs,
    retryFile: retryDoc,
    successUrls: docUrls,
    hasErrors: docHasErrors,
    hasUploading: docUploading,
  } = useFileUpload('service-documents', user?.id ?? 'anon')
  const [location, setLocation] = useState({
    state: 'Uttarakhand', city: '', area: '', address: '', landmark: '',
    latitude: null, longitude: null, map_address: '',
  })

  const handleLocationPin = ({ latitude, longitude, map_address }) => {
    setLocation(v => ({ ...v, latitude, longitude, map_address: map_address || '' }))
  }

  // Step 3: Services (rows)
  const [serviceItems, setServiceItems] = useState([
    { service_name: '', price: '', unit: 'per month', description: '' },
  ])

  // Step 4: Plans
  const [plans, setPlans] = useState([
    { plan_name: 'Monthly', price: '', description: '' },
  ])

  // Step 5: Documents — now managed by useFileUpload, no local state needed

  // Step 6: Contact
  const [contact, setContact] = useState({ contact_phone: '', contact_email: '' })

  const selectedCategory = CATEGORIES.find(c => c.value === basicInfo.category)

  const addServiceItem = () => setServiceItems(v => [...v, { service_name: '', price: '', unit: 'per month', description: '' }])
  const removeServiceItem = (i) => setServiceItems(v => v.filter((_, idx) => idx !== i))
  const updateServiceItem = (i, key, val) => setServiceItems(v => v.map((item, idx) => idx === i ? { ...item, [key]: val } : item))

  const addPlan = () => setPlans(v => [...v, { plan_name: '', price: '', description: '' }])
  const removePlan = (i) => setPlans(v => v.filter((_, idx) => idx !== i))
  const updatePlan = (i, key, val) => setPlans(v => v.map((p, idx) => idx === i ? { ...p, [key]: val } : p))

  const handleFileChange = e => {
    const files = Array.from(e.target.files)
    setDocumentFiles(v => [...v, ...files])
  }
  const removeFile = (i) => setDocumentFiles(v => v.filter((_, idx) => idx !== i))

  const validateStep = () => {
    if (step === 0 && !basicInfo.name.trim()) { toast.error('Provider name is required'); return false }
    if (step === 1 && posterPreviews.length < 1) { toast.error('Please upload at least 1 service photo'); return false }
    if (step === 1 && posterHasErrors) { toast.error('Some photos failed — please retry them before continuing'); return false }
    if (step === 1 && posterUploading) { toast.error('Please wait for photo uploads to complete'); return false }
    if (step === 2 && !location.city.trim())   { toast.error('City is required'); return false }
    if (step === 2 && !location.area.trim())   { toast.error('Area is required'); return false }
    if (step === 6 && !contact.contact_phone.trim()) { toast.error('Phone number is required'); return false }
    return true
  }

  const goNext = () => {
    if (!validateStep()) return
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }
  const goPrev = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    if (!validateStep()) return
    if (!user) { toast.error('You must be logged in'); return }

    // Guard on any pending doc uploads
    if (docUploading) { toast.error('Please wait for document uploads to finish'); return }
    if (docHasErrors) { toast.error('Some documents failed to upload — please retry them'); return }

    setSubmitting(true)
    try {
      const providerData = {
        ...basicInfo,
        ...location,
        ...contact,
      }

      const validItems = serviceItems.filter(i => i.service_name.trim() && i.price)
      const validPlans = plans.filter(p => p.plan_name.trim() && p.price)

      // Pass pre-uploaded URLs instead of raw File objects
      await createService(providerData, validItems, validPlans, docUrls, posterUrls)
      toast.success('Service listing created! Pending verification.')
      navigate('/service-provider')
    } catch (err) {
      toast.error(err.message || 'Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-6 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">List Your Service</h1>
          <p className="text-sm text-gray-500 mt-1">Be part of the GoEazy services marketplace</p>
        </div>

        {/* Step Timeline — same style as PropertyForm */}
        <div className="flex items-center justify-between mb-6 px-1">
          {STEPS.map((s, i) => {
            const done   = i < step
            const active = i === step
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 border-2 ${
                    done    ? 'bg-[#CA3433] border-[#CA3433] text-white'
                    : active ? 'bg-white border-[#CA3433] text-[#CA3433] shadow-md shadow-red-100'
                    : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {done ? <Check size={14} /> : i + 1}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block transition-colors ${
                    active ? 'text-[#CA3433]' : done ? 'text-gray-500' : 'text-gray-300'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-1 rounded transition-all duration-500 ${done ? 'bg-[#CA3433]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Step Card */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">

          {/* ── Step 0: Basic Info ─────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
              <InputField label="Provider / Business Name" required placeholder="e.g. Sharma Tiffin Service" value={basicInfo.name} onChange={e => setBasicInfo(v => ({ ...v, name: e.target.value }))} />

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category <span className="text-[#CA3433]">*</span></label>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} type="button" onClick={() => setBasicInfo(v => ({ ...v, category: cat.value }))}
                      className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${basicInfo.category === cat.value ? 'border-[#CA3433] bg-red-50 text-[#CA3433]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <TextareaField label="Description" rows={3} placeholder="Tell customers about your service..." value={basicInfo.description} onChange={e => setBasicInfo(v => ({ ...v, description: e.target.value }))} />
              <InputField label="Experience" placeholder="e.g. 5 years of home-cooked tiffin delivery" value={basicInfo.experience} onChange={e => setBasicInfo(v => ({ ...v, experience: e.target.value }))} />
              <TextareaField label="Speciality" rows={2} placeholder="e.g. Eco-friendly wash, home-made food, deep cleaning..." value={basicInfo.speciality} onChange={e => setBasicInfo(v => ({ ...v, speciality: e.target.value }))} />
            </div>
          )}

          {/* ── Step 1: Photo ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5 text-center py-4">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Photos (Up to 3)</h2>
                <p className="text-sm text-gray-500 mb-6 font-medium">✨ We recommend uploading all 3 images for better visibility. (Max 7MB each)</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {posterPreviews.map((preview, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden group border border-gray-200">
                      <img src={preview} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          setPosterImages(v => v.filter((_, idx) => idx !== i))
                          setPosterPreviews(v => v.filter((_, idx) => idx !== i))
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  {posterPreviews.length < 3 && (
                    <div 
                      className={`relative aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center bg-gray-50 hover:border-[#CA3433] hover:bg-red-50/50 border-gray-200 text-gray-500`}
                      onClick={() => document.getElementById('poster-upload').click()}
                    >
                      <Image className="mb-2 text-gray-400" size={24} />
                      <span className="text-sm font-semibold">Add Photo</span>
                      <input 
                        id="poster-upload" 
                        type="file"
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          const files = Array.from(e.target.files)
                          if (files.length + posterPreviews.length > 3) {
                            toast.error('Maximum 3 images allowed')
                            return
                          }
                          for (const file of files) {
                            if (file.size > 7 * 1024 * 1024) {
                              toast.error(`Image ${file.name} exceeds 7MB limit`)
                              return
                            }
                          }
                          setPosterPreviews(v => [...v, ...files.map(f => URL.createObjectURL(f))])
                          uploadPosters(files)
                          e.target.value = ''
                        }} 
                      />
                    </div>
                  )}
                </div>

                {/* Upload progress for poster images */}
                <FileUploadList fileStates={posterStates} onRetry={retryPoster} />
              </div>
            </div>
          )}

          {/* ── Step 2: Location ───────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Service Location</h2>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="City" required placeholder="e.g. Dehradun" value={location.city} onChange={e => setLocation(v => ({ ...v, city: e.target.value }))} />
                <InputField label="Area" required placeholder="e.g. Rajpur Road" value={location.area} onChange={e => setLocation(v => ({ ...v, area: e.target.value }))} />
              </div>
              <TextareaField label="Full Address" rows={2} placeholder="House no., Street name, Colony..." value={location.address} onChange={e => setLocation(v => ({ ...v, address: e.target.value }))} />
              <InputField label="Nearby Landmark" placeholder="e.g. Near SBI Bank" value={location.landmark} onChange={e => setLocation(v => ({ ...v, landmark: e.target.value }))} />

              {/* Map Pin */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                <LocationPicker
                  value={{ latitude: location.latitude, longitude: location.longitude, map_address: location.map_address }}
                  onChange={handleLocationPin}
                  label="Pin Your Shop / Service Location"
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Services & Pricing ─────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Services & Pricing</h2>
              <p className="text-sm text-gray-500">List each item/service you offer with its price.</p>
              {serviceItems.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase">Item {i + 1}</span>
                    {serviceItems.length > 1 && (
                      <button type="button" onClick={() => removeServiceItem(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <InputField label="Service Name" required placeholder="e.g. Dal Rice Tiffin" value={item.service_name} onChange={e => updateServiceItem(i, 'service_name', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Price (₹)" required type="number" placeholder="e.g. 1500" value={item.price} onChange={e => updateServiceItem(i, 'price', e.target.value)} />
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Unit</label>
                      <select value={item.unit} onChange={e => updateServiceItem(i, 'unit', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#CA3433]">
                        {['per day','per week','per month','per kg','per visit','per hour'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <InputField label="Description (optional)" placeholder="Brief description..." value={item.description} onChange={e => updateServiceItem(i, 'description', e.target.value)} />
                </div>
              ))}
              <button type="button" onClick={addServiceItem}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-[#CA3433] hover:text-[#CA3433] transition-all flex items-center justify-center gap-2">
                <Plus size={15} /> Add Another Item
              </button>
            </div>
          )}

          {/* ── Step 4: Subscription Plans ─────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Subscription Plans</h2>
              <p className="text-sm text-gray-500">Add monthly or weekly plans for your customers.</p>
              {plans.map((plan, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase">Plan {i + 1}</span>
                    {plans.length > 1 && (
                      <button type="button" onClick={() => removePlan(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Plan Name" required placeholder="e.g. Monthly" value={plan.plan_name} onChange={e => updatePlan(i, 'plan_name', e.target.value)} />
                    <InputField label="Price (₹)" required type="number" placeholder="e.g. 2000" value={plan.price} onChange={e => updatePlan(i, 'price', e.target.value)} />
                  </div>
                  <TextareaField label="Description" rows={2} placeholder="What's included in this plan..." value={plan.description} onChange={e => updatePlan(i, 'description', e.target.value)} />
                </div>
              ))}
              <button type="button" onClick={addPlan}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-[#CA3433] hover:text-[#CA3433] transition-all flex items-center justify-center gap-2">
                <Plus size={15} /> Add Plan
              </button>
            </div>
          )}

          {/* ── Step 5: Legal Documents ──────────────────────────── */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Legal Documents</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-2">Required documents for {basicInfo.category}:</p>
                <ul className="space-y-1">
                  {selectedCategory?.docs.map(d => (
                    <li key={d} className="text-xs text-amber-600 flex items-center gap-1.5">
                      <span>•</span> {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#CA3433] transition-all cursor-pointer"
                onClick={() => document.getElementById('doc-upload').click()}
              >
                <Upload size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">Click to upload documents</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 5MB each)</p>
                <input
                  id="doc-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => {
                    uploadDocs(Array.from(e.target.files))
                    e.target.value = ''
                  }}
                />
              </div>

              {/* Upload progress for documents */}
              <FileUploadList fileStates={docStates} onRetry={retryDoc} compact />

              <p className="text-xs text-gray-400 text-center">
                Your documents are securely stored and only reviewed by GoEazy for verification purposes.
              </p>
            </div>
          )}

          {/* ── Step 6: Contact Details ────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Contact Details</h2>
              <p className="text-sm text-gray-500">These will be shown to customers after they request access.</p>
              <InputField label="Phone Number" required type="tel" placeholder="+91 98765 43210" value={contact.contact_phone} onChange={e => setContact(v => ({ ...v, contact_phone: e.target.value }))} />
              <InputField label="Email Address" type="email" placeholder="youremail@example.com" value={contact.contact_email} onChange={e => setContact(v => ({ ...v, contact_email: e.target.value }))} />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <Button variant="secondary" onClick={goPrev} className="flex-1 rounded-xl gap-2">
              <ArrowLeft size={16} /> Previous
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={goNext} className="flex-1 rounded-xl bg-[#CA3433] hover:bg-[#ac2d2c] gap-2">
              Next Step <ArrowRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} loading={submitting}
              className="flex-1 rounded-xl bg-[#CA3433] hover:bg-[#ac2d2c] gap-2">
              <Check size={16} /> Submit Listing
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
