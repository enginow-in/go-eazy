import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Send, Phone, Mail, MessageCircle, 
  ChevronRight, Trash2 
} from 'lucide-react'
import { sendMessage, setActiveConversation, markConversationRead } from '../store/chatSlice'
import { cn } from '../utils/helpers'

export const Messages = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { conversations, activeConversationId } = useSelector(s => s.chat)
  const { user } = useSelector(s => s.auth)
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const activeConv = conversations.find(c => c.id === activeConversationId)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeConv?.messages])

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [activeConversationId])

  const handleSend = () => {
    if (!messageText.trim() || !activeConversationId) return
    dispatch(sendMessage({
      conversationId: activeConversationId,
      text: messageText.trim(),
      senderId: user?.id || 'dummy-user-123',
    }))
    setMessageText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSelectConversation = (convId) => {
    dispatch(setActiveConversation(convId))
    dispatch(markConversationRead(convId))
  }

  return (
    <div className="pt-4 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 font-display">Messages</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row" style={{ minHeight: '500px' }}>
            {/* Conversation List */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-100">
              <div className="p-3 border-b border-gray-50">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Conversations</h2>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '450px' }}>
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-xs mt-1">Contact a landlord to start chatting</p>
                  </div>
                ) : conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 transition-colors text-left border-b border-gray-50 last:border-0',
                      activeConversationId === conv.id ? 'bg-[#fff5f5]' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="relative shrink-0">
                      <img src={conv.participantAvatar} alt="" className="w-12 h-12 rounded-full bg-gray-100" />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#CA3433] text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-sm truncate">{conv.participantName}</span>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                          {new Date(conv.lastMessageTime).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{conv.propertyTitle}</p>
                      <p className={cn(
                        'text-xs truncate mt-0.5',
                        conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-400'
                      )}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            {activeConv ? (
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <img src={activeConv.participantAvatar} alt="" className="w-10 h-10 rounded-full bg-gray-100" />
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{activeConv.participantName}</h3>
                      <p className="text-[11px] text-gray-500">{activeConv.propertyTitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/property/${activeConv.propertyId}`)}
                    className="text-xs font-bold text-[#CA3433] hover:underline"
                  >
                    View Property
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ maxHeight: '350px' }}>
                  {activeConv.messages.map(msg => {
                    const isMe = msg.senderId === user?.id || msg.senderId === 'dummy-user-123'
                    return (
                      <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm',
                          isMe ? 'bg-[#CA3433] text-white rounded-br-md' : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm'
                        )}>
                          <p className="leading-relaxed">{msg.text}</p>
                          <p className={cn('text-[10px] mt-1', isMe ? 'text-white/70' : 'text-gray-400')}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-gray-100 p-4 flex items-center gap-3 bg-white">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    className="w-11 h-11 bg-[#CA3433] text-white rounded-full flex items-center justify-center hover:bg-[#ac2d2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-[#CA3433]/20"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50/50">
                <div className="text-center text-gray-400">
                  <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-gray-500">Select a conversation</p>
                  <p className="text-sm mt-1">Choose a chat from the left to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
