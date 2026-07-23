import { useState, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { supabase } from '../lib/supabase'

export const useMessages = () => {
  const { user } = useSelector(s => s.auth)
  const [conversations, setConversations] = useState([])
  const [loadingConversations, setLoadingConversations] = useState(false)

  const fetchConversations = useCallback(async () => {
    if (!user) return []
    setLoadingConversations(true)
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          property:properties(id, title, images, city),
          tenant:profiles!tenant_id(id, full_name, avatar_url),
          landlord:profiles!landlord_id(id, full_name, avatar_url)
        `)
        .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
      return data || []
    } catch (e) {
      console.error('Error fetching conversations:', e)
      return []
    } finally {
      setLoadingConversations(false)
    }
  }, [user])

  const getOrCreateConversation = useCallback(async (propertyId, landlordId) => {
    if (!user) throw new Error('Not authenticated')
    try {
      // 1. Try to find existing conversation
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('property_id', propertyId)
        .eq('tenant_id', user.id)
        .eq('landlord_id', landlordId)
        .maybeSingle()

      if (findError) throw findError
      if (existing) return existing

      // 2. Create new if not found
      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert({
          property_id: propertyId,
          tenant_id: user.id,
          landlord_id: landlordId
        })
        .select()
        .single()

      if (createError) throw createError
      return created
    } catch (e) {
      console.error('Error in getOrCreateConversation:', e)
      throw e
    }
  }, [user])

  const getOrCreateRoommateConversation = useCallback(async (otherUserId) => {
    if (!user) throw new Error('Not authenticated')
    try {
      // 1. Try to find existing roommate conversation (property_id is null)
      // Since it's peer-to-peer, tenant_id and landlord_id are interchangeable.
      // We will check for both combinations.
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .is('property_id', null)
        .or(`and(tenant_id.eq.${user.id},landlord_id.eq.${otherUserId}),and(tenant_id.eq.${otherUserId},landlord_id.eq.${user.id})`)
        .maybeSingle()

      if (findError) throw findError
      if (existing) return existing

      // 2. Create new if not found
      const { data: created, error: createError } = await supabase
        .from('conversations')
        .insert({
          property_id: null,
          tenant_id: user.id,
          landlord_id: otherUserId
        })
        .select()
        .single()

      if (createError) throw createError
      return created
    } catch (e) {
      console.error('Error in getOrCreateRoommateConversation:', e)
      throw e
    }
  }, [user])

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (e) {
      console.error('Error fetching messages:', e)
      return []
    }
  }, [])

  const sendMessage = useCallback(async (conversationId, text) => {
    if (!user) throw new Error('Not authenticated')
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message_text: text
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (e) {
      console.error('Error sending message:', e)
      throw e
    }
  }, [user])

  return {
    conversations,
    loadingConversations,
    fetchConversations,
    getOrCreateConversation,
    getOrCreateRoommateConversation,
    fetchMessages,
    sendMessage
  }
}
