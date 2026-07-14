import React from 'react'

export const SimpleHero = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          GO<span className="text-red-500">EAZY</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Find your perfect home, wherever you go.
        </p>
        <div className="space-y-4">
          <p>✅ App is loading successfully</p>
          <p>✅ React is working</p>
          <p>✅ Tailwind CSS is working</p>
        </div>
      </div>
    </div>
  )
}