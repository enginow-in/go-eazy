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
import { RoleSelectionModal } from './components/auth/RoleSelectionModal'
import { OnboardingQuiz } from './components/common/OnboardingQuiz'
import { useSelector } from 'react-redux'
import { useAuth } from './hooks/useAuth'
import ScrollToTop from './components/common/ScrollToTop'

// Heavy pages: lazy-loaded into separate chunks to prevent
// "Cannot access X before initialization" TDZ errors from
// Rolldown bundling all module graphs together.
const PropertyDetail          = lazy(() => import('./pages/PropertyDetail').then(m => ({ default: m.PropertyDetail })))
const UserDashboard           = lazy(() => import('./pages/UserDashboard').then(m => ({ default: m.UserDashboard })))
const SavedProperties         = lazy(() => import('./pages/SavedProperties').then(m => ({ default: m.SavedProperties })))
const LandlordDashboard       = lazy(() => import('./pages/LandlordDashboard').then(m => ({ default: m.LandlordDashboard })))
const PropertyNew             = lazy(() => import('./pages/PropertyNew').then(m => ({ default: m.PropertyNew })))
const PropertyEdit            = lazy(() => import('./pages/PropertyEdit').then(m => ({ default: m.PropertyEdit })))
const Settings                = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const ServiceDetail           = lazy(() => import('./pages/ServiceDetail').then(m => ({ default: m.ServiceDetail })))
const ServiceProviderDashboard = lazy(() => import('./pages/ServiceProviderDashboard').then(m => ({ default: m.ServiceProviderDashboard })))
const ServiceNew              = lazy(() => import('./pages/ServiceNew').then(m => ({ default: m.ServiceNew })))
const About                   = lazy(() => import('./pages/About').then(m => ({ default: m.About })))
const SystemAdmin             = lazy(() => import('./pages/SystemAdmin').then(m => ({ default: m.SystemAdmin })))
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
      {/* <AppInitializer /> */}
      {/* <OnboardingQuiz /> */}
      {/* <RoleSelectionModal /> */}
      <Layout>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          
          {/* Legal Routes */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/about" element={<About />} />

          {/* Admin Route */}
          <Route path="/systemadmin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SystemAdmin />
            </ProtectedRoute>
          } />

          {/* Nearby Services Routes */}
          <Route path="/nearby" element={<NearbyServices />} />
          <Route path="/services/:id" element={<ServiceDetail />} />

          {/* Service Provider Routes */}
          <Route path="/service-provider" element={
            <ProtectedRoute allowedRoles={['service_provider']}>
              <ServiceProviderDashboard />
            </ProtectedRoute>
          } />
          <Route path="/service-provider/new" element={
            <ProtectedRoute allowedRoles={['service_provider']}>
              <ServiceNew />
            </ProtectedRoute>
          } />
          
          {/* User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user', 'landlord', 'service_provider']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/saved" element={
            <ProtectedRoute>
              <SavedProperties />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* Landlord Routes */}
          <Route path="/landlord" element={
            <ProtectedRoute allowedRoles={['landlord']}>
              <LandlordDashboard />
            </ProtectedRoute>
          } />
          <Route path="/landlord/properties/new" element={
            <ProtectedRoute allowedRoles={['landlord']}>
              <PropertyNew />
            </ProtectedRoute>
          } />
          <Route path="/landlord/properties/:id/edit" element={
            <ProtectedRoute allowedRoles={['landlord']}>
              <PropertyEdit />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}


export default App
