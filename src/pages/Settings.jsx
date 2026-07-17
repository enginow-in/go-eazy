import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { User, Lock, Save, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'

export const Settings = () => {
  const { user, profile, updateProfile } = useAuth()
  
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

  // Roommate Finder State
  const [isLookingForRoommate, setIsLookingForRoommate] = useState(false)
  const [roommateCity, setRoommateCity] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [gender, setGender] = useState('Any')
  const [budget, setBudget] = useState(5000)
  const [sleepingHabits, setSleepingHabits] = useState('Flexible')
  const [smokingDrinking, setSmokingDrinking] = useState('None')
  const [foodPreference, setFoodPreference] = useState('Veg & Non-Veg')
  const [roommateBio, setRoommateBio] = useState('')
  const [roommateLoading, setRoommateLoading] = useState(false)
  const [roommateMessage, setRoommateMessage] = useState({ type: '', text: '' })

  // Populate profile info on load
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setIsLookingForRoommate(profile.is_looking_for_roommate || false)
      if (profile.roommate_profile) {
        const rp = profile.roommate_profile
        setRoommateCity(rp.city || '')
        setCollegeName(rp.college_name || '')
        setGender(rp.gender || 'Any')
        setBudget(rp.budget || 5000)
        setSleepingHabits(rp.sleeping_habits || 'Flexible')
        setSmokingDrinking(rp.smoking_drinking || 'None')
        setFoodPreference(rp.food_preference || 'Veg & Non-Veg')
        setRoommateBio(rp.bio || '')
      }
    }
  }, [profile])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
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
      console.error('Error updating profile:', error.message)
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
      // First re-authenticate to verify current password since "Require current password" might be on
      // Note: Supabase doesn't have a direct "update with current password" passing old pass via updateUser.
      // If 'Require current password' is on, we authenticate first to get a fresh session or use the signInWithPassword
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) {
        throw new Error('Incorrect current password')
      }

      // Now update the password
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
      console.error('Error updating password:', error.message)
      setSecurityMessage({ type: 'error', text: error.message || 'Failed to update password' })
    } finally {
      setSecurityLoading(false)
    }
  }

  const handleRoommateUpdate = async (e) => {
    e.preventDefault()
    setRoommateLoading(true)
    setRoommateMessage({ type: '', text: '' })

    try {
      await updateProfile({
        is_looking_for_roommate: isLookingForRoommate,
        roommate_profile: {
          city: roommateCity,
          college_name: collegeName,
          gender: gender,
          budget: Number(budget),
          sleeping_habits: sleepingHabits,
          smoking_drinking: smokingDrinking,
          food_preference: foodPreference,
          bio: roommateBio
        }
      })
      setRoommateMessage({ type: 'success', text: 'Roommate preferences updated successfully!' })
      setTimeout(() => setRoommateMessage({ type: '', text: '' }), 4000)
    } catch (error) {
      console.error('Error updating roommate preferences:', error.message)
      setRoommateMessage({ type: 'error', text: 'Failed to update preferences. Please try again.' })
    } finally {
      setRoommateLoading(false)
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
              <div className="w-10 h-10 rounded-xl bg-[#fff5f5] flex flex-center text-[#CA3433] justify-center items-center">
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

          {profile?.role === 'user' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fff5f5] flex text-[#CA3433] justify-center items-center">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 font-display">Roommate Matching Profile</h2>
                    <p className="text-sm text-gray-500">Find compatible flatmates by filling in your preferences</p>
                  </div>
                </div>
                
                {/* Active Toggle */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {isLookingForRoommate ? 'Looking' : 'Not Looking'}
                  </span>
                  <label htmlFor="roommate-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      id="roommate-toggle"
                      checked={isLookingForRoommate} 
                      onChange={e => setIsLookingForRoommate(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#CA3433]"></div>
                  </label>
                </div>
              </div>

              {isLookingForRoommate && (
                <form onSubmit={handleRoommateUpdate} className="p-6">
                  {roommateMessage.text && (
                    <div className={`p-4 rounded-xl mb-6 flex gap-3 text-sm font-medium ${roommateMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {roommateMessage.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                      {roommateMessage.text}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* City */}
                      <div>
                        <label htmlFor="roommateCity" className="block text-sm font-semibold text-gray-700 mb-1.5">Target City</label>
                        <input 
                          type="text" 
                          id="roommateCity"
                          name="roommateCity"
                          value={roommateCity}
                          onChange={(e) => setRoommateCity(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium text-sm"
                          placeholder="E.g. Dehradun"
                        />
                      </div>

                      {/* College/University */}
                      <div>
                        <label htmlFor="collegeName" className="block text-sm font-semibold text-gray-700 mb-1.5">College / University Name</label>
                        <input 
                          type="text" 
                          id="collegeName"
                          name="collegeName"
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium text-sm"
                          placeholder="E.g. UPES"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Gender */}
                      <div>
                        <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-1.5">Your Gender</label>
                        <select 
                          id="gender"
                          name="gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium text-sm outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Any">Prefer not to say</option>
                        </select>
                      </div>

                      {/* Budget */}
                      <div>
                        <label htmlFor="budget" className="block text-sm font-semibold text-gray-700 mb-1.5">Monthly Budget (₹)</label>
                        <input 
                          type="number" 
                          id="budget"
                          name="budget"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          required
                          min="0"
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium text-sm"
                          placeholder="E.g. 8000"
                        />
                      </div>

                      {/* Food Preference */}
                      <div>
                        <label htmlFor="foodPreference" className="block text-sm font-semibold text-gray-700 mb-1.5">Food Choice</label>
                        <select 
                          id="foodPreference"
                          name="foodPreference"
                          value={foodPreference}
                          onChange={(e) => setFoodPreference(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium text-sm outline-none"
                        >
                          <option value="Veg">Veg</option>
                          <option value="Non-Veg">Non-Veg</option>
                          <option value="Veg & Non-Veg">No Preference</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sleeping Habits */}
                      <div>
                        <label htmlFor="sleepingHabits" className="block text-sm font-semibold text-gray-700 mb-1.5">Sleeping Habits</label>
                        <select 
                          id="sleepingHabits"
                          name="sleepingHabits"
                          value={sleepingHabits}
                          onChange={(e) => setSleepingHabits(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium text-sm outline-none"
                        >
                          <option value="Early Bird">Early Bird</option>
                          <option value="Night Owl">Night Owl</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                      </div>

                      {/* Smoking & Drinking */}
                      <div>
                        <label htmlFor="smokingDrinking" className="block text-sm font-semibold text-gray-700 mb-1.5">Smoking / Drinking</label>
                        <select 
                          id="smokingDrinking"
                          name="smokingDrinking"
                          value={smokingDrinking}
                          onChange={(e) => setSmokingDrinking(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium text-sm outline-none"
                        >
                          <option value="None">None</option>
                          <option value="Occasional">Occasional</option>
                          <option value="Regular">Regular</option>
                        </select>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label htmlFor="roommateBio" className="block text-sm font-semibold text-gray-700 mb-1.5">Roommate Bio (Tell others about yourself)</label>
                      <textarea 
                        id="roommateBio"
                        name="roommateBio"
                        value={roommateBio}
                        onChange={(e) => setRoommateBio(e.target.value)}
                        rows="3"
                        maxLength="150"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] transition-all font-medium text-sm outline-none resize-none"
                        placeholder="E.g. Clean and quiet UPES student looking for a flatmate who respects study hours..."
                      />
                      <p className="text-[10px] text-gray-400 mt-1 flex justify-end font-bold uppercase">{roommateBio.length}/150 Characters</p>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={roommateLoading}
                      className="bg-[#CA3433] hover:bg-[#ac2d2c] disabled:bg-[#ffc9c9] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm shadow-[#CA3433]/20 cursor-pointer"
                    >
                      {roommateLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                      Save Roommate Profile
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Security Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-[#fff5f5] flex flex-center text-[#CA3433] justify-center items-center">
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
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
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
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
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
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
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
