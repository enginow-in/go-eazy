import React, { useState, useEffect } from 'react'
import { X, Handshake, CheckCircle2, XCircle } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { proposePrice, respondToNegotiation, fetchNegotiation, setNegotiation } from '../../store/negotiationSlice'
import { supabase } from '../../lib/supabase'

export default function NegotiationModal({ isOpen, onClose, property, user }) {
  const dispatch = useDispatch()
  const { currentNegotiation, loading } = useSelector(state => state.negotiation)
  const [price, setPrice] = useState(property?.price || '')
  
  const isLandlord = user?.id === property?.landlord_id
  const tenantId = isLandlord ? currentNegotiation?.tenant_id : user?.id

  useEffect(() => {
    if (isOpen && property && tenantId) {
      dispatch(fetchNegotiation({ 
        propertyId: property.id, 
        tenantId, 
        landlordId: property.landlord_id 
      }))
    }
  }, [isOpen, property, tenantId, dispatch])

  useEffect(() => {
    if (!isOpen || !property) return

    const channel = supabase.channel(`negotiations:${property.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'negotiations',
        filter: `property_id=eq.${property.id}`
      }, payload => {
        // If it belongs to this tenant/landlord interaction
        if (payload.new.tenant_id === tenantId && payload.new.landlord_id === property.landlord_id) {
          dispatch(setNegotiation(payload.new))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOpen, property, tenantId, dispatch])

  if (!isOpen) return null

  const isMyTurn = !currentNegotiation || currentNegotiation.last_actor_id !== user?.id
  const isFinished = currentNegotiation?.status === 'accepted' || currentNegotiation?.status === 'rejected'

  const handlePropose = () => {
    if (!price || isNaN(price)) return
    if (!currentNegotiation) {
      dispatch(proposePrice({
        propertyId: property.id,
        tenantId: user.id,
        landlordId: property.landlord_id,
        price: Number(price)
      }))
    } else {
      dispatch(respondToNegotiation({
        id: currentNegotiation.id,
        action: 'counter',
        price: Number(price),
        actorId: user.id
      }))
    }
  }

  const handleAccept = () => {
    dispatch(respondToNegotiation({
      id: currentNegotiation.id,
      action: 'accept',
      actorId: user.id
    }))
  }

  const handleReject = () => {
    dispatch(respondToNegotiation({
      id: currentNegotiation.id,
      action: 'reject',
      actorId: user.id
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Handshake className="text-[#CA3433]" />
            Live Negotiation
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-gray-50/50">
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium">Original Price</p>
            <p className="text-2xl font-black text-gray-900">₹{property?.price?.toLocaleString()}</p>
          </div>

          {currentNegotiation && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                Current {currentNegotiation.status === 'proposed' ? 'Offer' : 'Counter-Offer'}
              </p>
              <p className="text-3xl font-black text-[#CA3433]">
                ₹{Number(currentNegotiation.current_price).toLocaleString()}
              </p>
              
              {!isMyTurn && !isFinished && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600 font-medium bg-amber-50 py-2 px-4 rounded-full">
                  <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                  Waiting for {isLandlord ? 'tenant' : 'landlord'} to respond...
                </div>
              )}
            </div>
          )}

          {currentNegotiation?.status === 'accepted' && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 size={24} className="text-green-600" />
              <div>
                <p className="font-bold">Deal Accepted!</p>
                <p className="text-sm">You have successfully negotiated the price.</p>
              </div>
            </div>
          )}

          {currentNegotiation?.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
              <XCircle size={24} className="text-red-600" />
              <div>
                <p className="font-bold">Offer Rejected</p>
                <p className="text-sm">The negotiation has been closed.</p>
              </div>
            </div>
          )}

          {isMyTurn && !isFinished && (
            <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {currentNegotiation ? 'Your Counter-Offer' : 'Your Proposed Price'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433] focus:border-transparent outline-none font-bold text-lg"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={handlePropose}
                  disabled={loading || !price}
                  className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : (currentNegotiation ? 'Send Counter-Offer' : 'Submit Proposal')}
                </button>
                
                {currentNegotiation && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={handleAccept}
                      disabled={loading}
                      className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="w-full bg-red-100 text-red-700 font-bold py-3 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
