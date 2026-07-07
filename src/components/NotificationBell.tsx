import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import echo from '../services/echo';
import { API_BASE_URL } from '../services/api';

export interface NotificationItem {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    type?: string;
    link?: string;
  };
  created_at: string;
  read_at: string | null;
}

export const NotificationBell: React.FC = () => {
  const { authUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('cvba_api_token');
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data);
        setUnreadCount(result.unread_count);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (!authUser) return;

    fetchNotifications();

    // Listen to real-time events
    echo.private(`App.Models.User.${authUser.id}`)
      .notification((notification: any) => {
        // Notification is broadcasted via Reverb
        const newNotif: NotificationItem = {
          id: notification.id,
          type: notification.type,
          data: {
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
          },
          created_at: new Date().toISOString(),
          read_at: null
        };
        
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

    return () => {
      echo.leave(`App.Models.User.${authUser.id}`);
    };
  }, [authUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('cvba_api_token');
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('cvba_api_token');
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getIconColor = (type?: string) => {
    switch(type) {
      case 'success': return 'text-emerald-500 bg-emerald-50';
      case 'warning': return 'text-amber-500 bg-amber-50';
      case 'error': return 'text-rose-500 bg-rose-50';
      default: return 'text-indigo-500 bg-indigo-50';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors rounded-full hover:bg-slate-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              Notifikasi
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                  {unreadCount} baru
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1"
              >
                <Check size={14} /> Tandai dibaca
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell size={32} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm">Belum ada notifikasi.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 transition-colors hover:bg-slate-50 ${!notif.read_at ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => !notif.read_at && markAsRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getIconColor(notif.data.type)}`}>
                        <Bell size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.read_at ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                          {notif.data.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {notif.data.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                          {new Date(notif.created_at).toLocaleString('id-ID', {
                            hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
                          })}
                        </p>
                      </div>
                      {!notif.read_at && (
                        <div className="shrink-0 pt-1">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
