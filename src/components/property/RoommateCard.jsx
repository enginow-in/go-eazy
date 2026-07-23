import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  School, MessageSquare, Sparkles, MapPin, 
  IndianRupee, Flame, User, Clock, Check
} from 'lucide-react'
import { useMessages } from '../../hooks/useMessages'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export const RoommateCard = ({ roommate }) => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { getOrCreateRoommateConversation } = useMessages()
  const [loading, setLoading] = useState(false)

  const { roommate_profile, full_name, avatar_url, id } = roommate
  const habits = roommate_profile || {}

  const handleMessage = async () => {
    if (!user) {
      toast.error('Please log in to chat with roommates!')
      // Dispatch event to open login modal (handled globally in GoEazy)
      window.dispatchEvent(new CustomEvent('goeazy_open_auth_modal'))
      return
    }

    setLoading(true)
    try {
      const conv = await getOrCreateRoommateConversation(id)
      toast.success('Chat started! 💬')
      navigate(`/messages?id=${conv.id}`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to start conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get compatibility color
  const getMatchColor = (score) => {
    if (score >= 80) return 'from-emerald-500 to-teal-600 text-white'
    if (score >= 60) return 'from-amber-500 to-orange-600 text-white'
    return 'from-gray-500 to-slate-600 text-white'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)] transition-all overflow-hidden flex flex-col h-full"
    >
      {/* Top Banner with Match Score */}
      <div className="relative pt-6 px-6 pb-4 bg-gradient-to-br from-red-50/50 to-gray-50/30 flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img 
            src={avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${full_name}`} 
            alt={full_name} 
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md bg-gray-100" 
          />
          <span className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase shadow-sm tracking-wider ${
            habits.gender === 'Female' ? 'bg-pink-100 text-pink-700' : habits.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {habits.gender || 'Any'}
          </span>
        </div>

        {/* Name and Match Score */}
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-[15px] text-gray-900 truncate font-display">{full_name}</h3>
          
          {/* Match Score Badge */}
          {profile?.roommate_profile ? (
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-gradient-to-r ${getMatchColor(roommate.matchScore)} shadow-sm`}>
                <Sparkles size={10} className="animate-pulse" />
                {roommate.matchScore}% Match
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 font-semibold mt-1">Set habits to see Match %</p>
          )}
        </div>
      </div>

      {/* Profile Details / Habits */}
      <div className="p-6 pt-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* College and Budget info */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <School size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{habits.college_name || 'HNBGU / UPES'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 justify-end">
              <IndianRupee size={12} className="text-gray-400 shrink-0" />
              <span>₹{Number(habits.budget || 0).toLocaleString()} / mo</span>
            </div>
          </div>

          {/* About Me bio */}
          {habits.bio && (
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
              {habits.bio}
            </p>
          )}

          {/* Habit Attributes */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {habits.sleeping_habits && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-bold border border-gray-100">
                <Clock size={10} className="text-gray-400" />
                {habits.sleeping_habits}
              </span>
            )}
            {habits.food_preference && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-bold border border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {habits.food_preference}
              </span>
            )}
            {habits.smoking_drinking && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-xl text-[10px] font-bold border border-gray-100">
                <Flame size={10} className="text-gray-400" />
                {habits.smoking_drinking === 'None' ? 'Sober' : habits.smoking_drinking}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-gray-50">
          <button
            onClick={handleMessage}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#CA3433] hover:bg-[#ac2d2c] disabled:bg-gray-200 text-white rounded-xl text-xs font-bold transition-all hover:shadow-md hover:shadow-red-500/10 active:scale-95 cursor-pointer"
          >
            <MessageSquare size={13} />
            {loading ? 'Initializing Chat...' : 'Message Roommate'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
