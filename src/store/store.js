import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import propertyReducer from './propertySlice'
import uiReducer from './uiSlice'
import serviceReducer from './serviceSlice'

// Verify production environments safely to freeze state exposure
const isProduction = process.env.NODE_ENV === 'production'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    property: propertyReducer,
    ui: uiReducer,
    service: serviceReducer,
  },
  // Secure internal pipeline configurations against serializability noise
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific actions or state paths if they carry complex network instances
        ignoredActions: ['property/setCurrentProperty', 'service/setCurrentService'],
        ignoredPaths: ['property.currentProperty', 'service.currentService'],
      },
    }),
  // Toggle DevTools capability based on absolute runtime environment state
  devTools: !isProduction,
})