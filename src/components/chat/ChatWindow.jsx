import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Send, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { encryptMessage, decryptMessage, importPublicKey, getLocalPrivateKey } from '../../utils/crypto'
import { cn } from '../../utils/helpers'

export const ChatWindow = ({ targetUserId, propertyId }) => {
  const { user, profile } = useSelector(state => state.auth)
  const [targetProfile, setTargetProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [cryptoError, setCryptoError] = useState(null)
  
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 1. Fetch target user profile and initial messages
  useEffect(() => {
    if (!user || !targetUserId) return

    const initChat = async () => {
      setLoading(true)
      setCryptoError(null)
      try {
        // Fetch target profile (to get their public key)
        const { data: tp } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, public_key')
          .eq('id', targetUserId)
          .single()
        
        if (tp) setTargetProfile(tp)

        // Fetch messages
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })

        if (msgs) {
          const decrypted = await decryptMessages(msgs)
          setMessages(decrypted)
        }
      } catch (err) {
        console.error('Chat init error:', err)
      }
      setLoading(false)
    }

    initChat()

    // Realtime subscription
    const channel = supabase
      .channel(`chat_${user.id}_${targetUserId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, async (payload) => {
        // Only process if it's from the target user
        if (payload.new.sender_id === targetUserId) {
          const decryptedMsg = await decryptMessages([payload.new])
          if (decryptedMsg.length > 0) {
            setMessages(prev => [...prev, decryptedMsg[0]])
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, targetUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Helper to decrypt an array of message rows
  const decryptMessages = async (rawMessages) => {
    try {
      const privateKey = await getLocalPrivateKey(user.id)
      if (!privateKey) throw new Error("Local private key not found on this device.")

      const decryptedMsgs = []
      for (const msg of rawMessages) {
        try {
          const isSender = msg.sender_id === user.id
          const blobToDecrypt = isSender ? msg.sender_encrypted_content : msg.receiver_encrypted_content
          
          if (!blobToDecrypt) continue

          const plaintext = await decryptMessage(blobToDecrypt, privateKey)
          decryptedMsgs.push({
            ...msg,
            plaintext
          })
        } catch (decErr) {
          console.error("Could not decrypt a message blob:", decErr)
          decryptedMsgs.push({
            ...msg,
            plaintext: '🔒 [Decryption Failed]'
          })
        }
      }
      return decryptedMsgs
    } catch (err) {
      setCryptoError(err.message)
      return []
    }
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || sending) return

    if (!targetProfile?.public_key || !profile?.public_key) {
      setCryptoError('Cannot send message: Missing encryption keys. Ensure both users have logged in at least once after the update, and that your database migration has been pushed.')
      return
    }

    setSending(true)
    setCryptoError(null)
    const plaintext = input.trim()
    setInput('')

    try {
      // Import public keys
      const receiverPubKey = await importPublicKey(targetProfile.public_key)
      const senderPubKey = await importPublicKey(profile.public_key)

      // Encrypt twice: once for receiver, once for sender (so we can read our own history)
      const receiverEncrypted = await encryptMessage(plaintext, receiverPubKey)
      const senderEncrypted = await encryptMessage(plaintext, senderPubKey)

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          property_id: propertyId || null,
          sender_encrypted_content: senderEncrypted,
          receiver_encrypted_content: receiverEncrypted
        })
        .select()
        .single()

      if (error) throw error

      // Optimistically add to UI
      const newMsg = { ...data, plaintext }
      setMessages(prev => [...prev, newMsg])

    } catch (err) {
      console.error('Send error:', err)
      setCryptoError('Failed to send encrypted message.')
    }
    setSending(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
        <img src={targetProfile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg'} alt="avatar" className="w-10 h-10 rounded-full bg-white border border-gray-200" />
        <div>
          <h3 className="font-bold text-gray-900">{targetProfile?.full_name || 'Loading...'}</h3>
          <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium uppercase tracking-wider">
            <Lock size={10} /> End-to-End Encrypted
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fcfcfc]">
        {cryptoError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {cryptoError}
          </div>
        )}
        
        {messages.length === 0 && !cryptoError && (
          <div className="text-center text-gray-400 mt-10 text-sm">
            <Lock size={32} className="mx-auto mb-2 opacity-20" />
            <p>Messages are end-to-end encrypted.</p>
            <p>Nobody outside of this chat, not even GoEazy, can read them.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={cn(
                  "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                  isMe 
                    ? "bg-brand-600 text-white rounded-br-sm" 
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                )}
              >
                {msg.plaintext}
                <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-brand-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 bg-white">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type an encrypted message..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all pr-12"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  )
}
