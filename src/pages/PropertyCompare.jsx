import React from 'react'
import { ArrowLeft, GitCompareArrows, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearComparison, removeFromCompare } from '../store/propertySlice'

const rows = [
  ['Price', property => property.price ? `₹${Number(property.price).toLocaleString('en-IN')} / month` : 'Not provided'],
  ['Location', property => [property.area, property.city].filter(Boolean).join(', ') || 'Not provided'],
  ['Property type', property => property.type || 'Not provided'],
  ['Bedrooms', property => property.bedrooms ?? 'Not provided'],
  ['Amenities', property => property.amenities?.length ? property.amenities.join(', ') : 'Not provided'],
  ['Availability', property => property.availability === false ? 'Unavailable' : 'Available'],
]

export const PropertyCompare = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const properties = useSelector(state => state.property?.comparisonList || [])

  if (!properties.length) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <GitCompareArrows size={42} className="mb-4 text-[#CA3433]" />
        <h1 className="text-2xl font-black text-gray-900">No properties to compare</h1>
        <p className="mt-2 text-sm text-gray-500">Select up to three properties from search results to compare them side by side.</p>
        <button type="button" onClick={() => navigate('/search')} className="mt-6 rounded-xl bg-[#CA3433] px-5 py-3 text-sm font-bold text-white">Browse properties</button>
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900"><ArrowLeft size={16} /> Back</button>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-gray-900">Compare properties</h1><p className="mt-1 text-sm text-gray-500">Review key details side by side.</p></div>
        <button type="button" onClick={() => dispatch(clearComparison())} className="text-sm font-bold text-gray-500 hover:text-[#CA3433]">Clear all</button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-[720px] w-full border-collapse text-left">
          <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="w-40 p-4 text-xs font-black uppercase tracking-wider text-gray-400">Details</th>{properties.map(property => <th key={property.id} className="min-w-52 p-4 align-top"><div className="relative"><button type="button" onClick={() => dispatch(removeFromCompare(property.id))} className="absolute right-0 top-0 text-gray-400 hover:text-[#CA3433]" aria-label={`Remove ${property.title}`}><X size={16} /></button><img src={property.images?.[0]} alt="" className="mb-3 h-28 w-full rounded-xl object-cover" /><h2 className="pr-5 text-base font-black text-gray-900">{property.title}</h2></div></th>)}</tr></thead>
          <tbody>{rows.map(([label, value]) => <tr key={label} className="border-b border-gray-100 last:border-0"><th className="p-4 text-sm font-bold text-gray-500">{label}</th>{properties.map(property => <td key={property.id} className="p-4 text-sm font-semibold text-gray-800">{value(property)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </main>
  )
}
