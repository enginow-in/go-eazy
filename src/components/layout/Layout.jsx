import React from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from '../layout/Navbar'
import { Footer } from '../layout/Footer'
import { AuthModal } from '../auth/AuthModal'
import { AuthGateModal } from '../auth/AuthGateModal'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

// Pages that require authentication before any content is shown
const AUTH_GATED_PATHS = ['/search']

// Helper — also gate /property/:id routes
const isAuthGated = (pathname) =>
  AUTH_GATED_PATHS.includes(pathname) ||
  pathname.startsWith('/property/')

export const Layout = ({ children }) => {
  const location = useLocation()

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: '12px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#CA3433', secondary: '#fff' } },
        }}
      />

      {/* Forced Auth Gate for search and property detail pages */}
      {isAuthGated(location.pathname) && <AuthGateModal />}

      {location.pathname !== '/systemadmin' && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={location.pathname === '/systemadmin' ? '' : 'min-h-screen'}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      {(location.pathname === '/search' || location.pathname.startsWith('/property/')) && <Footer />}
      <AuthModal />
    </>
  )
}