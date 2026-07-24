import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../utils/supabase'
import { User, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react'

export const Settings = () => {
  const { user, profile } = useAuth()
  
  // Profile State
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' })

  // Security State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' })

  // Populate profile info on initial load safely
  useEffect(() => {
    if (profile) {
      setFullName(prev => prev || profile.full_name || '')
      setPhone(prev => prev || profile.phone || '')
    }
  }, [profile])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    if (!user) return

    setProfileLoading(true)
    setProfileMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone })
        .eq('id', user.id)

      if (error) throw error

      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000)
    } catch (error) {
      console.error('Error updating profile:', error?.message)
      setProfileMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setSecurityLoading(true)
    setSecurityMessage({ type: '', text: '' })

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'New passwords do not match' })
      setSecurityLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      setSecurityLoading(false)
      return
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      })

      if (signInError) {
        throw new Error('Incorrect current password')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSecurityMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSecurityMessage({ type: '', text: '' }), 4000)
      
    } catch (error) {
      console.error('Error updating password:', error?.message)
      setSecurityMessage({ type: 'error', text: error?.message || 'Failed to update password' })
    } finally {
      setSecurityLoading(false)
    }
  }

  return (
    <div className="pt-4 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 mt-2">Manage your personal information and security preferences.</p>
        </div>

        <div className="grid gap-8">
          
          {/* Profile Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-[#fff5f5] flex text-[#CA3433] justify-center items-center">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 font-display">Profile Details</h2>
                <p className="text-sm text-gray-500">Update your public facing information</p>
              </div>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-6">
              {profileMessage.text && (
                <div className={`p-4 rounded-xl mb-6 flex gap-3 text-sm font-medium ${profileMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {profileMessage.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                  {profileMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    autoComplete="email"
                    value={user?.email || ''} 
                    disabled 
                    className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-xl text-gray-500 font-medium cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Email address cannot be changed currently.</p>
                </div>
                
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium"
                    placeholder="E.g. John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  type="submit" 
                  disabled={profileLoading}
                  className="bg-[#CA3433] hover:bg-[#ac2d2c] disabled:bg-[#ffc9c9] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm shadow-[#CA3433]/20"
                >
                  {profileLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-[#fff5f5] flex text-[#CA3433] justify-center items-center">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 font-display">Security Settings</h2>
                <p className="text-sm text-gray-500">Ensure your account is using a secure password</p>
              </div>
            </div>
            
            <form onSubmit={handlePasswordUpdate} className="p-6">
              {securityMessage.text && (
                <div className={`p-4 rounded-xl mb-6 flex gap-3 text-sm font-medium ${securityMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {securityMessage.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                  {securityMessage.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
                  <input 
                    type="password" 
                    id="currentPassword"
                    name="currentPassword"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium"
                    placeholder="Enter current password"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Required to set a new password.</p>
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                  <input 
                    type="password" 
                    id="newPassword"
                    name="newPassword"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                  <input 
                    type="password" 
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium"
                    placeholder="Enter new password again"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  type="submit" 
                  disabled={securityLoading}
                  className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                >
                  {securityLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={18} />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}