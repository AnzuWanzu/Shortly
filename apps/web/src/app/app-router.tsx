import { Navigate, Route, Routes } from 'react-router';

import { ApplicationShell } from '../components/layout/application-shell';
import { DashboardPage } from '../features/dashboard/dashboard-page';
import { LoginPage } from '../features/authentication/login-page';
import { SignupPage } from '../features/authentication/signup-page';
import { LinksPage } from '../features/links/links-page';
import { ProfilePage } from '../features/profile/profile-page';
import { ProtectedRoute } from './protected-route';
import { SessionProvider } from './session-provider';

export function AppRouter() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<ApplicationShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="links" element={<LinksPage />} />
            <Route path="settings" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  );
}
