import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '@/pages/dashboard/ui';
import { ExecutionPage } from '@/pages/execution/ui';
import { SettingsPage } from '@/pages/settings/ui';
import { AuthCallbackPage } from '@/pages/auth-callback/ui';
import { LoginPage } from '@/features/auth/login-by-email/ui';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/execution/:ymCycle" element={<ExecutionPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
