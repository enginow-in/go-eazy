import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PropertyForm } from '../components/property/PropertyForm'
import { ArrowLeft } from 'lucide-react'
import { useProperties } from '../hooks/useProperties'

export const PropertyEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchPropertyById, currentProperty, fetchGatedData } = useProperties()
  const [loading, setLoading] = useState(true)
  const [fullData, setFullData] = useState(null)

  useEffect(() => {
    const load = async () => {
      await fetchPropertyById(id)
      const gated = await fetchGatedData(id)
      setFullData(gated || {})
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="pt-32 pb-20 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="skeleton w-32 h-32 rounded-full" />
      </div>
    )
  }

  if (!currentProperty) {
    return (
      <div className="pt-32 pb-20 bg-gray-50 min-h-screen text-center">
        <h1 className="text-2xl font-bold mb-4">Property not found</h1>
        <button className="text-brand-600 hover:underline" onClick={() => navigate('/landlord')}>Return to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="pt-4 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-display">Edit Property</h1>
          <p className="text-gray-500 mt-2">Update information for "{currentProperty.title}"</p>
        </div>
        <PropertyForm initialData={{ ...currentProperty, ...fullData }} isEdit={true} />
      </div>
    </div>
  )
}
