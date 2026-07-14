import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Plus, Trash2, Eye, CheckCircle, AlertCircle,
  Clock, Package, ArrowLeft, Zap
} from 'lucide-react'
import { useServices } from '../hooks/useServices'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORY_CONFIG = {
  tiffin:   { label: 'Tiffin',   emoji: '🍱', color: 'bg-amber-100 text-amber-700' },
  laundry:  { label: 'Laundry',  emoji: '🧺', color: 'bg-blue-100 text-blue-700'  },
  cleaning: { label: 'Cleaning', emoji: '🧹', color: 'bg-green-100 text-green-700' },
}

const StatusBadge = ({ status }) => {
  const map = {
    verified: { icon: CheckCircle, text: 'Verified', cls: 'text-green-700 bg-green-50' },
    pending:  { icon: AlertCircle, text: 'Pending Verification', cls: 'text-amber-700 bg-amber-50' },
    rejected: { icon: Clock,       text: 'Rejected', cls: 'text-red-700 bg-red-50' },
  }
  const conf = map[status] || map.pending
  const Icon = conf.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${conf.cls}`}>
      <Icon size={11} /> {conf.text}
    </span>
  )
}

export const ServiceProviderDashboard = () => {
  const navigate = useNavigate()
  const { profile } = useSelector(s => s.auth)
  const { getMyServices, deleteService, payServiceListing } = useServices()

  const [myServices, setMyServices] = useState([])
  const [loading, setLoading] = useState(true)

  const loadMyServices = async () => {
    setLoading(true)
    try {
      const data = await getMyServices()
      setMyServices(data)
    } catch {
      toast.error('Could not load your listings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMyServices() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return
    try {
      await deleteService(id)
      setMyServices(v => v.filter(s => s.id !== id))
      toast.success('Listing deleted')
    } catch (err) {
      toast.error('Failed to delete listing')
    }
  }

  // ── Pay to Go Live ─────────────────────────────────────────────
  const [payingId, setPayingId] = useState(null)

  const handlePayToGoLive = async (serviceId) => {
    if (payingId) return
    setPayingId(serviceId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { toast.error('Session expired — please log in again'); setPayingId(null); return }

      // Load Razorpay SDK dynamically
      const loadRazorpay = () => new Promise(resolve => {
        if (window.Razorpay) return resolve(true)
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve(true); s.onerror = () => resolve(false)
        document.body.appendChild(s)
      })
      if (!await loadRazorpay()) throw new Error('Razorpay SDK failed to load')

      // Create order via Edge Function
      const orderResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-listing-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        }
      })
      if (!orderResp.ok) {
        const errJson = await orderResp.json().catch(() => ({}))
        throw new Error(errJson.error || `Order creation failed (HTTP ${orderResp.status})`)
      }
      const orderData = await orderResp.json()

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: orderData.id,
        currency: 'INR',
        name: 'GoEazy',
        description: 'Service Listing — Go Live',
        image: '/favicon.svg',
        handler: async function(response) {
          try {
            // Mark payment as paid in DB
            await payServiceListing(
              serviceId,
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            )
            // Refresh the service in UI
            setMyServices(prev => prev.map(s =>
              s.id === serviceId ? { ...s, payment_status: 'paid' } : s
            ))
            toast.success('🎉 Payment successful! Your listing is now LIVE on GoEazy.')
          } catch (err) {
            toast.error('Payment recorded but DB update failed. Contact support.')
          } finally { setPayingId(null) }
        },
        prefill: { name: profile?.full_name || '', email: '' },
        theme: { color: '#CA3433' },
        modal: { ondismiss: () => setPayingId(null) }
      })
      rzp.on('payment.failed', resp => {
        toast.error('Payment failed: ' + (resp.error?.description || 'Unknown error'))
        setPayingId(null)
      })
      rzp.open()
    } catch (err) {
      toast.error(err.message || 'Could not initiate payment')
      setPayingId(null)
    }
  }

  // Stats
  const totalViews = myServices.reduce((sum, s) => sum + (s.views || 0), 0)
  const verified = myServices.filter(s => s.verification_status === 'verified').length

  return (
    <div className="pt-6 pb-20 min-h-screen bg-gray-50/50">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Button */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Service Provider Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, <span className="font-semibold text-gray-700">{profile?.full_name || 'Provider'}</span>
            </p>
          </div>
          <Button
            variant="primary"
            className="bg-[#CA3433] hover:bg-[#ac2d2c] rounded-xl gap-2 shadow-lg shadow-[#CA3433]/20 shrink-0"
            onClick={() => navigate('/service-provider/new')}
          >
            <Plus size={16} /> Add New Listing
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Listings', value: myServices.length, icon: Package, color: 'text-[#CA3433]' },
            { label: 'Total Views',    value: totalViews,         icon: Eye,     color: 'text-blue-500' },
            { label: 'Verified',       value: verified,           icon: CheckCircle, color: 'text-green-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <stat.icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Listings */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
          </div>
        ) : myServices.length > 0 ? (
          <div className="space-y-4">
            {myServices.map(service => {
              const cat = CATEGORY_CONFIG[service.category] || {}
              return (
                <div key={service.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all">
                  {/* Category Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${cat.color || 'bg-gray-100'} border border-gray-100`}>
                    {cat.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-gray-900 text-base leading-tight">{service.name}</h3>
                      <StatusBadge status={service.verification_status} />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${service.is_open ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {service.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {service.area}{service.city ? `, ${service.city}` : ''}{service.state ? ` · ${service.state}` : ''}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Eye size={11} /> {service.views || 0} views</span>
                      <span className="flex items-center gap-1"><Package size={11} /> {service.service_listings?.length || 0} items</span>
                      {/* LIVE = admin verified AND provider paid */}
                      {service.verification_status === 'verified' && service.payment_status === 'paid' && (
                        <span className="flex items-center gap-1 text-green-600 font-bold ml-2">
                          <CheckCircle size={11} /> LIVE
                        </span>
                      )}
                      {/* Awaiting payment after admin approval */}
                      {service.verification_status === 'verified' && service.payment_status !== 'paid' && (
                        <span className="flex items-center gap-1 text-amber-600 font-bold ml-2">
                          <AlertCircle size={11} /> Payment Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    {/* Pay to Go Live — shown only when verified but not yet paid */}
                    {service.verification_status === 'verified' && service.payment_status !== 'paid' && (
                      <button
                        onClick={() => handlePayToGoLive(service.id)}
                        disabled={payingId === service.id}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#CA3433] to-[#E63946] text-white text-xs font-extrabold shadow-md shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:scale-100"
                        title="Pay to publish your listing"
                      >
                        {payingId === service.id ? (
                          <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Processing…</>
                        ) : (
                          <><Zap size={13} /> Pay ₹199 to Go Live</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/services/${service.id}`)}
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-[#CA3433] hover:border-[#CA3433]/30 transition-all"
                      title="Preview"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Create your first service listing using the button above and start connecting with customers!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
