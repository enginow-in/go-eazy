import React from 'react'
import { useNavigate } from 'react-router-dom'

// Inner class component — React error boundaries must be class-based
class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, isChunkError: false }
  }

  static getDerivedStateFromError(error) {
    // Detect chunk/network load failures specifically
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Importing a module script failed')

    return { hasError: true, isChunkError }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset() {
    this.setState({ hasError: false, isChunkError: false })
    this.props.onReset?.()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
          <div className="text-5xl mb-4">
            {this.state.isChunkError ? '📶' : '⚠️'}
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 font-display">
            {this.state.isChunkError ? 'Connection Problem' : 'Something went wrong'}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {this.state.isChunkError
              ? 'A page failed to load, possibly due to a network issue or a recent update. Try refreshing.'
              : 'An unexpected error occurred. Our team has been notified.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#CA3433] text-white rounded-xl font-bold text-sm hover:bg-[#ac2d2c] transition-colors shadow-sm"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                this.handleReset()
                this.props.onGoHome?.()
              }}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}

// Wrapper so the boundary can use hooks via props
export const ErrorBoundary = ({ children }) => {
  const navigate = useNavigate()

  return (
    <ErrorBoundaryInner
      onReset={() => navigate('/')}
      onGoHome={() => navigate('/')}
    >
      {children}
    </ErrorBoundaryInner>
  )
}