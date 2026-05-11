'use client';

import { useAppStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api, mockDocuments } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Inbox,
  FileText,
  LayoutTemplate,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCog,
  FileSignature,
  Sparkles,
  GitBranch,
  Keyboard,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navGroups = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'inbox', label: 'Inbox', icon: Inbox, badge: 'inbox' },
      { id: 'documents', label: 'Documents', icon: FileText, badge: 'docs' },
      { id: 'contacts', label: 'Contacts', icon: Users },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'templates', label: 'Templates', icon: LayoutTemplate },
      { id: 'workflow-builder', label: 'Workflows', icon: GitBranch },
      { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'admin', label: 'Admin', icon: UserCog },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { currentPage, navigate, sidebarOpen, toggleSidebar, setKeyboardShortcutsOpen } = useAppStore();

  // Fetch document count for badge
  const { data: docsData } = useQuery({
    queryKey: ['sidebar-docs-count'],
    queryFn: async () => {
      const res = await api.getDocuments({ pageSize: 1 });
      if (res.success && res.data) return res.data.total;
      return mockDocuments.length;
    },
    staleTime: 60 * 1000,
  });

  // Fetch inbox count for badge
  const { data: inboxData } = useQuery({
    queryKey: ['sidebar-inbox-count'],
    queryFn: async () => {
      const res = await api.getDocuments({ status: ['sent'], pageSize: 1 });
      if (res.success && res.data) return res.data.total;
      return mockDocuments.filter(d => d.status === 'sent' || d.status === 'viewed').length;
    },
    staleTime: 30 * 1000,
  });

  const docsCount = docsData || mockDocuments.length;
  const inboxCount = inboxData || mockDocuments.filter(d => d.status === 'sent' || d.status === 'viewed').length;

  const getBadge = (badgeType: string) => {
    if (badgeType === 'inbox' && inboxCount > 0) return { count: inboxCount, variant: 'destructive' as const };
    if (badgeType === 'docs') return { count: docsCount, variant: 'secondary' as const };
    return null;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 bottom-0 z-40 border-r border-border bg-sidebar transition-all duration-300 hidden md:flex md:flex-col',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo area with Enterprise badge */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <FileSignature className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold tracking-tight">DocuSign</span>
            </div>
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[8px] px-1.5 py-0 h-4 border-0 shrink-0">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              ENTERPRISE
            </Badge>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <TooltipProvider delayDuration={0}>
          {navGroups.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && <Separator className="my-2 mx-2" />}
              {sidebarOpen && (
                <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentPage === item.id;
                  const Icon = item.icon;
                  const badgeData = item.badge ? getBadge(item.badge) : null;

                  return sidebarOpen ? (
                    <motion.button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 relative',
                        isActive
                          ? 'bg-primary/10 text-primary sidebar-active-indicator'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:pl-4'
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={sidebarOpen ? 'full' : 'mini'}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="truncate flex-1 text-left"
                        >
                          {item.label}
                        </motion.span>
                      </AnimatePresence>
                      {badgeData && (
                        <Badge
                          variant={badgeData.variant}
                          className={cn(
                            'h-5 px-1.5 text-[10px] shrink-0',
                            badgeData.variant === 'destructive' && 'animate-pulse'
                          )}
                        >
                          {badgeData.count > 99 ? '99+' : badgeData.count}
                        </Badge>
                      )}
                    </motion.button>
                  ) : (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => navigate(item.id)}
                          className={cn(
                            'flex w-full items-center justify-center rounded-lg p-2.5 transition-all duration-200 relative',
                            isActive
                              ? 'bg-primary/10 text-primary sidebar-active-indicator'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon className="h-5 w-5" />
                          {badgeData && (
                            <Badge
                              variant={badgeData.variant}
                              className={cn(
                                'absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[8px] shrink-0',
                                badgeData.variant === 'destructive' && 'animate-pulse'
                              )}
                            >
                              {badgeData.count > 9 ? '9+' : badgeData.count}
                            </Badge>
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </nav>

      <div className="border-t border-border p-2">
        <TooltipProvider delayDuration={0}>
          {sidebarOpen ? (
            <motion.button
              onClick={() => setKeyboardShortcutsOpen(true)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 mb-1"
              whileTap={{ scale: 0.98 }}
            >
              <Keyboard className="h-5 w-5 shrink-0" />
              <span className="truncate flex-1 text-left">Keyboard Shortcuts</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘/
              </kbd>
            </motion.button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setKeyboardShortcutsOpen(true)}
                  className="flex w-full items-center justify-center rounded-lg p-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 mb-1"
                  whileTap={{ scale: 0.98 }}
                >
                  <Keyboard className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">Keyboard Shortcuts</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
        <Separator className="mb-2" />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center btn-click-scale"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const { currentPage, navigate, setKeyboardShortcutsOpen } = useAppStore();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center border-b px-4 gap-2">
          <FileSignature className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">DocuSign</span>
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[8px] px-1.5 py-0 h-4 border-0 ml-auto">
            ENTERPRISE
          </Badge>
        </div>
        <nav className="py-2 px-2">
          {navGroups.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && <Separator className="my-2" />}
              <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = currentPage === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative',
                        isActive
                          ? 'bg-primary/10 text-primary sidebar-active-indicator'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-border mt-2 pt-2 px-2">
          <button
            onClick={() => setKeyboardShortcutsOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
          >
            <Keyboard className="h-5 w-5 shrink-0" />
            <span>Keyboard Shortcuts</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘/
            </kbd>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
