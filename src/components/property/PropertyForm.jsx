import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Image as ImageIcon, Video, Zap, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import { PROPERTY_TYPES, AMENITIES } from '../../utils/constants'
import { useProperties } from '../../hooks/useProperties'
import { useSelector } from 'react-redux'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { LocationPicker } from '../map/LocationPicker'

// ── Success Overlay ───────────────────────────────────────────────────────────
const ListingSuccessOverlay = () => (
  <div className="fixed inset-0 z-[99] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md animate-in fade-in duration-300">
    <div className="relative flex flex-col items-center gap-6">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#fce8e8" strokeWidth="4" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="#CA3433" strokeWidth="4"
            strokeLinecap="round" strokeDasharray="289" strokeDashoffset="289"
            style={{ animation: 'drawCircle 0.5s ease-out forwards', transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />
          <polyline points="28,52 44,66 72,36" fill="none" stroke="#CA3433" strokeWidth="6"
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="70" strokeDashoffset="70"
            style={{ animation: 'drawTick 0.4s ease-out 0.45s forwards' }}
          />
        </svg>
        <div className="absolute inset-0 rounded-full border-4 border-[#CA3433]/20"
          style={{ animation: 'pulseRing 1s ease-out 0.6s infinite' }}
        />
      </div>
      <div className="text-center" style={{ animation: 'fadeInUp 0.5s ease-out 0.8s both' }}>
        <h2 className="text-3xl font-black text-gray-900 font-display mb-2">Listing Live! 🎉</h2>
        <p className="text-gray-500 font-medium">Your property is now visible to renters across Uttarakhand.</p>
      </div>
    </div>
    <style>{`
      @keyframes drawCircle { to { stroke-dashoffset: 0; } }
      @keyframes drawTick { to { stroke-dashoffset: 0; } }
      @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
  </div>
)

// ── Step Config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Basics',   short: '1' },
  { id: 2, label: 'Location', short: '2' },
  { id: 3, label: 'Map',      short: '3' },
  { id: 4, label: 'Contact',  short: '4' },
  { id: 5, label: 'Amenities',short: '5' },
  { id: 6, label: 'Photos',   short: '6' },
]

// ── Timeline Progress Bar ─────────────────────────────────────────────────────
const StepTimeline = ({ current }) => (
  <div className="flex items-center justify-between mb-8 px-1">
    {STEPS.map((step, i) => {
      const done = current > step.id
      const active = current === step.id
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 border-2 ${
              done    ? 'bg-[#CA3433] border-[#CA3433] text-white'
              : active ? 'bg-white border-[#CA3433] text-[#CA3433] shadow-md shadow-red-100'
              : 'bg-white border-gray-200 text-gray-400'
            }`}>
              {done ? <CheckCircle2 size={16} /> : step.short}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block transition-colors ${
              active ? 'text-[#CA3433]' : done ? 'text-gray-500' : 'text-gray-300'
            }`}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-[2px] mx-1 rounded transition-all duration-500 ${
              done ? 'bg-[#CA3433]' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      )
    })}
  </div>
)

// ── Main Form ─────────────────────────────────────────────────────────────────
export const PropertyForm = ({ initialData, isEdit = false }) => {
  const navigate = useNavigate()
  const { updateProperty } = useProperties()
  const { user } = useSelector(s => s.auth)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [step, setStep] = useState(1)
  const [images, setImages] = useState([])
  const [previewUrls, setPreviewUrls] = useState(initialData?.images || [])
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(initialData?.video_url || '')

  const [form, setForm] = useState({
    title:             initialData?.title || '',
    description:       initialData?.description || '',
    price:             initialData?.price || '',
    city:              initialData?.city || '',
    area:              initialData?.area || '',
    pincode:           initialData?.pincode || '',
    type:              initialData?.type || PROPERTY_TYPES[0],
    amenities:         initialData?.amenities || [],
    nearby_landmarks:  initialData?.nearby_landmarks || '',
    exact_location:    initialData?.exact_location || '',
    contact_phone:     initialData?.contact_phone || '',
    contact_email:     initialData?.contact_email || '',
    availability:      initialData?.availability ?? true,
    latitude:          initialData?.latitude || null,
    longitude:         initialData?.longitude || null,
    map_address:       initialData?.map_address || '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleLocationChange = ({ latitude, longitude, map_address }) => {
    setForm(f => ({ ...f, latitude, longitude, map_address: map_address || '' }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + previewUrls.length > 3) { toast.error('Maximum 3 images allowed'); return }
    for (const file of files) {
      if (file.size > 7 * 1024 * 1024) { toast.error(`Image ${file.name} exceeds 7MB limit`); return }
    }
    setImages(prev => [...prev, ...files])
    setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
  }

  const removeImage = (index) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    if (index >= (initialData?.images?.length || 0)) {
      setImages(prev => prev.filter((_, i) => i !== index - (initialData?.images?.length || 0)))
    }
  }

  useEffect(() => () => {
    if (videoPreview?.startsWith('blob:')) URL.revokeObjectURL(videoPreview)
  }, [videoPreview])

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      toast.error('Please choose an MP4, WebM, or MOV video'); return
    }
    if (file.size > 100 * 1024 * 1024) { toast.error('Video must be smaller than 100MB'); return }
    const url = URL.createObjectURL(file)
    const probe = document.createElement('video')
    probe.preload = 'metadata'
    probe.onloadedmetadata = () => {
      if (probe.duration < 30 || probe.duration > 60) {
        URL.revokeObjectURL(url)
        toast.error('Walkthrough videos must be between 30 and 60 seconds'); return
      }
      setVideoFile(file)
      setVideoPreview(url)
    }
    probe.onerror = () => { URL.revokeObjectURL(url); toast.error('Unable to read this video') }
    probe.src = url
  }

  const uploadVideo = async (session) => {
    if (!videoFile) return videoPreview || null
    const ext = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4'
    const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('property-videos').upload(path, videoFile, { upsert: false, contentType: videoFile.type })
    if (error) throw new Error('Video upload failed: ' + error.message)
    return supabase.storage.from('property-videos').getPublicUrl(data.path).data.publicUrl
  }

  const toggleAmenity = (id) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(id) ? f.amenities.filter(a => a !== id) : [...f.amenities, id]
    }))
  }

  // ── Per-step validation ────────────────────────────────────────────────────
  const validateStep = (s) => {
    if (s === 1 && (!form.title || !form.price)) { toast.error('Title and Rent are required'); return false }
    if (s === 2 && (!form.city || !form.area))   { toast.error('City and Area are required'); return false }
    if (s === 6 && previewUrls.length < 1)        { toast.error('Please upload at least 1 photo'); return false }
    return true
  }

  const next = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, 6)) }
  const back = () => setStep(s => Math.max(s - 1, 1))

  // ── Final submit ──────────────────────────────────────────────────────────
  const validateForm = () => {
    if (!form.title || !form.price || !form.city || !form.area) { toast.error('Please fill all required fields'); return false }
    if (previewUrls.length < 1 || previewUrls.length > 3) { toast.error('Please upload between 1 and 3 images'); return false }
    return true
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const videoUrl = videoFile ? await uploadVideo(session) : (videoPreview || null)
      await updateProperty(initialData.id, { ...form, video_url: videoUrl, images: previewUrls.filter(u => !u.startsWith('blob:')) }, images)
      toast.success('Property updated successfully!')
      navigate('/landlord')
    } catch (err) {
      toast.error(err.message || 'Failed to save property')
    } finally { setLoading(false) }
  }

  const handlePayToGoLive = async () => {
    if (!validateForm()) return
    if (loading) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { toast.error('Session expired — please log in again'); setLoading(false); return }

      const uploadedUrls = []
      for (const file of images) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-images').upload(`${session.user.id}/${fileName}`, file, { upsert: false })
        if (uploadError) throw new Error('Image upload failed: ' + uploadError.message)
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(uploadData.path)
        uploadedUrls.push(publicUrl)
      }
      const videoUrl = await uploadVideo(session)

      const loadRazorpay = () => new Promise(resolve => {
        if (window.Razorpay) return resolve(true)
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve(true); s.onerror = () => resolve(false)
        document.body.appendChild(s)
      })
      if (!await loadRazorpay()) throw new Error('Razorpay SDK failed to load')

      const orderResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-listing-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY }
      })
      if (!orderResp.ok) {
        const errText = await orderResp.text()
        let errJson = {}; try { errJson = JSON.parse(errText) } catch(e) {}
        const msg = [errJson.error, errJson.detail, `HTTP ${orderResp.status}`].filter(Boolean).join(' | ')
        toast.error(msg, { duration: 8000 }); throw new Error(msg)
      }
      const orderData = await orderResp.json()

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: orderData.id, currency: 'INR',
        name: 'GoEazy', description: 'List Your Property — Go Live', image: '/favicon.svg',
        handler: async function(response) {
          try {
            setLoading(true)
            const { data: { session: s2 } } = await supabase.auth.getSession()
            const verifyResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-listing-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s2?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
              body: JSON.stringify({ ...response, property_data: { ...form, images: uploadedUrls, video_url: videoUrl } })
            })
            if (!verifyResp.ok) { const e = await verifyResp.json().catch(() => ({})); throw new Error(e.error || 'Payment verification failed') }
            setShowSuccess(true)
            setTimeout(() => navigate('/landlord'), 2800)
          } catch (vErr) { toast.error('Payment verification failed: ' + vErr.message) }
          finally { setLoading(false) }
        },
        prefill: { name: user?.user_metadata?.full_name || 'Landlord', email: user?.email || '' },
        theme: { color: '#CA3433' },
        modal: { ondismiss: () => setLoading(false) }
      })
      rzp.on('payment.failed', resp => { toast.error('Payment failed: ' + (resp.error?.description || '')); setLoading(false) })
      rzp.open()
    } catch (err) { toast.error(err.message || 'Something went wrong'); setLoading(false) }
  }

  // ── Render Steps ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      case 1: return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Basic Details</h3>
            <p className="text-sm text-gray-400">Start with the most important information about your property.</p>
          </div>
          <Input id="property-title" label="Property Title *" placeholder="e.g. Spacious 1BHK in Rajpur Road"
            value={form.title} onChange={e => set('title', e.target.value)} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="property-price" label="Rent (₹/month) *" type="number" placeholder="e.g. 12000"
              rightIcon={<span className="text-sm font-bold text-gray-400">/ mo</span>}
              value={form.price} onChange={e => set('price', Number(e.target.value))} required />
            <Select id="property-type" label="Property Type *" value={form.type} onChange={e => set('type', e.target.value)}>
              {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <Textarea id="property-description" label="Description" placeholder="Tell renters what makes this place special..."
            rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
      )

      case 2: return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Location</h3>
            <p className="text-sm text-gray-400">Where is your property located?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select id="property-city" label="City *" value={form.city} onChange={e => set('city', e.target.value)} required>
              <option value="" disabled>Select city</option>
              {['Dehradun','Srinagar','Rishikesh','Haldwani','Nainital','Haridwar','Roorkee','Rudrapur'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input id="property-area" label="Area / Locality *" placeholder="e.g. Rajpur Road"
              value={form.area} onChange={e => set('area', e.target.value)} required />
            <Input id="property-pincode" label="Pincode" placeholder="e.g. 248001"
              value={form.pincode} onChange={e => set('pincode', e.target.value)} />
          </div>
          <Input id="property-landmarks" label="Nearby Landmarks" placeholder="e.g. 500m from Clock Tower, Near FRI"
            value={form.nearby_landmarks} onChange={e => set('nearby_landmarks', e.target.value)} />
        </div>
      )

      case 3: return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Pin on Map</h3>
            <p className="text-sm text-gray-400">Drop a pin on your exact property location. This helps renters find you easily.</p>
          </div>
          <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
            <LocationPicker
              value={{ latitude: form.latitude, longitude: form.longitude, map_address: form.map_address }}
              onChange={handleLocationChange}
              label="Pin Property on Map"
            />
          </div>
        </div>
      )

      case 4: return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Premium Contact Details</h3>
            <p className="text-sm text-gray-400">These details are only visible to tenants who unlock your listing. Keep them accurate.</p>
          </div>
          <Input id="property-address" label="Exact Property Address"
            placeholder="e.g. Flat 402, Building B, XYZ Apartments, Near Metro"
            value={form.exact_location} onChange={e => set('exact_location', e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="property-phone" label="Contact Phone" placeholder="+91 9876543210"
              value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            <Input id="property-email" label="Contact Email" type="email" placeholder="owner@email.com"
              value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
          </div>
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-amber-500 text-lg">🔒</span>
            <p className="text-xs text-amber-700 font-medium">These details are hidden from public view. Only unlocked tenants (who pay ₹49) can see them.</p>
          </div>
        </div>
      )

      case 5: return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Amenities</h3>
            <p className="text-sm text-gray-400">Select all amenities your property offers. More = better visibility.</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {AMENITIES.map(a => {
              const isActive = form.amenities.includes(a.id)
              return (
                <button key={a.id} type="button" onClick={() => toggleAmenity(a.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    isActive ? 'border-[#CA3433] bg-red-50 text-[#CA3433]' : 'border-gray-100 bg-white text-gray-500 hover:border-red-200'
                  }`}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-[10px] font-semibold leading-tight text-center">{a.label}</span>
                </button>
              )
            })}
          </div>
          {form.amenities.length > 0 && (
            <p className="text-xs font-bold text-[#CA3433]">{form.amenities.length} amenities selected ✓</p>
          )}
        </div>
      )

      case 6: return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-1">Photos & Go Live</h3>
            <p className="text-sm text-gray-400">Upload up to 3 photos. Better photos = more inquiries. (Max 7MB each)</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden group border border-gray-100">
                <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </div>
            ))}
            {previewUrls.length < 3 && (
              <label className="aspect-video rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-[#CA3433] hover:bg-red-50/30 transition-colors text-gray-500">
                <ImageIcon size={24} className="mb-2" />
                <span className="text-sm font-semibold">Add Photo</span>
                <input id="property-images" type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2"><Video size={17} className="text-[#CA3433]" /> Walkthrough video</h4>
                <p className="text-xs text-gray-500 mt-1">Optional 30–60 second MP4, WebM, or MOV (max 100MB). Admin approval is required before it appears publicly.</p>
              </div>
              <label className="shrink-0 cursor-pointer rounded-xl bg-white border border-red-200 px-3 py-2 text-xs font-bold text-[#CA3433] hover:bg-red-50">
                {videoPreview ? 'Replace' : 'Add video'}
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoChange} />
              </label>
            </div>
            {videoPreview && (
              <div className="relative overflow-hidden rounded-xl bg-black">
                <video src={videoPreview} controls preload="metadata" className="w-full max-h-64 object-contain" />
                <button type="button" onClick={() => { setVideoFile(null); setVideoPreview('') }} className="absolute top-2 right-2 rounded-lg bg-black/70 p-2 text-white hover:bg-red-600" aria-label="Remove walkthrough video"><X size={15} /></button>
              </div>
            )}
          </div>

          {/* Availability toggle */}
          <label htmlFor="property-availability" className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-100">
            <input id="property-availability" type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[#CA3433] focus:ring-[#CA3433] accent-[#CA3433]"
              checked={form.availability} onChange={e => set('availability', e.target.checked)} />
            <span className="text-sm font-semibold text-gray-900">Mark as Available to Rent</span>
          </label>

        </div>
      )

      default: return null
    }
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <>
      {showSuccess && <ListingSuccessOverlay />}

      <div className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <StepTimeline current={step} />

        <form onSubmit={isEdit ? handleEditSubmit : e => e.preventDefault()}>
          {/* Step Content */}
          <div>
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            {step > 1 ? (
              <button type="button" onClick={back}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <button type="button" onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            )}

            <div className="flex-1" />

            {step < 6 ? (
              <button type="button" onClick={next}
                className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#CA3433] text-white font-bold text-sm hover:bg-[#ac2d2c] transition-colors shadow-sm shadow-red-100">
                Next <ChevronRight size={16} />
              </button>
            ) : isEdit ? (
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#CA3433] text-white font-bold text-sm hover:bg-[#ac2d2c] transition-colors disabled:opacity-60">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button type="button" onClick={handlePayToGoLive} disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#CA3433] to-[#E63946] text-white font-extrabold text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:scale-100">
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Processing...</>
                ) : (
                  <><Zap size={16} /> GO LIVE <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-black">₹199</span></>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  )
}
