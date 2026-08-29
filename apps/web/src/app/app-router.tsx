import { Navigate, Route, Routes } from 'react-router';

import { LoginPage } from '../features/authentication/login-page';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
