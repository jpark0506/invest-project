import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userApi } from '@/entities/user/api';
import { useUserStore } from '@/entities/user/model';

interface LayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
  showBackButton?: boolean;
  title?: string;
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function Layout({ children, hideBottomNav, showBackButton, title }: LayoutProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const clearUser = useUserStore((state) => state.clearUser);

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard'), Icon: DashboardIcon },
    { path: '/settings', label: t('nav.settings'), Icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    await userApi.logout();
    clearUser();
    navigate('/login');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          {showBackButton ? (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-text-primary hover:text-primary transition-colors"
              >
                <BackIcon className="w-6 h-6" />
              </button>
              <span className="text-lg font-bold text-text-primary">{title}</span>
              <div className="w-6" /> {/* Spacer for alignment */}
            </>
          ) : (
            <>
              <Link to="/dashboard" className="flex items-center gap-2">
                <img src="/favicon.svg" alt="Logo" className="w-7 h-7" />
                <span className="text-lg font-bold text-text-primary">Invest Assist</span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm text-text-secondary"
              >
                {t('auth.logout')}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className={`max-w-lg mx-auto px-4 py-6 ${hideBottomNav ? '' : 'pb-24'}`}>{children}</main>

      {/* Bottom navigation */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border pb-safe">
          <div className="max-w-lg mx-auto flex">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex flex-col items-center py-3 transition-colors ${
                    isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <item.Icon className="w-6 h-6 mb-1" />
                  <span className="text-2xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
