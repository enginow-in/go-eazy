import React from 'react'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

/**
 * ErrorBoundary — catches unhandled JavaScript errors in the React component
 * tree and displays a user-friendly fallback UI instead of a blank white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * With custom fallback:
 *   <ErrorBoundary fallback={<MyCustomError />}>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    }

    // Future: send to error tracking service (e.g., Sentry)
    // reportErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/search'
  }

  render() {
    if (this.state.hasError) {
      // Allow custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-[#CA3433]" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2 font-display">
              Something went wrong
            </h1>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              An unexpected error occurred. Don't worry — your data is safe.
              Try refreshing the page or going back to the home page.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#CA3433] text-white text-sm font-semibold rounded-full hover:bg-[#b52d2c] transition-all duration-200 shadow-lg shadow-red-200"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left bg-gray-100 rounded-xl p-4">
                <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700">
                  Developer Details
                </summary>
                <pre className="mt-3 text-xs text-red-600 overflow-x-auto whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
