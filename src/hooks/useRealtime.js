import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Module-level singletons to prevent duplicate subscriptions on rapid network switching
const channels = new Map()
const connectionTimeouts = new Map()

/**
 * useRealtime
 * 
 * Enforces a Singleton pattern for Supabase WebSocket subscriptions.
 * Prevents race conditions on mobile networks by completely destroying old socket
 * listeners before attaching new ones, and adds debouncing for rapid network switches.
 * 
 * @param {string} tableName - The table to subscribe to
 * @param {string} filter - Supabase filter string (e.g. 'user_id=eq.123')
 * @param {function} onInsert - Callback fired when a new row is inserted
 */
export const useRealtime = (tableName, filter, onInsert) => {
  // Use a ref to always keep the latest callback without re-triggering the socket effect
  const callbackRef = useRef(onInsert)
  
  useEffect(() => {
    callbackRef.current = onInsert
  }, [onInsert])

  useEffect(() => {
    if (!filter) return

    const channelKey = `${tableName}:${filter}`

    // 1. Debounce connection to handle rapid network switching (e.g., dropping from WiFi to 5G)
    if (connectionTimeouts.has(channelKey)) {
      clearTimeout(connectionTimeouts.get(channelKey))
    }

    const timeoutId = setTimeout(() => {
      // 2. Robust Presence Check: Completely destroy old socket listener if it exists
      if (channels.has(channelKey)) {
        const oldChannel = channels.get(channelKey)
        supabase.removeChannel(oldChannel)
        channels.delete(channelKey)
      }

      // 3. Attach new singleton socket
      const newChannel = supabase.channel(`public:${tableName}:${filter}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: tableName, filter },
          (payload) => {
            if (callbackRef.current) {
              callbackRef.current(payload.new)
            }
          }
        )
        .subscribe((status, err) => {
          if (err) console.error('Realtime subscription error:', err)
        })

      channels.set(channelKey, newChannel)
    }, 300) // 300ms debounce

    connectionTimeouts.set(channelKey, timeoutId)

    // Cleanup on unmount
    return () => {
      if (connectionTimeouts.has(channelKey)) {
        clearTimeout(connectionTimeouts.get(channelKey))
      }
      
      const channel = channels.get(channelKey)
      if (channel) {
        supabase.removeChannel(channel)
        channels.delete(channelKey)
      }
    }
  }, [tableName, filter])
}
