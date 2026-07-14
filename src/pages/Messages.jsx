import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Send, MessageSquare, ArrowLeft, Building, User } from 'lucide-react'
import { useMessages } from '../hooks/useMessages'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const Messages = () => {
  const { user } = useSelector(s => s.auth)
  const { conversations, loadingConversations, fetchConversations, fetchMessages, sendMessage } = useMessages()
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialConvId = searchParams.get('id')

  const [activeConvId, setActiveConvId] = useState(initialConvId || null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)

  // 1. Initial Load: Fetch conversations
  useEffect(() => {
    fetchConversations().then((data) => {
      // If there's an initial ID from search params, activate it
      if (initialConvId) {
        setActiveConvId(initialConvId)
      } else if (data && data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id)
      }
    })
  }, [fetchConversations, initialConvId])

  // 2. Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return
    setLoadingMessages(true)
    fetchMessages(activeConvId).then((data) => {
      setMessages(data)
      setLoadingMessages(false)
      scrollToBottom()
    })
  }, [activeConvId, fetchMessages])

  // 3. Setup real-time listener for new messages
  useEffect(() => {
    if (!activeConvId) return

    const channel = supabase
      .channel(`messages_room_${activeConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConvId}`
        },
        (payload) => {
          setMessages(prev => {
            // Prevent duplicates
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
          setTimeout(scrollToBottom, 50)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConvId])

  // 4. Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 5. Send message
  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || sending || !activeConvId) return
    setSending(true)
    const text = inputText
    setInputText('')
    try {
      const msg = await sendMessage(activeConvId, text)
      // Append manually for instant response, subscription handles the rest
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      setTimeout(scrollToBottom, 50)
    } catch (e) {
      console.error('Failed to send message:', e)
    } finally {
      setSending(false)
    }
  }

  const activeConv = conversations.find(c => c.id === activeConvId)
  
  // Helper to determine the participant info (the person the current user is chatting with)
  const getParticipantInfo = (conv) => {
    if (!conv) return { name: 'Chat', avatar: null }
    const isTenant = user?.id === conv.tenant_id
    const profile = isTenant ? conv.landlord : conv.tenant
    return {
      name: profile?.full_name || 'User',
      avatar: profile?.avatar_url,
      role: isTenant ? 'Landlord' : 'Tenant'
    }
  }

  const activeParticipant = getParticipantInfo(activeConv)

  return (
    <div className="pt-4 pb-20 bg-gray-50 min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col h-[calc(100vh-10rem)]">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">Messages</h1>
            <p className="text-gray-500 mt-1">Connect directly with landlords and tenants.</p>
          </div>
        </div>

        {/* Messaging Container */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl flex-1 flex overflow-hidden">
          
          {/* Left Pane: Conversations List */}
          <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col ${activeConvId && 'hidden md:flex'}`}>
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 font-display">Active Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loadingConversations && conversations.length === 0 ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-12 h-12 bg-gray-100 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2 mt-1">
                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <MessageSquare className="mx-auto mb-3 opacity-50" size={32} />
                  <p className="text-sm font-medium">No messages yet.</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const part = getParticipantInfo(conv)
                  const isActive = conv.id === activeConvId
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full p-4 flex gap-3 text-left transition-colors ${isActive ? 'bg-red-50/50 border-l-4 border-[#CA3433]' : 'hover:bg-gray-50'}`}
                    >
                      {part.avatar ? (
                        <img src={part.avatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 border border-gray-200">
                          <User size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start mb-0.5">
                          <h3 className="font-bold text-sm text-gray-900 truncate">{part.name}</h3>
                          <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded uppercase">
                            {part.role}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                          <Building size={12} className="shrink-0" /> {conv.property?.title}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Pane: Chat Window */}
          <div className={`flex-1 flex flex-col bg-white ${!activeConvId && 'hidden md:flex'}`}>
            {activeConvId && activeConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setActiveConvId(null)} className="md:hidden text-gray-500 hover:text-gray-900 active:scale-95 transition-transform p-1">
                    <ArrowLeft size={20} />
                  </button>
                  {activeParticipant.avatar ? (
                    <img src={activeParticipant.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                      <User size={18} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900 truncate">{activeParticipant.name}</h2>
                    <p onClick={() => navigate(`/property/${activeConv.property?.id}`)} className="text-xs text-[#CA3433] hover:underline font-bold flex items-center gap-1 cursor-pointer w-fit mt-0.5">
                      <Building size={12} /> {activeConv.property?.title}
                    </p>
                  </div>
                </div>

                {/* Message Log */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => (
                        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''} animate-pulse`}>
                          <div className="h-10 bg-gray-100 rounded-2xl w-48" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <p className="text-sm font-medium">Say hello to start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm
                            ${isMe ? 'bg-[#CA3433] text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
                          `}>
                            <p className="leading-relaxed break-words">{msg.message_text}</p>
                            <span className={`block text-[9px] mt-1 text-right ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" disabled={sending || !inputText.trim()} className="bg-[#CA3433] hover:bg-[#ac2d2c] text-white w-12 h-10 p-0 flex items-center justify-center rounded-xl shrink-0">
                    <Send size={16} />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                <MessageSquare size={48} className="opacity-50 mb-3" />
                <p className="font-medium">Select an active chat to start messaging.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
