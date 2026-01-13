import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
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
const LoginPage = lazy(() =>
  import('@/features/auth/login-by-email/ui').then((m) => ({ default: m.LoginPage }))
);
const OnboardingPage = lazy(() =>
  import('@/pages/onboarding/ui').then((m) => ({ default: m.OnboardingPage }))
);

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

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
      </Routes>
    </Suspense>
  );
}
