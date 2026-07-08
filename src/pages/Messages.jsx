import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { MessageSquare, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ChatWindow } from '../components/chat/ChatWindow'

export default function Messages() {
  const { user } = useSelector(state => state.auth)
  const [searchParams] = useSearchParams()
  const landlordId = searchParams.get('landlord_id')
  
  const [conversants, setConversants] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(landlordId || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      setLoading(true)
      // Get all messages for this user to find unique conversants
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (msgs && msgs.length > 0) {
        // Extract unique IDs that aren't the current user
        const idSet = new Set()
        msgs.forEach(m => {
          if (m.sender_id !== user.id) idSet.add(m.sender_id)
          if (m.receiver_id !== user.id) idSet.add(m.receiver_id)
        })

        const ids = Array.from(idSet)
        
        if (landlordId && !idSet.has(landlordId)) {
          ids.push(landlordId)
        }
        
        if (ids.length > 0) {
          // Fetch profiles for these IDs
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .in('id', ids)
          
          if (profiles) {
            setConversants(profiles)
          }
        }
      } else if (landlordId) {
        // No previous messages, but we want to start a chat
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', landlordId)
        if (profiles) setConversants(profiles)
      }
      setLoading(false)
    }

    loadConversations()
  }, [user])

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 min-h-[calc(100vh-80px)]">
        <MessageSquare size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Sign in to view messages</h2>
        <p className="text-gray-500 mt-2 text-center max-w-sm">Please sign in or create an account to securely chat with landlords and tenants.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-gray-50 p-4 gap-4 max-w-7xl mx-auto w-full">
      
      {/* Sidebar */}
      <div className="w-full md:w-80 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-[calc(100vh-120px)]">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={18} className="text-brand-600" />
            Conversations
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
          ) : conversants.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 flex flex-col items-center">
              <Users size={32} className="mb-3 opacity-20" />
              No conversations yet. You can message a landlord from their property listing page.
            </div>
          ) : (
            conversants.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedUserId(c.id)}
                className={`w-full flex items-center gap-3 p-4 border-b border-gray-50 transition-colors text-left ${selectedUserId === c.id ? 'bg-brand-50 border-brand-100' : 'hover:bg-gray-50'}`}
              >
                <img src={c.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg'} alt="avatar" className="w-10 h-10 rounded-full border border-gray-200 bg-white" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm truncate">{c.full_name}</div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider">{c.role || 'User'}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-[calc(100vh-120px)]">
        {selectedUserId ? (
          <ChatWindow targetUserId={selectedUserId} />
        ) : (
          <div className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Your secure messages</h3>
            <p className="text-sm">Select a conversation from the sidebar to view your end-to-end encrypted chat.</p>
          </div>
        )}
      </div>

    </div>
  )
}
