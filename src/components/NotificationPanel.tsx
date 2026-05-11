'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  X,
  ChevronDown,
  Clock,
  FileSignature,
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, subDays, parseISO } from 'date-fns';

interface NotificationPanelProps {
  children: React.ReactNode;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  info: {
    icon: <Info className="h-4 w-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  success: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  error: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

const categoryIcons: Record<string, React.ReactNode> = {
  document: <FileText className="h-3.5 w-3.5" />,
  signature: <FileSignature className="h-3.5 w-3.5" />,
  workflow: <ShieldCheck className="h-3.5 w-3.5" />,
  system: <Settings className="h-3.5 w-3.5" />,
  mention: <Users className="h-3.5 w-3.5" />,
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function NotificationPanel({ children }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, navigate } = useAppStore();
  const [open, setOpen] = useState(false);
  const [showCount, setShowCount] = useState(10);

  // Group notifications by time
  const groupedNotifications = useMemo(() => {
    const today: typeof notifications = [];
    const yesterday: typeof notifications = [];
    const earlier: typeof notifications = [];

    notifications.forEach((n) => {
      try {
        const date = parseISO(n.createdAt);
        if (isToday(date)) today.push(n);
        else if (isYesterday(date)) yesterday.push(n);
        else earlier.push(n);
      } catch {
        earlier.push(n);
      }
    });

    return { today, yesterday, earlier };
  }, [notifications]);

  const displayedNotifications = notifications.slice(0, showCount);
  const hasMore = notifications.length > showCount;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      setOpen(false);
      // Navigate to the relevant page
      navigate('documents');
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const loadMore = () => {
    setShowCount((prev) => prev + 10);
  };

  const renderGroup = (label: string, items: typeof notifications) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        {items.slice(0, showCount).map((notification) => {
          const config = typeConfig[notification.type] || typeConfig.info;
          const catIcon = categoryIcons[notification.category];

          return (
            <div key={notification.id} className="relative">
              <button
                className={cn(
                  'w-full text-left p-3 hover:bg-accent/50 transition-colors flex gap-3',
                  !notification.isRead && 'bg-primary/5'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Type icon */}
                <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${config.bgColor}`}>
                  <div className={config.color}>{config.icon}</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm leading-tight', !notification.isRead && 'font-semibold')}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {catIcon && (
                      <span className="text-muted-foreground">{catIcon}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  className="shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 p-0.5 rounded transition-opacity"
                  onClick={(e) => handleDismiss(e, notification.id)}
                  title="Dismiss"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </button>
              <Separator />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-primary hover:text-primary"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <ScrollArea className="h-[420px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="group">
              {renderGroup('Today', groupedNotifications.today)}
              {renderGroup('Yesterday', groupedNotifications.yesterday)}
              {renderGroup('Earlier', groupedNotifications.earlier)}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="p-3 text-center border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={loadMore}>
                <ChevronDown className="mr-1 h-3 w-3" />
                Load more notifications
              </Button>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
