import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Home, Eye, Edit, Trash2, ArrowRight, ArrowLeft, Calendar, Check, X, Rocket } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProperties } from '../hooks/useProperties'
import { useRazorpay } from '../hooks/useRazorpay'
import { Button } from '../components/ui/Button'
import { Badge, TypeBadge } from '../components/ui/Badge'
import { PropertyCard } from '../components/property/PropertyCard'
import { formatPriceShort } from '../utils/helpers'
import toast from 'react-hot-toast'
import { Skeleton } from '../components/ui/Skeleton'
import { supabase } from '../lib/supabase'

export const LandlordDashboard = () => {
  const { user, profile } = useAuth()
  const { getLandlordProperties, deleteProperty } = useProperties()
  const { processPayment, isProcessing } = useRazorpay()
  const navigate = useNavigate()
  
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [siteVisits, setSiteVisits] = useState([])
  const [loadingVisits, setLoadingVisits] = useState(true)
  const [actioningVisitId, setActioningVisitId] = useState(null)
  const [promotingPropertyId, setPromotingPropertyId] = useState(null)

  useEffect(() => {
    if (user) {
      loadProperties()
      loadSiteVisits()
    }
  }, [user])

  const loadProperties = async () => {
    try {
      const data = await getLandlordProperties()
      setProperties(data)
    } catch (err) {
      console.error('Failed to load properties:', err)
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return
    const toastId = toast.loading('Deleting property...')
    try {
      await deleteProperty(id)
      setProperties(prev => prev.filter(p => p.id !== id))
      toast.success('Property deleted permanently', { id: toastId })
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error(err.message || 'Failed to delete property', { id: toastId })
    }
  }

  const loadSiteVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('site_visits')
        .select(`
          *,
          property:properties(id, title),
          renter:profiles!user_id(full_name)
        `)
        .eq('landlord_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setSiteVisits(data || [])
    } catch (err) {
      console.error('Failed to load visits:', err)
    } finally {
      setLoadingVisits(false)
    }
  }

  const handleVisitAction = async (visitId, userId, propertyTitle, action) => {
    setActioningVisitId(visitId)
    try {
      const { error } = await supabase
        .from('site_visits')
        .update({ status: action })
        .eq('id', visitId)
      if (error) throw error

      const msg = `Your site visit request for "${propertyTitle || 'Property'}" has been ${action}.`
      await supabase.from('notifications').insert({
        user_id: userId,
        message: msg
      })

      toast.success(`Visit ${action} successfully`)
      setSiteVisits(prev => prev.filter(v => v.id !== visitId))
    } catch (err) {
      console.error(err)
      toast.error('Failed to update visit status')
    } finally {
      setActioningVisitId(null)
    }
  }

  const handlePromoteListing = async (property) => {
    setPromotingPropertyId(property.id)
    const toastId = toast.loading('Initializing premium checkout...')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Authentication expired. Please log in again.', { id: toastId })
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-listing-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            propertyId: property.id,
            title: property.title,
            amount: 500
          }),
        }
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Order initialization failed')

      toast.dismiss(toastId)
      await processPayment(data.orderId, property.title, 500)

    } catch (err) {
      console.error('Promotion failed:', err)
      toast.error(err.message || 'Could not process premium request', { id: toastId })
    } finally {
      setPromotingPropertyId(null)
    }
  }

  const totalListings = properties.length
  const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0)

  const previewProperties = properties.slice(0, 2)
  const displayProperties = showAll ? properties : previewProperties

  return (
    <div className="pt-12 lg:pt-0 pb-20 bg-gray-50 min-h-screen">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Actions */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-[#CA3433] transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            <span>Back to Home</span>
          </button>
        </div>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ffc9c9] bg-gray-200">
               {profile ? (
                 <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="w-full h-full object-cover"/>
               ) : (
                 <Skeleton variant="circle" className="w-full h-full" />
               )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-display">
                {profile ? `Welcome, ${profile?.full_name?.split(' ')[0] || 'Landlord'}!` : <Skeleton className="h-8 w-40" />}
              </h1>
              <p className="text-gray-500">Manage your properties and track views.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/landlord/properties/new')} variant="primary" leftIcon={<Plus size={18} />}>
            New Listing
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="text-[#CA3433] shrink-0">
              <Home size={32} />
            </div>
            <div className="flex-1">
              <p className="text-gray-500 text-sm font-medium">Total Listings</p>
              {loading ? <Skeleton className="h-8 w-12 mt-1" /> : <h3 className="text-3xl font-bold text-gray-900">{totalListings}</h3>}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="text-green-600 shrink-0">
              <Eye size={32} />
            </div>
            <div className="flex-1">
              <p className="text-gray-500 text-sm font-medium">Total Profile Views</p>
              {loading ? <Skeleton className="h-8 w-12 mt-1" /> : <h3 className="text-3xl font-bold text-gray-900">{totalViews}</h3>}
            </div>
          </div>
        </div>

        {/* Site Visit Requests */}
        {!loadingVisits && siteVisits.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-[#CA3433]" />
              Visit Requests
              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{siteVisits.length}</span>
            </h2>
            <div className="grid gap-3">
              {siteVisits.map(visit => (
                <div key={visit.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 truncate">{visit.property?.title || 'Property'}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Requested by <span className="font-semibold text-gray-700">{visit.renter?.full_name || 'User'}</span> for <span className="font-semibold text-[#CA3433]">{new Date(visit.visit_date).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-shrink-0">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleVisitAction(visit.id, visit.user_id, visit.property?.title, 'approved')}
                      disabled={actioningVisitId === visit.id}
                      className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20"
                    >
                      <Check size={16} className="mr-1" /> Approve
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleVisitAction(visit.id, visit.user_id, visit.property?.title, 'declined')}
                      disabled={actioningVisitId === visit.id}
                      className="flex-1 sm:flex-none text-red-600 hover:bg-red-50 border-red-100"
                    >
                      <X size={16} className="mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 font-display">
            {showAll ? 'All Listings' : 'Your Listings'}
            {!loading && properties.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {showAll ? `(${properties.length})` : `(${Math.min(2, properties.length)} of ${properties.length})`}
              </span>
            )}
          </h2>
          {!loading && properties.length > 2 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="flex items-center gap-1.5 text-sm font-bold text-[#CA3433] hover:text-[#a52a2a] transition-colors"
            >
              {showAll ? (
                <><Home size={15} /> Show Less</>
              ) : (
                <>View All <ArrowRight size={15} /></>
              )}
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <div className="space-y-3 px-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Home size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Start adding your properties to reach thousands of potential renters.
            </p>
            <Button size="lg" className="rounded-2xl px-8 shadow-xl shadow-brand-500/10" onClick={() => navigate('/landlord/properties/new')}>
              List Your First Property
            </Button>
          </div>

        ) : !showAll ? (
          /* ── PREVIEW: Grid View ── */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {previewProperties.map(p => (
              <div key={p.id} className="relative">
                <PropertyCard property={p} layout="grid" />
                {/* Management Action Bar */}
                <div className="mt-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button 
                      onClick={() => navigate(`/landlord/properties/${p.id}/edit`)}
                      className="text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                    <button
                      disabled={isProcessing || promotingPropertyId === p.id}
                      onClick={() => handlePromoteListing(p)}
                      className="text-[#CA3433] disabled:text-gray-400 hover:text-red-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Rocket size={14} /> {promotingPropertyId === p.id ? 'Loading...' : 'Promote'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : (
          /* ── VIEW ALL: List View ── */
          <div className="grid grid-cols-1 gap-4">
            {displayProperties.map(p => (
              <div 
                key={p.id} 
                className="group bg-white rounded-2xl border border-gray-100 flex gap-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Image Section */}
                <div className="relative w-32 sm:w-40 self-stretch flex-shrink-0 overflow-hidden bg-gray-50 rounded-r-2xl shadow-sm">
                  <img 
                    src={p.images?.[0] || ''} 
                    alt={p.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute top-2 left-2">
                    <TypeBadge type={p.type} />
                  </div>
                </div>
                
                {/* Info & Actions Section */}
                <div className="flex-1 py-3 flex flex-col justify-between min-w-0 pr-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-1 md:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-gray-900 text-base sm:text-lg leading-tight line-clamp-1 mb-1">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-gray-500 font-medium truncate">
                          {p.area}, {p.city}
                        </p>
                        <Badge variant={p.availability ? 'success' : 'danger'} className="uppercase text-[7px] tracking-widest px-1 py-0.5 font-bold leading-none">
                          {p.availability ? 'Available' : 'Rented'}
                        </Badge>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="font-black text-lg text-[#CA3433] leading-none">
                        {formatPriceShort(p.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Eye size={12} className="text-gray-400"/>
                        <span className="text-gray-700">{p.views || 0}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/property/${p.id}`) }}
                        className="text-gray-500 hover:text-gray-900 transition-colors text-xs font-bold flex items-center gap-1.5"
                        title="View"
                      >
                        <Eye size={16} /> <span className="hidden sm:inline">View</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/landlord/properties/${p.id}/edit`) }}
                        className="text-blue-500 hover:text-blue-700 transition-colors text-xs font-bold flex items-center gap-1.5"
                        title="Edit"
                      >
                        <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        disabled={isProcessing || promotingPropertyId === p.id}
                        onClick={(e) => { e.stopPropagation(); handlePromoteListing(p) }}
                        className="text-[#CA3433] disabled:text-gray-400 hover:text-red-700 transition-colors text-xs font-bold flex items-center gap-1.5"
                        title="Promote"
                      >
                        <Rocket size={16} /> <span className="hidden sm:inline">{promotingPropertyId === p.id ? 'Loading...' : 'Promote'}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
