import React from 'react'
import toast from 'react-hot-toast'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { logError, extractErrorMessage } from '@/services/errorLogger'

/**
 * Error Boundary Component
 * Catches React component errors and displays user-friendly UI
 * Prevents entire app from crashing
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    })
    
    // Log to error service
    logError(error, {
      page: this.props.name || 'Unknown',
      componentStack: errorInfo.componentStack,
    })
    
    // Show toast notification
    toast.error('Something went wrong. Please refresh the page.')
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-xl font-black text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              We've logged this error and our team will look into it. Please try refreshing the page.
            </p>

            {/* Error Details (Dev Only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-mono text-gray-700 break-words">
                  <strong>Error:</strong> {extractErrorMessage(this.state.error)}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-[#CA3433] hover:bg-[#ac2d2c] text-white font-bold py-3 rounded-xl transition-colors"
              >
                <RotateCcw size={16} />
                Try Again
              </button>
              <a
                href="/"
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
