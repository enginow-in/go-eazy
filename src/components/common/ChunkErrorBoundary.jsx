import React from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'

/**
 * ChunkErrorBoundary
 * 
 * Catches errors thrown by React.lazy() when a chunk fails to load
 * (e.g., network failure, Vercel redeployment, ad-blocker interference).
 * 
 * Without this, the entire app crashes to a white screen.
 * With this, users see a friendly recovery UI with a reload button.
 */
class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log for debugging — this won't be suppressed by the console filter
    // because it's a real error, not a noisy vendor message
    console.error('ChunkErrorBoundary caught error:', error, errorInfo)
  }

  isChunkLoadError(error) {
    // Common patterns for chunk/module load failures:
    // - "Loading chunk X failed" (webpack/vite)
    // - "Failed to fetch dynamically imported module" (Vite/Rolldown)
    // - "Importing a module script failed" (browser native)
    const message = error?.message || ''
    return (
      message.includes('Loading chunk') ||
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('error loading dynamically imported module') ||
      error?.name === 'ChunkLoadError'
    )
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/search'
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.isChunkLoadError(this.state.error)

      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            {/* Icon */}
            <div className="w-20 h-20 bg-[#fff5f5] rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
              {isChunkError ? (
                <WifiOff size={36} className="text-[#CA3433]" />
              ) : (
                <span className="text-4xl">😵</span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 font-display mb-3">
              {isChunkError ? 'Connection Issue' : 'Something went wrong'}
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              {isChunkError
                ? 'This page failed to load — probably a network hiccup or a new version was deployed. A quick reload should fix it.'
                : 'An unexpected error occurred while loading this page. Please try reloading.'}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-3 bg-[#CA3433] text-white font-bold text-sm rounded-full hover:bg-[#ac2d2c] transition-all active:scale-95 shadow-lg shadow-[#CA3433]/20"
              >
                <RefreshCw size={16} />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 text-gray-600 font-semibold text-sm rounded-full hover:bg-gray-100 transition-all"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { ChunkErrorBoundary }
