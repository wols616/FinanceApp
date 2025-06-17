import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, TrendingUp, Calendar } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'budget' | 'goal' | 'reminder' | 'info';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export const NotificationCenter: React.FC = () => {
  const { budgets, categories, getCategoryExpenses } = useFinance();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    generateNotifications();
  }, [budgets, categories]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];

    // Budget notifications
    budgets.forEach(budget => {
      const spent = getCategoryExpenses(budget.category_id);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const categoryName = categories.find(cat => cat.id === budget.category_id)?.name || 'Categoría';

      if (spent > budget.amount) {
        newNotifications.push({
          id: `budget-exceeded-${budget.id}`,
          type: 'budget',
          title: 'Presupuesto Excedido',
          message: `Has excedido el presupuesto de ${categoryName} por $${(spent - budget.amount).toFixed(2)}`,
          date: new Date(),
          read: false,
          priority: 'high'
        });
      } else if (percentage > 80) {
        newNotifications.push({
          id: `budget-warning-${budget.id}`,
          type: 'budget',
          title: 'Presupuesto Casi Agotado',
          message: `Has usado el ${percentage.toFixed(1)}% del presupuesto de ${categoryName}`,
          date: new Date(),
          read: false,
          priority: 'medium'
        });
      }
    });

    // Add some example notifications
    newNotifications.push(
      {
        id: 'welcome',
        type: 'info',
        title: 'Bienvenido a FinanceApp',
        message: 'Comienza registrando tus primeras transacciones para obtener insights de tus finanzas.',
        date: new Date(),
        read: false,
        priority: 'low'
      },
      {
        id: 'monthly-report',
        type: 'info',
        title: 'Reporte Mensual Disponible',
        message: 'Tu reporte financiero del mes está listo para revisar.',
        date: new Date(),
        read: false,
        priority: 'medium'
      }
    );

    // Load read status from localStorage
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    newNotifications.forEach(notification => {
      if (readNotifications.includes(notification.id)) {
        notification.read = true;
      }
    });

    setNotifications(newNotifications);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget':
        return AlertTriangle;
      case 'goal':
        return TrendingUp;
      case 'reminder':
        return Calendar;
      default:
        return Info;
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getIconColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    // Save to localStorage
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotifications.includes(id)) {
      readNotifications.push(id);
      localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Remove from localStorage
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    const updatedReadNotifications = readNotifications.filter((notifId: string) => notifId !== id);
    localStorage.setItem('readNotifications', JSON.stringify(updatedReadNotifications));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                </p>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getNotificationColor(notification.priority)}`}>
                          <Icon className={`w-4 h-4 ${getIconColor(notification.priority)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <X className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {format(notification.date, 'dd MMM, HH:mm', { locale: es })}
                            </span>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Marcar como leída
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay notificaciones</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={markAllAsRead}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Marcar todas como leídas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};