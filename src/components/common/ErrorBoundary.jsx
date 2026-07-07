import React from 'react'

/**
 * ErrorBoundary — catches render-time errors and lazy chunk load failures
 * that <Suspense> cannot handle. Must be a class component per React spec.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Suspense fallback={<Spinner />}>
 *       <Routes>...</Routes>
 *     </Suspense>
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.handleReset = this.handleReset.bind(this)
  }

  // Called during rendering when a descendant throws.
  // Return value merges into state.
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  // Called after the error has been thrown, good for logging.
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  // Reset state to re-attempt rendering children (re-triggers the lazy import).
  handleReset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Allow a custom fallback UI to be passed in as a prop
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isChunkError =
        this.state.error?.name === 'ChunkLoadError' ||
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Loading chunk')

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border-2 border-red-100 shadow-sm">
            <span className="text-4xl" role="img" aria-label="warning">⚠️</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-black text-gray-900 mb-2 font-display">
            {isChunkError ? 'Page Failed to Load' : 'Something Went Wrong'}
          </h1>

          {/* Description */}
          <p className="text-gray-500 text-sm max-w-sm mb-8 leading-relaxed">
            {isChunkError
              ? 'This page could not be loaded, possibly due to a slow or interrupted network connection. Please try again.'
              : 'An unexpected error occurred. Our team has been notified. Please try refreshing the page.'}
          </p>

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-8 py-3 bg-[#CA3433] text-white font-bold rounded-full hover:bg-[#a52a2a] transition-all duration-200 shadow-lg shadow-red-500/20 active:scale-95"
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/' }}
              className="text-sm text-gray-400 hover:text-gray-700 font-semibold transition-colors underline underline-offset-4"
            >
              Go back to Home
            </button>
          </div>

          {/* Dev-only error details */}
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-10 w-full max-w-lg text-left bg-gray-900 text-red-300 rounded-xl p-4 text-xs font-mono overflow-auto">
              <summary className="cursor-pointer font-bold text-red-400 mb-2">
                Developer Info (dev only)
              </summary>
              <pre className="whitespace-pre-wrap break-all">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
