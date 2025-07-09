import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import patientsSlice from './slices/patientsSlice';
import alertsSlice from './slices/alertsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    patients: patientsSlice,
    alerts: alertsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Export types for TypeScript users if needed
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch; 