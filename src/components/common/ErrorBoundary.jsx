import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-[#CA3433] mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 font-display mb-2">Something went wrong</h1>
            <p className="text-gray-500 font-medium mb-6">
              An unexpected error occurred during rendering. Please try reloading the application.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-3.5 px-6 rounded-xl bg-[#CA3433] text-white font-bold text-sm hover:bg-[#ac2d2c] transition-all shadow-md shadow-red-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 text-left bg-gray-50 rounded-xl p-4 overflow-x-auto max-h-48 border border-gray-200">
                <p className="text-xs font-bold text-red-600 mb-1">{this.state.error.toString()}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-gray-500 font-mono leading-relaxed whitespace-pre">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
