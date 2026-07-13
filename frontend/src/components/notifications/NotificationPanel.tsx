import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button, Badge } from '@/components/ui';
import type { AppNotification } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  notifications: AppNotification[];
  open: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const notificationIcons: Record<string, string> = {
  deadline: '📅',
  overdue: '⚠️',
  reminder: '🔔',
  insight: '💡',
  achievement: '🏆',
};

export function NotificationPanel({
  notifications,
  open,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 z-50 w-80 max-h-[480px] rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-surface-900 dark:text-surface-50">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="primary">{unreadCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="icon-sm" onClick={onMarkAllRead} aria-label="Mark all read">
                    <CheckIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close notifications">
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[380px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <BellIcon className="h-8 w-8 text-surface-300 mb-2" />
                  <p className="text-sm text-surface-500">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-100 dark:divide-surface-700">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => onMarkRead(notification.id)}
                      className={cn(
                        'w-full text-left p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors',
                        !notification.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg flex-shrink-0">
                          {notificationIcons[notification.type] || '🔔'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm',
                            notification.read
                              ? 'text-surface-600 dark:text-surface-400'
                              : 'font-medium text-surface-900 dark:text-surface-100'
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
