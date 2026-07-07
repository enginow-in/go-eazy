import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>

          <p className="text-gray-600 mb-6 text-center">
            Please refresh the page and try again.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="bg-[#CA3433] text-white px-6 py-3 rounded-xl hover:bg-red-700 transition"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}