import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Snackbar, Alert, useTheme } from '@mui/material';
import { toast } from 'react-hot-toast';
import api from '../utils/axios';
import { useAuth } from './AuthContext';

const notificationContext = createContext();

export const useNotification = () => {
  const context = useContext(notificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const lastCountRef = React.useRef(0);

  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const showInfo = (message) => showNotification(message, 'info');
  const showSuccess = (message) => showNotification(message, 'success');
  const showError = (message) => showNotification(message, 'error');
  const showWarning = (message) => showNotification(message, 'warning');

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUnreadCount(0);
      lastCountRef.current = 0;
      return;
    }
    try {
      const res = await api.get('/api/notifications/unread/count');
      const newCount = res.data?.count ?? 0;
      console.log(`[Notification Diagnostic] User: ${user?.id} (${user?.role}) | New Count: ${newCount} | Prev: ${lastCountRef.current}`);

      if (newCount > lastCountRef.current) {
        console.log(`[Notification Diagnostic] Fetching latest notification for ${user?.id}...`);
        try {
          const latestRes = await api.get('/api/notifications', { params: { limit: 1 } });
          const latest = latestRes.data?.notifications?.[0];
          console.log('[Notification Diagnostic] Latest notification:', latest);
          if (latest && !latest.isRead) {
            toast.success((t) => (
              <div onClick={() => toast.dismiss(t.id)}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: theme.palette.text.primary }}>
                  {latest.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: theme.palette.text.secondary, marginTop: '4px' }}>
                  {latest.message}
                </div>
              </div>
            ), {
              duration: 6000,
              icon: '🔔',
              style: {
                borderRadius: '12px',
                background: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.palette.mode === 'light'
                  ? '0 4px 12px rgba(0,0,0,0.1)'
                  : '0 10px 24px rgba(0,0,0,0.35)'
              }
            });

            showInfo(`${latest.title}: ${latest.message}`);
          }
        } catch (latestErr) {
          console.error('Failed to fetch latest notification for popup:', latestErr);
        }
      }

      setUnreadCount(newCount);
      lastCountRef.current = newCount;
    } catch (error) {
      if (error?.response?.status === 401) {
        setUnreadCount(0);
        lastCountRef.current = 0;
        return;
      }
      console.error('Fetch unread count error:', error);
    }
  }, [showInfo, theme, user?.id, user?.role]);

  const fetchNotifications = useCallback(async (limit = 10) => {
    setLoadingNotifications(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoadingNotifications(false);
      return;
    }
    try {
      const res = await api.get('/api/notifications', { params: { limit } });
      setNotifications(res.data?.notifications ?? []);
      if (typeof res.data?.unreadCount === 'number') {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      console.error('Fetch notifications error:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (
        n.id === id ? { ...n, isRead: true } : n
      )));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(intervalId);
  }, [fetchUnreadCount]);

  return (
    <notificationContext.Provider value={{
      showNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      notifications,
      unreadCount,
      loadingNotifications,
      fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={hideNotification}
          severity={notification.severity}
          sx={{
            borderRadius: '20px',
            fontSize: '1rem',
            fontWeight: 500
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </notificationContext.Provider>
  );
};
