import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './App'
import './index.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)

// Register Hand-Crafted Service Worker for PWA Offline Caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('GoEazy PWA Service Worker registered successfully:', reg.scope)
        
        // Check for updates to the service worker
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Broadcast update available event to the UI
                window.dispatchEvent(new CustomEvent('swUpdateAvailable'))
              }
            })
          }
        })
      })
      .catch((err) => {
        console.error('GoEazy Service Worker registration failed:', err)
      })
  })
}

