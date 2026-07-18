import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * ErrorBoundary — catches uncaught React render errors and displays a
 * user-friendly fallback UI instead of a full white-screen crash.
 *
 * Usage (wrap any sub-tree, or the whole app in main.jsx):
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * An optional `fallback` prop can replace the default UI.
 * An optional `onError` prop receives (error, info) for external logging.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    // Forward to any external logger (e.g. Sentry) if provided
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo)
    }
    console.error('[ErrorBoundary] Caught unhandled error:', error, errorInfo)
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // Allow a fully custom fallback
    if (this.props.fallback) {
      return this.props.fallback
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-[#CA3433]" />
          </div>

          {/* Message */}
          <h1 className="text-2xl font-black text-gray-900 mb-2 font-display">
            Something went wrong
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            An unexpected error occurred. You can try refreshing the page or
            return to the home screen. If the problem persists, please contact
            support.
          </p>

          {/* Error detail (dev-only) */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-6 text-left bg-gray-50 rounded-xl p-4 border border-gray-100">
              <summary className="text-xs font-bold text-gray-500 cursor-pointer select-none uppercase tracking-wider">
                Error details
              </summary>
              <pre className="mt-2 text-[11px] text-red-600 overflow-auto whitespace-pre-wrap break-all">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <a
              href="/"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#CA3433] text-white text-sm font-bold hover:bg-[#ac2d2c] transition-colors shadow-sm shadow-[#CA3433]/20"
            >
              <Home size={16} />
              Go Home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
