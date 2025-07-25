import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import patientsSlice from './slices/patientsSlice';
import alertsSlice from './slices/alertsSlice';
import medicationSlice from './slices/medicationSlice';
import languageSlice from './slices/languageSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    patients: patientsSlice,
    alerts: alertsSlice,
    medication: medicationSlice,
    language: languageSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        // 提供更详细的错误信息以便调试
        warnAfter: 32,
        // 在开发环境中启用检查，生产环境可以考虑禁用以提高性能
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
      },
    }),
});

// Export types for TypeScript users if needed
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch; 