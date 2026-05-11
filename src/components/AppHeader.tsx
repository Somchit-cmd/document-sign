'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { MobileSidebar } from './AppSidebar';
import { NotificationPanel } from './NotificationPanel';
import { SearchDialog } from './SearchDialog';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  FileSignature,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Breadcrumb mapping
const breadcrumbMap: Record<string, { label: string; parent?: string }> = {
  'dashboard': { label: 'Dashboard' },
  'inbox': { label: 'Inbox', parent: 'dashboard' },
  'documents': { label: 'Documents', parent: 'dashboard' },
  'document-detail': { label: 'Document Details', parent: 'documents' },
  'document-editor': { label: 'Document Editor', parent: 'documents' },
  'templates': { label: 'Templates', parent: 'dashboard' },
  'audit-logs': { label: 'Audit Logs', parent: 'dashboard' },
  'admin': { label: 'Admin', parent: 'dashboard' },
  'settings': { label: 'Settings', parent: 'dashboard' },
};

export function AppHeader() {
  const { user, unreadCount, currentPage, navigate, logout } = useAppStore();
  const [bellAnimating, setBellAnimating] = useState(false);
  const prevUnreadCountRef = useRef(unreadCount);

  // Animate bell when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      const animTimer = setTimeout(() => setBellAnimating(true), 0);
      const resetTimer = setTimeout(() => setBellAnimating(false), 1500);
      prevUnreadCountRef.current = unreadCount;
      return () => {
        clearTimeout(animTimer);
        clearTimeout(resetTimer);
      };
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  // Build breadcrumbs
  const breadcrumbs: { id: string; label: string }[] = [];
  let currentKey = currentPage;
  while (currentKey && breadcrumbMap[currentKey]) {
    breadcrumbs.unshift({ id: currentKey, label: breadcrumbMap[currentKey].label });
    currentKey = breadcrumbMap[currentKey].parent || '';
  }

  return (
    <header className="sticky top-0 z-50 flex flex-col border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main header row */}
      <div className="flex h-14 items-center px-4 gap-4">
        <MobileSidebar />

        <div className="flex items-center gap-2 md:gap-4 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:inline">DocuSign</span>
          </div>

          {/* Search trigger with glow */}
          <SearchDialog />

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />

            {/* Notifications with bounce bell */}
            <NotificationPanel>
              <Button variant="ghost" size="icon" className="relative">
                <motion.div
                  animate={bellAnimating ? { rotate: [0, 14, -8, 6, -4, 2, 0] } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <Bell className="h-5 w-5" />
                </motion.div>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </NotificationPanel>

            {/* User menu with ring on hover */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full group">
                  <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-200">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || 'user@example.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('settings')} className="btn-click-scale">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('settings')} className="btn-click-scale">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive btn-click-scale">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Breadcrumb row */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 px-4 pb-2 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {i < breadcrumbs.length - 1 ? (
                <button
                  onClick={() => navigate(crumb.id)}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
