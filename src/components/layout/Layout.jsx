import React from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { AuthModal } from '../auth/AuthModal'
import { AnimatePresence, motion } from 'framer-motion'

export const Layout = ({ children }) => {
  const location = useLocation()
  
  // Track sandbox context directly inside layout layers
  const isDemoMode = window.location.search.includes('mode=demo') || localStorage.getItem('goeazy_demo') === 'true';

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={location.pathname === '/systemadmin' ? "" : "min-h-screen"}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      {location.pathname === '/search' && <Footer />}
      
      {/* Keep the security modal intact, but suppress it explicitly if demo parameters are found */}
      {!isDemoMode && <AuthModal />}
    </>
  )
}