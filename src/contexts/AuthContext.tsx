import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthSession } from '../types';
import { authStorage, authApi } from '../services/api';
import { useToast } from '../hooks/useToast';

interface AuthContextType {
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  isRestoringSession: boolean;
  userRoleName: string;
  userRoleCode: string;
  userEmail: string;
  handleLoginSuccess: (session: AuthSession) => void;
  handleLogout: () => Promise<void>;
  isOnline: boolean;
  toast: string | null;
  triggerNotification: (msg: string) => void;
}

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 menit
const LAST_ACTIVITY_KEY = 'cvba_last_activity';
const ACTIVITY_UPDATE_THROTTLE_MS = 3000;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const storedUser = authStorage.getUser();
  const [authUser, setAuthUser] = useState<AuthUser | null>(storedUser);
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(storedUser && authStorage.getToken()));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isLoggingOutRef = React.useRef(false);
  
  const { toast, triggerNotification } = useToast();

  const userRoleName = authUser?.role?.name ?? 'User';
  const userRoleCode = authUser?.role?.code ?? 'admin';
  const userEmail = authUser?.email ?? '';

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerNotification('Koneksi internet terhubung kembali.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerNotification('Koneksi internet terputus.');
    };
    const handleUnauthorized = () => {
      setAuthUser(null);
      triggerNotification('Sesi Anda telah berakhir. Silakan masuk kembali.');
    };
    const handleProfileUpdated = () => {
      const updatedUser = authStorage.getUser();
      if (updatedUser) {
        setAuthUser(updatedUser);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('profile:updated', handleProfileUpdated);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('profile:updated', handleProfileUpdated);
    };
  }, [triggerNotification]);

  // Idle timeout tracking for non-remembered sessions (30 minutes of inactivity)
  useEffect(() => {
    if (!authUser || authStorage.isRemembered()) {
      return;
    }

    if (!sessionStorage.getItem(LAST_ACTIVITY_KEY)) {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }

    let lastWrite = Date.now();
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastWrite > ACTIVITY_UPDATE_THROTTLE_MS) {
        lastWrite = now;
        sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      }
    };

    const triggerIdleLogout = async () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      try {
        if (authStorage.getToken()) {
          await authApi.logout();
        }
      } catch {
        authStorage.clear();
      }

      setAuthUser(null);
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);

      import('sweetalert2').then((SwalModule) => {
        SwalModule.default.fire({
          icon: 'info',
          title: 'Sesi Telah Berakhir',
          text: 'Anda telah keluar dari sistem secara otomatis karena tidak ada aktivitas selama 30 menit.',
          confirmButtonText: 'Masuk Kembali',
          buttonsStyling: false,
          customClass: {
            popup: 'rounded-2xl border border-sky-100 shadow-xl bg-white font-sans text-xs',
            title: 'text-sm font-bold text-slate-900 pt-4',
            htmlContainer: 'text-xs text-slate-500 py-2',
            confirmButton: 'btn btn-primary btn-md px-5 py-2 rounded-xl text-white font-semibold',
          },
        });
      });
    };

    const checkIdle = () => {
      if (isLoggingOutRef.current) return;
      const lastActStr = sessionStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActivity = lastActStr ? Number(lastActStr) : Date.now();
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        triggerIdleLogout();
      }
    };

    // Check periodically every 15 seconds
    const intervalId = window.setInterval(checkIdle, 15000);

    // Listen to user interaction events
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((ev) => window.addEventListener(ev, recordActivity, { passive: true }));

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkIdle();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkIdle);

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, recordActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkIdle);
    };
  }, [authUser]);

  useEffect(() => {
    if (!authStorage.getToken()) {
      setIsRestoringSession(false);
      return;
    }

    authApi.me()
      .then((user) => {
        setAuthUser(user);
        if (!sessionStorage.getItem(LAST_ACTIVITY_KEY)) {
          sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        }
      })
      .catch((error: Error) => {
        setAuthUser(null);
        triggerNotification(error.message);
      })
      .finally(() => setIsRestoringSession(false));
  }, [triggerNotification]);

  const handleLoginSuccess = (session: AuthSession) => {
    isLoggingOutRef.current = false;
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    setAuthUser(session.user);
  };

  const handleLogout = async () => {
    import('sweetalert2').then(async (SwalModule) => {
      const Swal = SwalModule.default;
      const result = await Swal.fire({
        title: 'Keluar dari Sistem?',
        text: "Anda harus masuk kembali untuk menggunakan sistem ini.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'Ya, Keluar',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        if (authStorage.getToken()) {
          try {
            await authApi.logout();
          } catch (error) {
            triggerNotification(error instanceof Error ? error.message : 'Logout gagal. Silakan coba lagi.');
          }
        } else {
          authStorage.clear();
        }

        sessionStorage.removeItem(LAST_ACTIVITY_KEY);
        setAuthUser(null);
        triggerNotification('Sampai jumpa! Anda berhasil logout.');
      }
    });
  };

  return (
    <AuthContext.Provider value={{
      authUser, setAuthUser, isRestoringSession,
      userRoleName, userRoleCode, userEmail,
      handleLoginSuccess, handleLogout,
      isOnline, toast, triggerNotification
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
