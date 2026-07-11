import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useServices } from '../hooks/useServices'
import { LogOut, ShieldAlert, ShieldCheck, Activity, Users, Building, AlertTriangle, FileText, CheckCircle, XCircle, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import toast from 'react-hot-toast'

export const SystemAdmin = () => {
  const { user, role, loading, signInWithGoogle, signOut } = useAuth()
  const { getAdminPendingServices, updateServiceStatus } = useServices()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({ users: 0, properties: 0, services: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  // Service Approvals State
  const [providers, setProviders] = useState([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showApprovals, setShowApprovals] = useState(false)

  // Property Verifications State
  const [flaggedProperties, setFlaggedProperties] = useState([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [showProperties, setShowProperties] = useState(false)
  const [propToConfirm, setPropToConfirm] = useState(null)


  useEffect(() => {
    // Only load stats if authorized
    if (user && role === 'admin') {
      loadStats()
      loadProviders()
      loadFlaggedProperties()
    }
  }, [user, role, loadStats, loadProviders, loadFlaggedProperties])

  const loadStats = React.useCallback(async () => {
    try {
      const [uRes, pRes, sRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('service_providers').select('*', { count: 'exact', head: true })
      ])
      
      setStats({
        users: uRes.count || 0,
        properties: pRes.count || 0,
        services: sRes.count || 0
      })
    } catch (e) {
      console.error('Error loading admin stats:', e)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadProviders = React.useCallback(async () => {
    try {
      const data = await getAdminPendingServices()
      setProviders(data)
    } catch (e) {
      console.error('Failed to load pending services', e)
    } finally {
      setLoadingProviders(false)
    }
  }, [getAdminPendingServices])

  const loadFlaggedProperties = React.useCallback(async () => {
    try {
      const { data, error } = await supabase.from('properties')
        .select(`*, profiles:landlord_id(full_name, email)`)
        .eq('verification_status', 'flagged')
        .order('created_at', { ascending: false })
      if (error) throw error
      setFlaggedProperties(data || [])
    } catch (e) {
      console.error('Failed to load flagged properties', e)
    } finally {
      setLoadingProperties(false)
    }
  }, [])

  const handleAction = async (id, newStatus) => {
    const toastId = toast.loading(`Marking as ${newStatus}...`)
    try {
      await updateServiceStatus(id, newStatus)
      setProviders(prev => prev.map(p => p.id === id ? { ...p, verification_status: newStatus } : p))
      toast.success(`Service Provider ${newStatus}`, { id: toastId })
    } catch {
      toast.error('Failed to update status', { id: toastId })
    }
  }

  const handlePropertyAction = async (id, newStatus) => {
    const toastId = toast.loading(`Marking as ${newStatus}...`)
    try {
      const { error } = await supabase.from('properties').update({ verification_status: newStatus }).eq('id', id)
      if (error) throw error
      setFlaggedProperties(prev => prev.filter(p => p.id !== id))
      toast.success(`Property ${newStatus}`, { id: toastId })
      if (propToConfirm) setPropToConfirm(null)
    } catch {
      toast.error('Failed to update status', { id: toastId })
    }
  }

  const handleGoogleLogin = async () => {
    // Set the return path so they land back here after Google auth
    localStorage.setItem('sb_return_to', '/systemadmin')
    await signInWithGoogle()
  }

  // Still checking session loading from auth slice
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // 1. Not Logged In -> Show Admin Google Login
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-100 rounded-3xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full border border-red-100 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} className="text-[#CA3433]" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight font-display">System Admin</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Authorized personnel only. Please sign in with the master administrator account to view the dashboard.</p>
          
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-900 font-bold py-3.5 px-4 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  // 2. Logged in, but WRONG EMAIL -> Access Denied!
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Warning Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <ShieldAlert size={800} className="text-red-600" />
        </div>
        
        <div className="max-w-md w-full bg-white border border-red-100 rounded-3xl p-8 relative z-10 text-center shadow-[0_8px_30px_rgb(202,52,51,0.08)]">
          <div className="w-20 h-20 bg-red-50 rounded-full border border-red-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-red-600 mb-3 font-display">ACCESS DENIED</h1>
          <p className="text-gray-600 mb-8 text-sm leading-relaxed">
            The account <strong className="text-gray-900 bg-gray-100 px-2 py-1 rounded mx-1">{user.email}</strong> does not have administrator privileges.
          </p>
          
          <button
            onClick={async () => { await signOut(); navigate('/systemadmin'); }}
            className="w-full py-3.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <LogOut size={18} /> Sign Out
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 py-3.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-bold transition-all active:scale-95"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    )
  }

  // 3. SECURE ADMIN DASHBOARD (SUCCESS)
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-gray-900">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 sticky top-0 backdrop-blur-xl z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-[#CA3433]" size={24} />
          <span className="font-bold tracking-widest uppercase text-sm text-gray-900">GoEazy<span className="text-[#CA3433]">_Admin</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 font-medium tracking-wide">Secure Session</p>
            <p className="text-sm font-bold text-gray-900">{user.email}</p>
          </div>
          <button 
            onClick={async () => { await signOut(); navigate('/'); }}
            className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-all"
            title="Secure Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 lg:p-10 space-y-10">
        
        {/* Welcome & Stats Section (Hidden when managing list) */}
        {!showApprovals && !showProperties && (
          <>
            <div>
              <h1 className="text-3xl font-extrabold font-display">System Overview</h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse outline outline-2 outline-green-100"></span>
                All systems nominal. You have database access.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-6">
              <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-3 md:p-6 relative overflow-hidden group hover:border-[#CA3433]/30 transition-colors shadow-sm flex flex-col items-center md:items-start text-center md:text-left">
                <div className="hidden md:block absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <Users size={80} className="text-gray-900" />
                </div>
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-2 md:mb-4">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <p className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5 md:mb-1">Total Users</p>
                {loadingStats ? <Skeleton variant="stat-block" className="h-6 md:h-10 w-12 md:w-24" /> : 
                  <p className="text-xl md:text-4xl font-black text-gray-900">{stats.users}</p>}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-3 md:p-6 relative overflow-hidden group hover:border-[#CA3433]/30 transition-colors shadow-sm flex flex-col items-center md:items-start text-center md:text-left">
                <div className="hidden md:block absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <Building size={80} className="text-gray-900" />
                </div>
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-2 md:mb-4">
                  <Building className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <p className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5 md:mb-1">Properties</p>
                {loadingStats ? <Skeleton variant="stat-block" className="h-6 md:h-10 w-12 md:w-24" /> : 
                  <p className="text-xl md:text-4xl font-black text-gray-900">{stats.properties}</p>}
              </div>

              <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-3 md:p-6 relative overflow-hidden group hover:border-[#CA3433]/30 transition-colors shadow-sm flex flex-col items-center md:items-start text-center md:text-left">
                <div className="hidden md:block absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <Activity size={80} className="text-gray-900" />
                </div>
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-2 md:mb-4">
                  <Activity className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <p className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5 md:mb-1">Providers</p>
                {loadingStats ? <Skeleton variant="stat-block" className="h-6 md:h-10 w-12 md:w-24" /> : 
                  <p className="text-xl md:text-4xl font-black text-gray-900">{stats.services}</p>}
              </div>
            </div>
          </>
        )}

        {/* ── APPROVAL WORKFLOW ── */}
        {!showProperties && (
        <div>
          {!showApprovals ? (
            <div 
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#CA3433]/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              onClick={() => setShowApprovals(true)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-50 text-[#CA3433] rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-display text-gray-900">Provider Approvals</h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                     {loadingProviders ? 'Loading pending requests...' : `Manage ${providers.length} service provider listings`}
                  </p>
                </div>
              </div>
              <Button variant="primary" className="shrink-0 bg-gray-900 hover:bg-black group-hover:bg-[#CA3433] transition-colors border-none">
                Open Management <span className="ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
              </Button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold font-display text-gray-900">Provider Approvals <span className="text-[#CA3433] text-lg ml-2">({providers.length})</span></h2>
                <button onClick={() => setShowApprovals(false)} className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1.5 active:scale-95">
                  <XCircle size={16} /> Close
                </button>
              </div>
              
              {loadingProviders ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-40 bg-white border border-gray-100 shadow-sm animate-pulse rounded-2xl" />)}
                </div>
              ) : providers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                  <CheckCircle className="mx-auto text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium">All caught up! No service providers waiting for approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {providers.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col md:flex-row group relative">
                      
                      {/* Left: Icon/Status */}
                      <div className="p-4 md:w-48 bg-gray-50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 shrink-0">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
                          {p.category === 'tiffin' ? '🍱' : p.category === 'laundry' ? '🧺' : '🧹'}
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                          ${p.verification_status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                          ${p.verification_status === 'verified' ? 'bg-green-100 text-green-700' : ''}
                          ${p.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                        `}>
                          {p.verification_status}
                        </span>
                      </div>

                      {/* Middle: Details */}
                      <div className="p-5 flex-1 md:pl-8">
                        <div className="flex flex-col md:flex-row md:justify-between items-start mb-2 gap-2">
                           <div>
                             <h3 className="font-bold text-xl text-gray-900 leading-tight">{p.name}</h3>
                             <p className="text-sm text-gray-500 font-medium mt-1">{p.area}, {p.city}</p>
                           </div>
                           <div className="md:text-right bg-gray-50 md:bg-transparent p-2 md:p-0 rounded-lg w-full md:w-auto mt-2 md:mt-0">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:block">Fee Status</p>
                              <p className={`text-sm ${p.payment_status === 'paid' ? 'text-green-600 font-bold' : 'text-amber-500 font-bold'}`}>
                                {p.payment_status?.toUpperCase() || 'UNPAID'} LISTING
                              </p>
                           </div>
                        </div>

                        <div className="flex flex-col md:flex-row flex-wrap gap-x-8 gap-y-2 text-sm text-gray-600 md:mt-6 mb-2">
                           <p className="flex flex-col shrink-0"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Owner</span> <strong className="text-gray-900">{p.profiles?.full_name}</strong></p>
                           <p className="flex flex-col min-w-0"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</span> <strong className="text-gray-900 truncate">{p.profiles?.email}</strong></p>
                           <p className="flex flex-col shrink-0"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Category</span> <strong className="text-gray-900 capitalize">{p.category}</strong></p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="p-4 bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-100 flex flex-row md:flex-col gap-2 shrink-0 md:w-44 items-center justify-center">
                        <button 
                          onClick={() => handleAction(p.id, 'verified')} disabled={p.verification_status === 'verified'}
                          className="flex-1 md:flex-none w-full py-2.5 px-4 text-xs font-bold tracking-wider uppercase bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors shadow-[0_2px_10px_rgb(34,197,94,0.2)] hover:shadow-[0_4px_12px_rgb(34,197,94,0.3)]"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(p.id, 'rejected')} disabled={p.verification_status === 'rejected'}
                          className="flex-1 md:flex-none w-full py-2.5 px-4 text-xs font-bold tracking-wider uppercase bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:text-red-700 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                        {p.documents?.length > 0 && (
                          <button onClick={() => setSelectedDoc(p.documents[0])} className="flex-none basis-[30%] md:w-full py-2.5 px-2 md:px-4 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                            <FileText size={14} className="md:mr-1 shrink-0" /> <span className="hidden md:inline">Docs</span>
                          </button>
                        )}
                      </div>
                      
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* ── FLAGGED PROPERTIES WORKFLOW ── */}
        {!showApprovals && (
        <div>
          {!showProperties ? (
            <div 
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#CA3433]/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group mt-6"
              onClick={() => setShowProperties(true)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-50 text-[#CA3433] rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-display text-gray-900">Flagged Properties</h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                     {loadingProperties ? 'Loading flagged properties...' : `Review ${flaggedProperties.length} flagged property listings`}
                  </p>
                </div>
              </div>
              <Button variant="primary" className="shrink-0 bg-gray-900 hover:bg-black group-hover:bg-[#CA3433] transition-colors border-none">
                Open Reviews <span className="ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
              </Button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold font-display text-gray-900">Flagged Properties <span className="text-[#CA3433] text-lg ml-2">({flaggedProperties.length})</span></h2>
                <button onClick={() => setShowProperties(false)} className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1.5 active:scale-95">
                  <XCircle size={16} /> Close
                </button>
              </div>
              
              {loadingProperties ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-40 bg-white border border-gray-100 shadow-sm animate-pulse rounded-2xl" />)}
                </div>
              ) : flaggedProperties.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300">
                  <ShieldCheck className="mx-auto text-emerald-400 mb-3" size={40} />
                  <p className="text-gray-500 font-medium">All clean! No flagged properties.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedProperties.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col md:flex-row group relative">
                      
                      {/* Left: Image */}
                      <div className="w-full md:w-48 h-48 md:h-auto bg-gray-50 flex shrink-0">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                            <Building size={32} />
                          </div>
                        )}
                      </div>

                      {/* Middle: Details */}
                      <div className="p-5 flex-1 md:pl-6">
                        <div className="flex flex-col md:flex-row md:justify-between items-start mb-2 gap-2">
                           <div>
                             <h3 className="font-bold text-xl text-gray-900 leading-tight flex items-center gap-2">
                               {p.title}
                               <a href={`/property/${p.id}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                                 <Eye size={16} />
                               </a>
                             </h3>
                             <p className="text-sm text-gray-500 font-medium mt-1">{p.area}, {p.city}</p>
                           </div>
                           <div className="md:text-right bg-red-50 p-2 rounded-lg w-full md:w-auto mt-2 md:mt-0 border border-red-100">
                              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Trust Score</p>
                              <p className="text-xl font-black text-red-700">
                                {p.verification_score || 0}/100
                              </p>
                           </div>
                        </div>

                        <div className="text-sm text-gray-600 line-clamp-2 my-2 italic border-l-2 border-gray-200 pl-3">
                          "{p.description}"
                        </div>

                        <div className="flex flex-col md:flex-row flex-wrap gap-x-8 gap-y-2 text-sm text-gray-600 mt-4 mb-2">
                           <p className="flex flex-col shrink-0"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Landlord</span> <strong className="text-gray-900">{p.profiles?.full_name}</strong></p>
                           <p className="flex flex-col min-w-0"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</span> <strong className="text-gray-900 truncate">{p.profiles?.email}</strong></p>
                           <p className="flex flex-col shrink-0"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Rent</span> <strong className="text-gray-900">₹{p.price}</strong></p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="p-4 bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-100 flex flex-row md:flex-col gap-2 shrink-0 md:w-44 items-center justify-center">
                        <button 
                          onClick={() => handlePropertyAction(p.id, 'verified')}
                          className="flex-1 md:flex-none w-full py-2.5 px-4 text-xs font-bold tracking-wider uppercase bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-[0_2px_10px_rgb(34,197,94,0.2)] hover:shadow-[0_4px_12px_rgb(34,197,94,0.3)] flex items-center justify-center gap-2"
                        >
                          <ShieldCheck size={14} /> Verify
                        </button>
                        <button 
                          onClick={() => setPropToConfirm(p)}
                          className="flex-1 md:flex-none w-full py-2.5 px-4 text-xs font-bold tracking-wider uppercase bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:text-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                      
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Document Modal */}
        <Modal open={!!selectedDoc} onClose={() => setSelectedDoc(null)} size="lg" className="bg-white">
          <div className="p-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 font-display">Document Viewer</h3>
            </div>
            {selectedDoc && (
              <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center min-h-[400px]">
                {selectedDoc.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={selectedDoc} className="w-full h-[60vh] rounded-xl" title="Document" />
                ) : (
                  <img src={selectedDoc} alt="Document" className="max-w-full max-h-[70vh] object-contain" />
                )}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setSelectedDoc(null)} variant="secondary" className="font-bold">Close Viewer</Button>
            </div>
          </div>
        </Modal>

        {/* Rejection Confirmation Modal */}
        <Modal open={!!propToConfirm} onClose={() => setPropToConfirm(null)} size="md" className="bg-white p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 font-display">Reject Property?</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Are you sure you want to reject and soft-delete <strong>{propToConfirm?.title}</strong>? 
              This will hide it from the platform. The landlord will need to edit and fix the listing to resubmit.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setPropToConfirm(null)} variant="secondary" className="flex-1 font-bold">Cancel</Button>
              <Button onClick={() => handlePropertyAction(propToConfirm.id, 'rejected')} variant="primary" className="flex-1 bg-red-600 hover:bg-red-700 border-none font-bold">Yes, Reject</Button>
            </div>
          </div>
        </Modal>

        {/* Database Warning */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex flex-shrink-0 items-center justify-center">
              <ShieldAlert className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Restricted Root Zone</h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
                You are viewing real production data. Direct database modifications from this panel are logged. 
                For deeper manipulation like adding new tables or managing strict security roles, kindly use the direct Supabase Admin Dashboard.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
