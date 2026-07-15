import React from 'react'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary: caught render error', error, errorInfo)
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-white text-center px-4">
          <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 mb-6 mx-auto">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            This page ran into an unexpected error. You can try again, or head back to the homepage.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors"
            >
              <RotateCcw size={18} /> Try again
            </button>
            <a
              href="/search"
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              <Home size={18} /> Back to Home
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
