import { useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/shared/api';
import { useUserStore } from '@/entities/user/model';
import { userApi } from '@/entities/user/api';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to restore auth from refresh token cookie
        const hasToken = await apiClient.initAuth();

        if (hasToken) {
          // Fetch user data
          const { user } = await userApi.getMe();
          setUser(user);
        } else {
          clearUser();
        }
      } catch {
        clearUser();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [setUser, clearUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
