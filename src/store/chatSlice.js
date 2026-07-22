import { createSlice } from '@reduxjs/toolkit'
import { MOCK_CONVERSATIONS } from '../utils/constants'

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: MOCK_CONVERSATIONS,
    activeConversationId: null,
    chatWidgetOpen: false,
  },
  reducers: {
    sendMessage: (state, action) => {
      const { conversationId, text, senderId } = action.payload
      const conv = state.conversations.find(c => c.id === conversationId)
      if (!conv) return
      const msg = {
        id: `m-${Date.now()}`,
        senderId,
        text,
        timestamp: new Date().toISOString(),
      }
      conv.messages.push(msg)
      conv.lastMessage = text
      conv.lastMessageTime = msg.timestamp
    },
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload
    },
    toggleChatWidget: (state) => {
      state.chatWidgetOpen = !state.chatWidgetOpen
    },
    openChatWidget: (state) => {
      state.chatWidgetOpen = true
    },
    closeChatWidget: (state) => {
      state.chatWidgetOpen = false
    },
    addConversation: (state, action) => {
      state.conversations.unshift(action.payload)
    },
    markConversationRead: (state, action) => {
      const conv = state.conversations.find(c => c.id === action.payload)
      if (conv) conv.unreadCount = 0
    },
    incrementUnread: (state, action) => {
      const conv = state.conversations.find(c => c.id === action.payload)
      if (conv) conv.unreadCount = (conv.unreadCount || 0) + 1
    },
  },
})

export const {
  sendMessage, setActiveConversation, toggleChatWidget,
  openChatWidget, closeChatWidget, addConversation,
  markConversationRead, incrementUnread,
} = chatSlice.actions
export default chatSlice.reducer
