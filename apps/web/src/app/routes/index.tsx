import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { PageLoader } from '@/shared/ui';
import { AuthCallbackPage } from '@/pages/auth-callback/ui';

// Lazy load pages for code splitting
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/ui').then((m) => ({ default: m.DashboardPage }))
);
const ExecutionPage = lazy(() =>
  import('@/pages/execution/ui').then((m) => ({ default: m.ExecutionPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/settings/ui').then((m) => ({ default: m.SettingsPage }))
);
const SettingsPortfolioPage = lazy(() =>
  import('@/pages/settings-portfolio/ui').then((m) => ({ default: m.SettingsPortfolioPage }))
);
const SettingsPlanPage = lazy(() =>
  import('@/pages/settings-plan/ui').then((m) => ({ default: m.SettingsPlanPage }))
);
const SettingsAccountPage = lazy(() =>
  import('@/pages/settings-account/ui').then((m) => ({ default: m.SettingsAccountPage }))
);
const LoginPage = lazy(() =>
  import('@/features/auth/login-by-email/ui').then((m) => ({ default: m.LoginPage }))
);
const OnboardingPage = lazy(() =>
  import('@/pages/onboarding/ui').then((m) => ({ default: m.OnboardingPage }))
);

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireOnboarding={false}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/execution/:ymCycle"
          element={
            <ProtectedRoute>
              <ExecutionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/portfolio"
          element={
            <ProtectedRoute>
              <SettingsPortfolioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/plan"
          element={
            <ProtectedRoute>
              <SettingsPlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/account"
          element={
            <ProtectedRoute>
              <SettingsAccountPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
