import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import App from './App'
import './index.css'
import './i18n'
import { Toaster } from "react-hot-toast"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
      position="bottom-right"
      reverseOrder={false}
      toastOptions={{
        duration: 2000,
        style: {
          borderRadius: "14px",
          background: "#111827",
          color: "#fff",
          padding: "14px 18px",
        },
      }}
    />
    </Provider>
  </React.StrictMode>,
)
