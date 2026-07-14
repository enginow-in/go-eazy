import React, { useState, useId } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Home, GraduationCap, Utensils } from 'lucide-react'

const ROLE_OPTIONS = [
  {
    value: 'user',
    label: 'Student / Professional',
    icon: <GraduationCap size={20} className="text-brand-500" aria-hidden="true" />,
  },
  {
    value: 'landlord',
    label: 'Landlord / Owner',
    icon: <Home size={20} className="text-brand-500" aria-hidden="true" />,
  },
  {
    value: 'service_provider',
    label: 'Service Provider 🍱',
    icon: <Utensils size={20} className="text-brand-500" aria-hidden="true" />,
  },
]

export const RoleSelectionModal = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, role, updateProfile } = useAuth()

  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)

  const titleId = useId()
  const descriptionId = useId()

  // Show for any logged-in user who has a profile but no role yet
  const isOpen =
    !!user && !!profile && !role && location.pathname !== '/systemadmin'

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

      if (selectedRole === 'landlord') {
        navigate('/landlord')
      } else if (selectedRole === 'service_provider') {
        navigate('/service-provider')
      } else if (returnTo) {
        navigate(returnTo)
        localStorage.removeItem('sb_return_to')
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
        <h2
          id={titleId}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Complete your profile
        </h2>
        <p
          id={descriptionId}
          className="text-gray-500"
        >
          Please select how you'll be using GoEazy
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-4 mb-8"
        role="radiogroup"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        {ROLE_OPTIONS.map((opt) => {
          const selected = selectedRole === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedRole(opt.value)}
              role="radio"
              aria-checked={selected}
              className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                selected
                  ? 'border-[#CA3433] bg-[#fff5f5] ring-2 ring-[#CA3433]/10'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <span className="shrink-0">
                {opt.icon}
              </span>
              <div className="flex-1 text-left py-1">
                <p className="font-bold text-gray-900">
                  {opt.label}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full h-14 rounded-xl text-base bg-[#CA3433] hover:bg-[#ac2d2c] shadow-lg shadow-[#CA3433]/20"
        loading={loading}
        onClick={handleConfirm}
        disabled={!selectedRole}
        aria-busy={loading}
      >
        Continue to GoEazy
      </Button>
    </Modal>
  )
}
