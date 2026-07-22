import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import propertyReducer from './propertySlice'
import uiReducer from './uiSlice'
import serviceReducer from './serviceSlice'
import notificationReducer from './notificationSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    property: propertyReducer,
    ui: uiReducer,
    service: serviceReducer,
    notifications: notificationReducer,
  },
})
