import { useState, useCallback, useEffect } from 'react';
import type { AuthSession, AuthUser, ViewType } from '../types';
import { authApi, authStorage } from '../services/api';
import { DEFAULT_AUTHENTICATED_VIEW } from '../routes';

interface UseAuthReturn {
  authUser: AuthUser | null;
  isRestoringSession: boolean;
  setAuthUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  handleLoginSuccess: (session: AuthSession, onNavigate: (view: ViewType) => void) => void;
  handleLogout: (onNavigate: (view: ViewType) => void, onNotify: (msg: string) => void) => Promise<void>;
  restoreSession: (onNavigate: (view: ViewType, replace?: boolean) => void, onNotify: (msg: string) => void) => void;
}

/**
 * Custom hook untuk mengelola state autentikasi global.
 * Menggantikan state yang sebelumnya tersebar di App.tsx.
 *
 * Computed values yang tersedia dari authUser:
 *   - authUser?.role?.name ?? 'User'        → userRole
 *   - authUser?.role?.code ?? 'admin'       → userRoleCode
 *   - authUser?.email ?? ''                 → userEmail
 *   - authUser?.name                        → userName
 *   - authUser?.role?.permissions           → userPermissions
 */
export function useAuth(): UseAuthReturn {
  const [authUser, setAuthUser] = useState<AuthUser | null>(authStorage.getUser());
  const [isRestoringSession, setIsRestoringSession] = useState(
    Boolean(authStorage.getUser() && authStorage.getToken())
  );

  const handleLoginSuccess = useCallback(
    (session: AuthSession, onNavigate: (view: ViewType) => void) => {
      setAuthUser(session.user);
      const defaultView: ViewType =
        session.user.role?.code === 'employee' ? 'employee-dashboard' : 'dashboard';
      onNavigate(defaultView);
    },
    []
  );

  const handleLogout = useCallback(
    async (onNavigate: (view: ViewType) => void, onNotify: (msg: string) => void) => {
      if (authStorage.getToken()) {
        try {
          await authApi.logout();
        } catch (error) {
          onNotify(error instanceof Error ? error.message : 'Logout gagal. Silakan coba lagi.');
        }
      } else {
        authStorage.clear();
      }
      setAuthUser(null);
      onNavigate('login');
      onNotify('Sampai jumpa! Anda berhasil logout.');
    },
    []
  );

  const restoreSession = useCallback(
    (onNavigate: (view: ViewType, replace?: boolean) => void, onNotify: (msg: string) => void) => {
      if (!authStorage.getToken()) {
        setIsRestoringSession(false);
        return;
      }

      authApi
        .me()
        .then((user) => {
          setAuthUser(user);
          const defaultView: ViewType =
            user.role?.code === 'employee' ? 'employee-dashboard' : DEFAULT_AUTHENTICATED_VIEW;
          onNavigate(defaultView, true);
        })
        .catch((error: Error) => {
          setAuthUser(null);
          onNavigate('login', true);
          onNotify(error.message);
        })
        .finally(() => setIsRestoringSession(false));
    },
    []
  );

  return {
    authUser,
    isRestoringSession,
    setAuthUser,
    handleLoginSuccess,
    handleLogout,
    restoreSession,
  };
}
