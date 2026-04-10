import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import api from '../utils/axios';

const notificationContext = createContext();

export const useNotification = () => {
  const context = useContext(notificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/api/notifications/unread/count');
      setUnreadCount(res.data?.count ?? 0);
    } catch (error) {
      if (error?.response?.status === 401) {
        setUnreadCount(0);
        return;
      }
      console.error('Fetch unread count error:', error);
    }
  }, []);

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
      setNotifications(prev => prev.map((n) => (
        n.id === id ? { ...n, isRead: true } : n
      )));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  }, []);

  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const showSuccess = (message) => showNotification(message, 'success');
  const showError = (message) => showNotification(message, 'error');
  const showWarning = (message) => showNotification(message, 'warning');
  const showInfo = (message) => showNotification(message, 'info');

  useEffect(() => {
    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 20000);
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
