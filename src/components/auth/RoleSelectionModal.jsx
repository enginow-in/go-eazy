import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Home, GraduationCap, Utensils } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'user',             label: 'Student / Professional', icon: <GraduationCap size={20} className="text-[#CA3433]" /> },
  { value: 'landlord',         label: 'Landlord / Owner',        icon: <Home size={20} className="text-[#CA3433]" /> },
  { value: 'service_provider', label: 'Service Provider 🍱',    icon: <Utensils size={20} className="text-[#CA3433]" /> },
]

export const RoleSelectionModal = () => {
  const navigate = useNavigate()
  const location = useLocation() // Fixed: Using proper React Router tracking hook
  const { user, profile, updateProfile } = useAuth()
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)

  // Safely fallback role parameters from DB profile schema or local state
  const currentRole = profile?.role || user?.user_metadata?.role

  // Evaluated display gating matching v3.2 roadmap specs
  const isOpen = !!user && !!profile && !currentRole && location.pathname !== '/systemadmin'

  const handleConfirm = async () => {
    if (!selectedRole) {
      toast.error('Please select a role to continue')
      return
    }
    setLoading(true)
    try {
      await updateProfile({ role: selectedRole })
      toast.success('Profile completed!')
      
      const returnTo = localStorage.getItem('sb_return_to')
      
      // Strict Hardened Route Governance Engine
      if (selectedRole === 'landlord') {
        navigate('/landlord')
      } else if (selectedRole === 'service_provider') {
        navigate('/service-provider')
      } else if (returnTo) {
        navigate(returnTo)
        localStorage.removeItem('sb_return_to')
      } else {
        // Fixed: Missing redirect fallback for default tenant profiles
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={isOpen} onClose={() => {}} preventClose={true} size="sm">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete your profile</h2>
        <p className="text-gray-500 text-sm">Please select how you'll be using GoEazy</p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {ROLE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSelectedRole(opt.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 focus:outline-none ${
              selectedRole === opt.value
                ? 'border-[#CA3433] bg-red-50/50 ring-2 ring-[#CA3433]/10 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
              {opt.icon}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">{opt.label}</p>
            </div>
          </button>
        ))}
      </div>

      <Button 
        type="button"
        variant="primary" 
        size="lg" 
        className="w-full h-12 rounded-xl text-sm font-bold bg-[#CA3433] hover:bg-[#ac2d2c] shadow-lg shadow-[#CA3433]/20 transition-all" 
        loading={loading}
        onClick={handleConfirm}
        disabled={!selectedRole}
      >
        Continue to GoEazy
      </Button>
    </Modal>
  )
}