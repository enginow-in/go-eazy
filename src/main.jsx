import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store/store'
import App from './App'
import './index.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />

      {/* ✅ Global Centralized Toaster */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={10}
        toastOptions={{
          duration: 4000,
          ariaProps: {
            role: 'status',
            'aria-live': 'polite',
          },
          style: {
            borderRadius: '12px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '14px',
            color: '#1F2937',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            padding: '14px 16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
          },
          success: {
            duration: 3500,
            iconTheme: {
              primary: '#CA3433',
              secondary: '#FFFFFF',
            },
          },
          error: {
            duration: 5000,
            ariaProps: {
              role: 'alert',
              'aria-live': 'assertive',
            },
            iconTheme: {
              primary: '#DC2626',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </Provider>
  </React.StrictMode>,
)