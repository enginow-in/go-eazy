import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary: render error', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-[#CA3433]">
          <AlertTriangle size={30} />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-gray-500">This page encountered an unexpected error. Try again or return to the property search.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={this.handleReset} className="inline-flex items-center gap-2 rounded-xl bg-[#CA3433] px-5 py-3 text-sm font-bold text-white hover:bg-[#a92b2a]">
            <RefreshCw size={16} /> Try again
          </button>
          <a href="/search" className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200">Back to search</a>
        </div>
      </section>
    )
  }
}
