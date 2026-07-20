import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AppInitializer } from './components/common/AppInitializer'
import { RoleSelectionModal } from './components/auth/RoleSelectionModal'
import { OnboardingQuiz } from './components/common/OnboardingQuiz'
import { useSelector } from 'react-redux'
import { useAuth } from './hooks/useAuth'
import ScrollToTop from './components/common/ScrollToTop'
import { AppRoutes } from './routes/AppRoutes'

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
      <AppInitializer />
      <OnboardingQuiz />
      <RoleSelectionModal />
      <Layout>
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  )
}

export default App
