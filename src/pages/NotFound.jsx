import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export const NotFound = () => {
  return (
    <main
      className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-white text-center px-4"
      role="main"
    >
      <div
        className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 mb-6 mx-auto"
        aria-hidden="true"
      >
        <Home size={40} />
      </div>

      <h1 className="text-6xl font-bold font-display text-gray-900 mb-4">
        404
      </h1>

      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Page not found
      </h2>

      <p className="text-gray-500 max-w-md mx-auto mb-8">
        Sorry, we couldn't find the page you're looking for. It may have been
        moved, deleted, or the URL might be incorrect.
      </p>

      <Link
        to="/"
        aria-label="Return to the home page"
        className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back to Home
      </Link>
    </main>
  )
}