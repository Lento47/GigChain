import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  UserPlusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EyeIcon,
  SparklesIcon,
  BriefcaseIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  XMarkIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: 'connection' | 'like' | 'comment' | 'mention' | 'opportunity' | 'achievement' | 'trending' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  relatedPostId?: string;
  relatedUserId?: string;
}

interface SmartNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high-priority'>('all');

  // Mock data para notificaciones inteligentes
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Nueva oportunidad de trabajo',
        message: 'Se publicó un trabajo de React Developer que coincide con tu perfil',
        timestamp: '2m ago',
        read: false,
        priority: 'high',
        actionUrl: '/feed?filter=jobs',
        relatedPostId: 'job-123'
      },
      {
        id: '2',
        type: 'mention',
        title: 'Te mencionaron en un post',
        message: 'Alex Chen te mencionó en su publicación sobre DeFi',
        timestamp: '5m ago',
        read: false,
        priority: 'medium',
        actionUrl: '/feed',
        relatedPostId: 'post-456'
      },
      {
        id: '3',
        type: 'trending',
        title: 'Tema trending',
        message: 'El tema "Web3 Jobs" está trending. Considera participar en la conversación',
        timestamp: '15m ago',
        read: true,
        priority: 'low',
        actionUrl: '/feed?filter=trending'
      },
      {
        id: '4',
        type: 'connection',
        title: 'Nueva solicitud de conexión',
        message: 'Sarah Johnson quiere conectar contigo',
        timestamp: '1h ago',
        read: false,
        priority: 'medium',
        actionUrl: '/connections',
        relatedUserId: 'user-789'
      },
      {
        id: '5',
        type: 'achievement',
        title: '¡Nuevo logro desbloqueado!',
        message: 'Has alcanzado 100 likes en tus publicaciones',
        timestamp: '2h ago',
        read: true,
        priority: 'low',
        actionUrl: '/profile/achievements'
      },
      {
        id: '6',
        type: 'reminder',
        title: 'Recordatorio',
        message: 'Tienes una reunión programada en 30 minutos',
        timestamp: '3h ago',
        read: false,
        priority: 'high',
        actionUrl: '/calendar'
      }
    ];
    
    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection': return UserPlusIcon;
      case 'like': return HeartIcon;
      case 'comment': return ChatBubbleLeftIcon;
      case 'mention': return ShareIcon;
      case 'opportunity': return BriefcaseIcon;
      case 'achievement': return TrophyIcon;
      case 'trending': return SparklesIcon;
      case 'reminder': return CalendarIcon;
      default: return BellIcon;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    if (priority === 'medium') return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'high-priority') return notification.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-xl bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{unreadCount}</span>
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Notificaciones Inteligentes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mantente al día con lo que importa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-4">
          {[
            { id: 'all', label: 'Todas', count: notifications.length },
            { id: 'unread', label: 'No leídas', count: unreadCount },
            { id: 'high-priority', label: 'Importantes', count: notifications.filter(n => n.priority === 'high').length }
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === filterOption.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>

        {/* Mark all as read */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="w-full mb-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
          >
            Marcar todas como leídas
          </button>
        )}

        {/* Notifications List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNotifications.map((notification) => {
            const NotificationIcon = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                  notification.read
                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 shadow-sm'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}>
                    <NotificationIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {notification.timestamp}
                      </span>
                      <div className="flex items-center space-x-2">
                        {notification.priority === 'high' && (
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                            Importante
                          </span>
                        )}
                        {notification.actionUrl && (
                          <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                            Ver →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Smart Suggestions */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                Sugerencias Inteligentes
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Basado en tu actividad, considera participar en temas de "DeFi" y "React" que están trending.
              </p>
              <button className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                Ver sugerencias →
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
            Configurar notificaciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartNotifications;
