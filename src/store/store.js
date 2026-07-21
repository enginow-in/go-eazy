import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import propertyReducer from './propertySlice'
import uiReducer from './uiSlice'
import serviceReducer from './serviceSlice'
import chatReducer from './chatSlice'
import savedSearchReducer from './savedSearchSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    property: propertyReducer,
    ui: uiReducer,
    service: serviceReducer,
    chat: chatReducer,
    savedSearch: savedSearchReducer,
  },
})
