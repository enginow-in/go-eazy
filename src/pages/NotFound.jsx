import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 text-center px-4 py-20 overflow-hidden">
      {/* Animated 404 Number */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mb-8"
      >
        <h1 className="text-[140px] sm:text-[180px] font-black font-display text-gray-100 leading-none select-none">
          404
        </h1>

        {/* Floating house icon over the 0 */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#CA3433] to-[#a82928] rounded-2xl flex items-center justify-center shadow-xl shadow-red-200/50 rotate-12">
            <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white -rotate-12" />
          </div>
        </motion.div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 font-display">
          Lost your way?
        </h2>
        <p className="text-gray-500 max-w-md mx-auto mb-10 text-sm sm:text-base leading-relaxed">
          The page you're looking for has moved, been renamed, or might never have existed. 
          Let's get you back to finding your perfect stay.
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Link
          to="/search"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0B0F19] text-white text-sm font-semibold rounded-full hover:bg-[#CA3433] transition-all duration-300 transform hover:scale-105 shadow-xl shadow-black/10"
        >
          <Search className="w-4 h-4" />
          Browse Properties
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 text-sm font-semibold rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </motion.div>

      {/* Subtle Decorative Elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="mt-16 flex items-center gap-2 text-xs text-gray-300"
      >
        <Home className="w-3.5 h-3.5" />
        <span>GoEazy — Simplifying. Seamlessly.</span>
      </motion.div>
    </div>
  )
}
