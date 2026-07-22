import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MessageCircle, X, Send, ChevronRight, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { sendMessage, setActiveConversation, markConversationRead, toggleChatWidget } from '../../store/chatSlice'
import { cn } from '../../utils/helpers'

export const ChatWidget = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { conversations, activeConversationId, chatWidgetOpen } = useSelector(s => s.chat)
  const { user } = useSelector(s => s.auth)
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const activeConv = conversations.find(c => c.id === activeConversationId)
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeConv?.messages])

  useEffect(() => {
    if (chatWidgetOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatWidgetOpen, activeConversationId])

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

  const handleViewAll = () => {
    dispatch(toggleChatWidget())
    navigate('/messages')
  }

  if (!user) return null

  if (!chatWidgetOpen) {
    return (
      <button
        onClick={() => dispatch(toggleChatWidget())}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#CA3433] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        <MessageCircle size={24} />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#CA3433] text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
            {totalUnread}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-[#CA3433] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} />
          <span className="font-bold text-sm">{activeConv ? activeConv.participantName : 'Messages'}</span>
        </div>
        <button onClick={() => dispatch(toggleChatWidget())} className="text-white/80 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {!activeConversationId ? (
        <div className="flex-1 max-h-96 overflow-y-auto">
          <div className="p-3 space-y-1">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <div className="relative shrink-0">
                  <img src={conv.participantAvatar} alt="" className="w-10 h-10 rounded-full bg-gray-100" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#CA3433] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm truncate">{conv.participantName}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{new Date(conv.lastMessageTime).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.propertyTitle}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
          <button
            onClick={handleViewAll}
            className="w-full py-3 text-center text-sm font-bold text-[#CA3433] border-t border-gray-100 hover:bg-gray-50 transition-colors"
          >
            View All Messages
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col" style={{ maxHeight: '380px' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {activeConv?.messages.map(msg => {
              const isMe = msg.senderId === user?.id || msg.senderId === 'dummy-user-123'
              return (
                <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[80%] px-3 py-2 rounded-2xl text-sm',
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

          <div className="border-t border-gray-100 p-3 flex items-center gap-2 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433]"
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim()}
              className="w-9 h-9 bg-[#CA3433] text-white rounded-full flex items-center justify-center hover:bg-[#ac2d2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
