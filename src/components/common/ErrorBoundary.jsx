import React from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { motion } from 'framer-motion'

// React does NOT provide a hooks API for error boundaries.
// A class component is the only way to use getDerivedStateFromError
// and componentDidCatch. This is the sole class component in the project.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/search'
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Top gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#CA3433] to-rose-400" />

            <div className="px-6 pt-5 pb-5">
              {/* Logo row */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white border-2 border-[#CA3433] shadow-md flex items-center justify-center font-bold rotate-3 overflow-hidden">
                  <div className="-rotate-3 flex items-center justify-center translate-y-0.5">
                    <span className="text-[#CA3433] text-[16px] font-black leading-none">G</span>
                    <span className="text-[#CA3433] text-[11px] font-black leading-none -ml-0.5 mb-1.5">E</span>
                  </div>
                </div>
                <span className="text-base font-black text-gray-900 tracking-tight">
                  GoEazy<span className="text-[#CA3433]">.</span>
                </span>
                <span className="ml-auto text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">
                  System Alert
                </span>
              </div>

              {/* Warning Illustration / Icon */}
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 mt-2">
                <AlertTriangle size={24} className="text-[#CA3433]" />
              </div>

              {/* Content */}
              <div className="text-center mb-5">
                <h1 className="text-lg font-black text-gray-900 font-display mb-1.5">
                  Something went wrong
                </h1>
                <p className="text-xs text-gray-500 leading-relaxed px-2">
                  An unexpected error occurred. Your session is safe, but we need to reload.
                </p>
              </div>

              {/* Error details (dev only — collapsed) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-4 text-left bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                  <summary className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors">
                    Error Details (dev only)
                  </summary>
                  <div className="px-3 py-2 border-t border-gray-100">
                    <p className="text-[10px] font-mono text-red-600 break-all mb-1">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-[9px] font-mono text-gray-400 overflow-x-auto whitespace-pre-wrap max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons matching AuthGateModal's design style */}
              <div className="space-y-2">
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#CA3433] text-white text-sm font-bold rounded-lg shadow-lg shadow-red-500/20 hover:bg-[#ac2d2c] transition-all duration-300"
                >
                  <RotateCcw size={15} />
                  Refresh Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <Home size={15} />
                  Go Home
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed">
                Need help? Contact GoEazy support at <span className="text-[#CA3433] font-semibold">support@goeazy.com</span>
              </p>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
