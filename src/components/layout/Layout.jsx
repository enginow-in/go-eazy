import React from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from '../layout/Navbar'
import { Footer } from '../layout/Footer'
import { AuthModal } from '../auth/AuthModal'
import { AuthGateModal } from '../auth/AuthGateModal'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

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
      
      {/* Skip-to-content: visually hidden until focused — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[10000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#CA3433] focus:text-white focus:font-semibold focus:text-sm focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>
      
      {/* Forced Auth Gate for Search page */}
      {location.pathname === '/search' && <AuthGateModal />}
      
      {location.pathname !== '/systemadmin' && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          id="main-content"
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={location.pathname === '/systemadmin' ? "" : "min-h-screen"}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      {location.pathname === '/search' && <Footer />}
      <AuthModal />
    </>
  )
}
