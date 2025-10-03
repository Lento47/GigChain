import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, AlertCircle, CheckCircle, Info, AlertTriangle, Filter, CheckCheck } from 'lucide-react';
import './NotificationCenter.css';

export const NotificationCenter = ({ notifications = [], onMarkAsRead, onClearAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  // Función para cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="notification-icon success" />;
      case 'error': return <AlertCircle size={16} className="notification-icon error" />;
      case 'warning': return <AlertTriangle size={16} className="notification-icon warning" />;
      case 'info': 
      default: return <Info size={16} className="notification-icon info" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': 
      default: return '#3b82f6';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const handleMarkAsRead = (id) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleClearAll = () => {
    if (onClearAll) {
      onClearAll();
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    return time.toLocaleDateString();
  };

  return (
    <div className="notification-center" ref={notificationRef}>
      <button 
        className="notification-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            <div className="notification-actions">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="notification-filter"
              >
                <option value="all">Todas</option>
                <option value="unread">No leídas</option>
                <option value="success">Éxito</option>
                <option value="error">Error</option>
                <option value="warning">Advertencia</option>
                <option value="info">Info</option>
              </select>
              <button 
                className="clear-all-btn"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {filteredNotifications.length === 0 ? (
              <div className="no-notifications">
                <Bell size={48} className="no-notifications-icon" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <div className="notification-icon-container">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTime(notification.timestamp)}
                    </div>
                    {notification.action && (
                      <button 
                        className="notification-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (notification.action.onClick) {
                            notification.action.onClick();
                          }
                        }}
                      >
                        {notification.action.label}
                      </button>
                    )}
                  </div>

                  {!notification.read && (
                    <div className="notification-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="mark-all-read-btn"
                onClick={() => notifications.forEach(n => !n.read && handleMarkAsRead(n.id))}
              >
                <CheckCheck size={16} />
                Marcar todas como leídas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const NotificationProvider = ({ children, walletState }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const clearRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
  };

  // Auto-clear old notifications
  useEffect(() => {
    const timer = setInterval(() => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      setNotifications(prev => 
        prev.filter(n => new Date(n.timestamp) > oneDayAgo)
      );
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, []);

  // Handle network status notifications
  useEffect(() => {
    if (walletState) {
      const { isConnected, isCorrectChain, switchToCorrectChain } = walletState;
      
      // Remove existing network notifications
      setNotifications(prev => prev.filter(n => n.id !== 'network-warning'));
      
      // Add network warning if wallet is connected but on wrong chain
      if (isConnected && !isCorrectChain) {
        const networkNotification = {
          id: 'network-warning',
          type: 'warning',
          title: 'Red Incorrecta',
          message: 'Tu wallet está conectado a una red diferente. Haz clic para cambiar a Mumbai.',
          timestamp: new Date().toISOString(),
          read: false,
          persistent: true,
          action: {
            label: 'Cambiar a Mumbai',
            onClick: switchToCorrectChain
          }
        };
        
        setNotifications(prev => [networkNotification, ...prev]);
      }
    }
  }, [walletState]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      clearAll,
      clearRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const NotificationContext = React.createContext();

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationCenter;
