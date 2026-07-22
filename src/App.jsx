// GoEazy App - Vercel Build Refresh
import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { Search } from './pages/Search'
import { NotFound } from './pages/NotFound'
import { NearbyServices } from './pages/NearbyServices'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppInitializer } from './components/common/AppInitializer'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { RoleSelectionModal } from './components/auth/RoleSelectionModal'
import { OnboardingQuiz } from './components/common/OnboardingQuiz'
import { useSelector } from 'react-redux'
import { useAuth } from './hooks/useAuth'
import { useDarkMode } from './hooks/useDarkMode'
import { SEOHead } from './components/common/SEOHead'
import ScrollToTop from './components/common/ScrollToTop'

// Heavy pages: lazy-loaded into separate chunks to prevent
// "Cannot access X before initialization" TDZ errors from
// Rolldown bundling all module graphs together.
const PropertyDetail          = lazy(() => import('./pages/PropertyDetail').then(m => ({ default: m.PropertyDetail })))
const Messages                = lazy(() => import('./pages/Messages').then(m => ({ default: m.Messages })))
const PropertyCompare         = lazy(() => import('./pages/PropertyCompare').then(m => ({ default: m.PropertyCompare })))
const UserDashboard           = lazy(() => import('./pages/UserDashboard').then(m => ({ default: m.UserDashboard })))
const SavedProperties         = lazy(() => import('./pages/SavedProperties').then(m => ({ default: m.SavedProperties })))
const LandlordDashboard       = lazy(() => import('./pages/LandlordDashboard').then(m => ({ default: m.LandlordDashboard })))
const PropertyNew             = lazy(() => import('./pages/PropertyNew').then(m => ({ default: m.PropertyNew })))
const PropertyEdit            = lazy(() => import('./pages/PropertyEdit').then(m => ({ default: m.PropertyEdit })))
const Settings                = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const UnlockedProperties     = lazy(() => import('./pages/UnlockedProperties').then(m => ({ default: m.UnlockedProperties })))
const ServiceDetail           = lazy(() => import('./pages/ServiceDetail').then(m => ({ default: m.ServiceDetail })))
const ServiceProviderDashboard = lazy(() => import('./pages/ServiceProviderDashboard').then(m => ({ default: m.ServiceProviderDashboard })))
const ServiceNew              = lazy(() => import('./pages/ServiceNew').then(m => ({ default: m.ServiceNew })))
const About                   = lazy(() => import('./pages/About').then(m => ({ default: m.About })))
const SystemAdmin             = lazy(() => import('./pages/SystemAdmin').then(m => ({ default: m.SystemAdmin })))
const Notifications           = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })))
const PrivacyPolicy           = lazy(() => import('./pages/legal/PrivacyPolicy'))
const TermsOfService          = lazy(() => import('./pages/legal/TermsOfService'))
const CookiePolicy            = lazy(() => import('./pages/legal/CookiePolicy'))
const RefundPolicy            = lazy(() => import('./pages/legal/RefundPolicy'))

const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-10 h-10 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
  </div>
)

function App() {
  useAuth()
  useDarkMode()
  const { loading } = useSelector(s => s.auth)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-[#CA3433] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppInitializer />
      <OnboardingQuiz />
      <RoleSelectionModal />
      <Layout>
        <SEOHead />
        <Suspense fallback={<PageSpinner />}>
          <Routes>
          <Route path="/" element={<ErrorBoundary><Navigate to="/search" replace /></ErrorBoundary>} />
          <Route path="/search" element={<ErrorBoundary><Search /></ErrorBoundary>} />
          <Route path="/property/:id" element={<ErrorBoundary><PropertyDetail /></ErrorBoundary>} />
          <Route path="/messages" element={<ErrorBoundary><Messages /></ErrorBoundary>} />
          <Route path="/notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
          <Route path="/unlocked" element={<ErrorBoundary><UnlockedProperties /></ErrorBoundary>} />
          <Route path="/compare" element={<ErrorBoundary><PropertyCompare /></ErrorBoundary>} />
          
          {/* Legal Routes */}
          <Route path="/privacy" element={<ErrorBoundary><PrivacyPolicy /></ErrorBoundary>} />
          <Route path="/terms" element={<ErrorBoundary><TermsOfService /></ErrorBoundary>} />
          <Route path="/cookies" element={<ErrorBoundary><CookiePolicy /></ErrorBoundary>} />
          <Route path="/refund" element={<ErrorBoundary><RefundPolicy /></ErrorBoundary>} />
          <Route path="/about" element={<ErrorBoundary><About /></ErrorBoundary>} />

          {/* Admin Route */}
          <Route path="/systemadmin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ErrorBoundary><SystemAdmin /></ErrorBoundary>
            </ProtectedRoute>
          } />

          {/* Nearby Services Routes */}
          <Route path="/nearby" element={<ErrorBoundary><NearbyServices /></ErrorBoundary>} />
          <Route path="/services/:id" element={<ErrorBoundary><ServiceDetail /></ErrorBoundary>} />

          {/* Service Provider Routes */}
          <Route path="/service-provider" element={
            <ProtectedRoute allowedRoles={['service_provider']}>
              <ErrorBoundary><ServiceProviderDashboard /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/service-provider/new" element={
            <ProtectedRoute allowedRoles={['service_provider']}>
              <ErrorBoundary><ServiceNew /></ErrorBoundary>
            </ProtectedRoute>
          } />
          
          {/* User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user', 'landlord', 'service_provider']}>
              <ErrorBoundary><UserDashboard /></ErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/saved" element={
            <ProtectedRoute>
              <ErrorBoundary><SavedProperties /></ErrorBoundary>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <ErrorBoundary><Settings /></ErrorBoundary>
            </ProtectedRoute>
          } />
          
          {/* Landlord Routes */}
          <Route path="/landlord" element={
            <ProtectedRoute allowedRoles={['landlord']}>
              <ErrorBoundary><LandlordDashboard /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/landlord/properties/new" element={
            <ProtectedRoute allowedRoles={['landlord']}>
              <ErrorBoundary><PropertyNew /></ErrorBoundary>
            </ProtectedRoute>
          } />
          <Route path="/landlord/properties/:id/edit" element={
            <ProtectedRoute allowedRoles={['landlord']}>
              <ErrorBoundary><PropertyEdit /></ErrorBoundary>
            </ProtectedRoute>
          } />

          <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
        </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}


export default App
