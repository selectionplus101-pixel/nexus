import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, Calendar, X } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Notification {
  id: number;
  type: 'message' | 'connection' | 'investment' | 'meeting';
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  time: string;
  unread: boolean;
  actionUrl?: string;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'message',
      user: {
        id: '1',
        name: 'Sarah Johnson',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg'
      },
      content: 'sent you a message about your startup',
      time: '5 minutes ago',
      unread: true,
      actionUrl: '/messages'
    },
    {
      id: 2,
      type: 'meeting',
      user: {
        id: '2',
        name: 'Michael Rodriguez',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg'
      },
      content: 'scheduled a meeting with you for tomorrow at 2 PM',
      time: '2 hours ago',
      unread: true,
      actionUrl: '/meetings'
    },
    {
      id: 3,
      type: 'investment',
      user: {
        id: '3',
        name: 'Jennifer Lee',
        avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg'
      },
      content: 'showed interest in investing in your startup',
      time: '1 day ago',
      unread: false
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={16} className="text-primary-600" />;
      case 'connection':
        return <UserPlus size={16} className="text-secondary-600" />;
      case 'investment':
        return <DollarSign size={16} className="text-accent-600" />;
      case 'meeting':
        return <Calendar size={16} className="text-success-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, unread: false }))
    );
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => n.unread)
    : notifications;

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with your network activity
            {unreadCount > 0 && (
              <span className="ml-2 text-primary-600 font-medium">
                ({unreadCount} unread)
              </span>
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications list */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
            <p className="text-gray-600 mt-2">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <Card
              key={notification.id}
              className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
                notification.unread ? 'bg-primary-50 border-primary-100' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardBody className="flex items-start p-4">
                <Avatar
                  src={notification.user.avatar}
                  alt={notification.user.name}
                  size="md"
                  className="flex-shrink-0 mr-4"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {notification.user.name}
                    </span>
                    {notification.unread && (
                      <Badge variant="primary" size="sm" rounded>New</Badge>
                    )}
                  </div>

                  <p className="text-gray-600 mt-1">
                    {notification.content}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    {getNotificationIcon(notification.type)}
                    <span>{notification.time}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
