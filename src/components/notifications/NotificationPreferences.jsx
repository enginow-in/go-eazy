import React, { useState } from 'react'
import { Bell, Mail, Smartphone, Radio, Clock, Shield, Sparkles, CheckCircle2 } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'

export const NotificationPreferences = () => {
  const { preferences, savePreferences } = useNotifications()
  const [channels, setChannels] = useState(preferences.channels)
  const [categories, setCategories] = useState(preferences.categories)
  const [frequency, setFrequency] = useState(preferences.frequency)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleChannelToggle = (key) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleCategoryToggle = (key) => {
    setCategories(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    savePreferences({ channels, categories, frequency })
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3500)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Section Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff5f5] text-[#CA3433] flex items-center justify-center font-bold">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-display">Notification Preferences</h2>
            <p className="text-xs text-gray-500">Configure channels, digest alerts, and event triggers</p>
          </div>
        </div>

        {saveSuccess && (
          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold flex items-center gap-1.5 animate-in fade-in duration-300">
            <CheckCircle2 size={14} /> Saved Preferences
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Delivery Channels */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Radio size={16} className="text-[#CA3433]" /> Delivery Channels
          </h3>
          <p className="text-xs text-gray-500 mb-4">Choose where you want to receive notifications</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* In-App */}
            <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${channels.inApp ? 'bg-[#fff5f5]/50 border-[#CA3433]/30' : 'bg-gray-50/50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white shadow-2xs border border-gray-100 flex items-center justify-center text-gray-700">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">In-App Notification Center</p>
                  <p className="text-[11px] text-gray-500">Badges & drawer alerts</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channels.inApp}
                onChange={() => handleChannelToggle('inApp')}
                className="w-5 h-5 rounded text-[#CA3433] focus:ring-[#CA3433] accent-[#CA3433] cursor-pointer"
              />
            </div>

            {/* Email */}
            <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${channels.email ? 'bg-[#fff5f5]/50 border-[#CA3433]/30' : 'bg-gray-50/50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white shadow-2xs border border-gray-100 flex items-center justify-center text-gray-700">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Email Notifications</p>
                  <p className="text-[11px] text-gray-500">Inquiries & receipts digest</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channels.email}
                onChange={() => handleChannelToggle('email')}
                className="w-5 h-5 rounded text-[#CA3433] focus:ring-[#CA3433] accent-[#CA3433] cursor-pointer"
              />
            </div>

            {/* SMS */}
            <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${channels.sms ? 'bg-[#fff5f5]/50 border-[#CA3433]/30' : 'bg-gray-50/50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white shadow-2xs border border-gray-100 flex items-center justify-center text-gray-700">
                  <Smartphone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">SMS Alerts</p>
                  <p className="text-[11px] text-gray-500">Urgent booking confirmations</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channels.sms}
                onChange={() => handleChannelToggle('sms')}
                className="w-5 h-5 rounded text-[#CA3433] focus:ring-[#CA3433] accent-[#CA3433] cursor-pointer"
              />
            </div>

            {/* Push */}
            <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${channels.push ? 'bg-[#fff5f5]/50 border-[#CA3433]/30' : 'bg-gray-50/50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white shadow-2xs border border-gray-100 flex items-center justify-center text-gray-700">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Browser Push</p>
                  <p className="text-[11px] text-gray-500">Real-time web popups</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channels.push}
                onChange={() => handleChannelToggle('push')}
                className="w-5 h-5 rounded text-[#CA3433] focus:ring-[#CA3433] accent-[#CA3433] cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* Notification Categories */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Shield size={16} className="text-[#CA3433]" /> Event Categories
          </h3>
          <p className="text-xs text-gray-500 mb-4">Select event types you want to be notified about</p>

          <div className="space-y-3">
            {[
              { id: 'propertyInquiries', title: 'Property Inquiries & Bookings', desc: 'Direct messages, visit bookings, and tenant questions' },
              { id: 'paymentConfirmations', title: 'Payment Confirmations', desc: 'Rent invoices, token payments, and refund notices' },
              { id: 'serviceApprovals', title: 'Service Requests & Approvals', desc: 'Listing approvals, service requests, and provider status' },
              { id: 'systemAlerts', title: 'System & Security Alerts', desc: 'Account updates, feature announcements, and maintenance alerts' }
            ].map(cat => (
              <label key={cat.id} className="flex items-start justify-between p-3.5 rounded-xl hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                <div className="pr-4">
                  <p className="text-xs font-bold text-gray-900">{cat.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{cat.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={categories[cat.id]}
                  onChange={() => handleCategoryToggle(cat.id)}
                  className="w-5 h-5 rounded text-[#CA3433] focus:ring-[#CA3433] accent-[#CA3433] cursor-pointer shrink-0 mt-0.5"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Frequency & Digest Control */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Clock size={16} className="text-[#CA3433]" /> Email/SMS Digest Frequency
          </h3>
          <p className="text-xs text-gray-500 mb-4">Control how often digest emails are delivered to your inbox</p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { id: 'instant', label: 'Instant Real-time', desc: 'Send as events occur' },
              { id: 'daily_digest', label: 'Daily Digest', desc: 'Once per day summary' },
              { id: 'weekly_digest', label: 'Weekly Summary', desc: 'Every Monday morning' },
              { id: 'off', label: 'Mute Email Digest', desc: 'In-App only' }
            ].map(freq => (
              <button
                key={freq.id}
                type="button"
                onClick={() => setFrequency(freq.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${frequency === freq.id ? 'bg-[#CA3433] text-white border-[#CA3433] shadow-md shadow-[#CA3433]/20' : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'}`}
              >
                <p className="text-xs font-bold">{freq.label}</p>
                <p className={`text-[10px] mt-1 ${frequency === freq.id ? 'text-white/80' : 'text-gray-500'}`}>{freq.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#CA3433] hover:bg-[#ac2d2c] text-white text-xs font-bold rounded-xl shadow-md shadow-[#CA3433]/20 transition-all active:scale-95 cursor-pointer"
          >
            Save Notification Preferences
          </button>
        </div>

      </form>
    </div>
  )
}
