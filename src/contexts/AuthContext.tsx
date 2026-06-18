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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const storedUser = authStorage.getUser();
  const [authUser, setAuthUser] = useState<AuthUser | null>(storedUser);
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(storedUser && authStorage.getToken()));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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

  useEffect(() => {
    if (!authStorage.getToken()) {
      setIsRestoringSession(false);
      return;
    }

    authApi.me()
      .then((user) => {
        setAuthUser(user);
      })
      .catch((error: Error) => {
        setAuthUser(null);
        triggerNotification(error.message);
      })
      .finally(() => setIsRestoringSession(false));
  }, [triggerNotification]);

  const handleLoginSuccess = (session: AuthSession) => {
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
