import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from './AdminLayout';
import EmployeeLayout from './EmployeeLayout';
import LoginView from '../components/LoginView';

export default function RootLayout() {
  const { authUser, isRestoringSession, userRoleCode, handleLoginSuccess, triggerNotification } = useAuth();

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Memulihkan Sesi ERP</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} onTriggerNotification={triggerNotification} />;
  }

  if (userRoleCode === 'employee') {
    return <EmployeeLayout />;
  }

  return <AdminLayout />;
}
