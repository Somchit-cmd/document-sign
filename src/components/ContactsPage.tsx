'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { api, mockUsers } from '@/lib/api';
import type { User, Department } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  Send,
  MessageSquare,
  FileText,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Globe,
  CalendarDays,
  Activity,
} from 'lucide-react';

// ============================================================
// Department color mapping
// ============================================================

const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; avatar: string; border: string; gradient: string }> = {
  Engineering: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    avatar: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500 to-teal-600',
  },
  Legal: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    avatar: 'bg-amber-500',
    border: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500 to-orange-600',
  },
  Sales: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
    avatar: 'bg-sky-500',
    border: 'border-sky-200 dark:border-sky-800',
    gradient: 'from-sky-500 to-cyan-600',
  },
  Finance: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    avatar: 'bg-violet-500',
    border: 'border-violet-200 dark:border-violet-800',
    gradient: 'from-violet-500 to-purple-600',
  },
  HR: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-300',
    avatar: 'bg-rose-500',
    border: 'border-rose-200 dark:border-rose-800',
    gradient: 'from-rose-500 to-pink-600',
  },
  Procurement: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    avatar: 'bg-teal-500',
    border: 'border-teal-200 dark:border-teal-800',
    gradient: 'from-teal-500 to-emerald-600',
  },
};

const DEFAULT_DEPT_COLOR = {
  bg: 'bg-slate-100 dark:bg-slate-800/30',
  text: 'text-slate-700 dark:text-slate-300',
  avatar: 'bg-slate-500',
  border: 'border-slate-200 dark:border-slate-700',
  gradient: 'from-slate-500 to-slate-600',
};

function getDeptColor(dept?: string) {
  if (!dept) return DEFAULT_DEPT_COLOR;
  return DEPARTMENT_COLORS[dept] || DEFAULT_DEPT_COLOR;
}

const ROLE_BADGE_VARIANTS: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  manager: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  signer: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  viewer: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-700 dark:text-gray-300' },
};

// ============================================================
// Mock recent documents for contact detail dialog
// ============================================================

const MOCK_RECENT_DOCS = [
  { id: '1', title: 'Enterprise License Agreement', status: 'completed', date: '2025-07-08T14:30:00Z' },
  { id: '2', title: 'NDA - TechStart Inc', status: 'completed', date: '2025-07-06T09:30:00Z' },
  { id: '3', title: 'Sales Contract - Global Logistics', status: 'sent', date: '2025-07-08T16:00:00Z' },
  { id: '4', title: 'Vendor Agreement - CloudSync', status: 'rejected', date: '2025-07-06T15:45:00Z' },
  { id: '5', title: 'Partnership MOU - DataViz', status: 'sent', date: '2025-07-09T08:00:00Z' },
];

// ============================================================
// Helper to get initials
// ============================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function isOnline(lastLogin?: string): boolean {
  if (!lastLogin) return false;
  const diff = Date.now() - new Date(lastLogin).getTime();
  return diff < 15 * 60 * 1000; // within 15 min
}

function getRandomDocCount(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 50 + 3;
}

// ============================================================
// Contact Detail Dialog
// ============================================================

interface ContactDetailDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendDocument: (userId: string) => void;
}

function ContactDetailDialog({ user, open, onOpenChange, onSendDocument }: ContactDetailDialogProps) {
  if (!user) return null;

  const deptColor = getDeptColor(user.department);
  const online = isOnline(user.lastLogin);
  const docCount = getRandomDocCount(user.id);
  const roleVariant = ROLE_BADGE_VARIANTS[user.role] || ROLE_BADGE_VARIANTS.viewer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20 text-xl">
                  <AvatarFallback className={cn('text-white font-bold text-lg', deptColor.avatar)}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    'absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background',
                    online ? 'bg-emerald-500' : 'bg-gray-400'
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <DialogHeader className="text-left space-y-1">
                  <DialogTitle className="text-xl">{user.name}</DialogTitle>
                  <DialogDescription className="text-sm">
                    {user.jobTitle || user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {user.department && (
                    <Badge className={cn('text-xs', deptColor.bg, deptColor.text, 'border-0')}>
                      <Building2 className="h-3 w-3 mr-1" />
                      {user.department}
                    </Badge>
                  )}
                  <Badge className={cn('text-xs', roleVariant.bg, roleVariant.text, 'border-0')}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      online
                        ? 'text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700'
                        : 'text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full mr-1.5',
                        online ? 'bg-emerald-500' : 'bg-gray-400'
                      )}
                    />
                    {online ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{user.phone}</p>
                    </div>
                  </div>
                )}
                {user.department && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{user.department}</p>
                    </div>
                  </div>
                )}
                {user.lastLogin && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Last Login</p>
                      <p className="text-sm font-medium">{format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-5" />

            {/* Signing Statistics */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Signing Statistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/50">
                  <FileText className="h-5 w-5 mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{docCount}</p>
                  <p className="text-xs text-muted-foreground">Total Signed</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-100 dark:border-amber-900/50">
                  <AlertCircle className="h-5 w-5 mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {Math.max(1, Math.floor(docCount * 0.15))}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border border-sky-100 dark:border-sky-900/50">
                  <Clock className="h-5 w-5 mx-auto text-sky-600 dark:text-sky-400 mb-1" />
                  <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">1.8d</p>
                  <p className="text-xs text-muted-foreground">Avg Turnaround</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-100 dark:border-violet-900/50">
                  <Activity className="h-5 w-5 mx-auto text-violet-600 dark:text-violet-400 mb-1" />
                  <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">97%</p>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Recent Documents */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Documents</h4>
              <div className="space-y-2">
                {MOCK_RECENT_DOCS.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(doc.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] shrink-0',
                        doc.status === 'completed' && 'text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700',
                        doc.status === 'sent' && 'text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700',
                        doc.status === 'rejected' && 'text-red-600 border-red-300 dark:text-red-400 dark:border-red-700',
                      )}
                    >
                      {doc.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {doc.status === 'sent' && <Clock className="h-3 w-3 mr-1" />}
                      {doc.status === 'rejected' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-5" />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  onSendDocument(user.id);
                  onOpenChange(false);
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Document
              </Button>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Contact Card (Grid View)
// ============================================================

interface ContactCardProps {
  user: User;
  index: number;
  onViewProfile: (user: User) => void;
  onSendDocument: (userId: string) => void;
}

function ContactCard({ user, index, onViewProfile, onSendDocument }: ContactCardProps) {
  const deptColor = getDeptColor(user.department);
  const online = isOnline(user.lastLogin);
  const roleVariant = ROLE_BADGE_VARIANTS[user.role] || ROLE_BADGE_VARIANTS.viewer;
  const docCount = getRandomDocCount(user.id);

  // Determine status: online, away (30min), or offline
  const status = useMemo(() => {
    if (!user.lastLogin) return 'offline';
    const diff = Date.now() - new Date(user.lastLogin).getTime();
    if (diff < 15 * 60 * 1000) return 'online';
    if (diff < 30 * 60 * 1000) return 'away';
    return 'offline';
  }, [user.lastLogin]);

  const statusColors = {
    online: 'bg-emerald-500 animate-status-pulse',
    away: 'bg-amber-400',
    offline: 'bg-gray-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card-hover-lift"
    >
      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60">
        {/* Gradient left border based on department */}
        <div className={cn('absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b', deptColor.gradient)} />
        {/* Top gradient bar */}
        <div className={cn('h-1.5 w-full bg-gradient-to-r', deptColor.gradient)} />

        <CardContent className="p-5">
          {/* Avatar + Name + Status */}
          <div className="flex items-start gap-3 mb-4">
            <div className="relative shrink-0">
              <Avatar className="h-12 w-12">
                <AvatarFallback className={cn('text-white font-semibold text-sm', deptColor.avatar)}>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background',
                  statusColors[status]
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {user.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {user.jobTitle || user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] px-1.5 shrink-0',
                      online
                        ? 'text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700'
                        : 'text-gray-500 border-gray-300 dark:text-gray-400 dark:border-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full mr-1',
                        online ? 'bg-emerald-500' : 'bg-gray-400'
                      )}
                    />
                    {online ? 'Online' : 'Offline'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {online ? 'Currently online' : 'Last seen ' + (user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, h:mm a') : 'Unknown')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {user.department && (
              <Badge className={cn('text-[10px] px-2 py-0 h-5', deptColor.bg, deptColor.text, 'border-0')}>
                <Building2 className="h-3 w-3 mr-0.5" />
                {user.department}
              </Badge>
            )}
            <Badge className={cn('text-[10px] px-2 py-0 h-5', roleVariant.bg, roleVariant.text, 'border-0')}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          </div>

          {/* Contact details */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>

          {/* Document count */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <FileText className="h-3 w-3 shrink-0" />
            <span><span className="font-semibold text-foreground">{docCount}</span> documents signed</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-border/60">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                    onClick={() => onSendDocument(user.id)}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Send
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send Document</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => onViewProfile(user)}
                  >
                    <Users className="h-3.5 w-3.5 mr-1" />
                    Profile
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Profile</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    Message
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send Message</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Contact Table Row (List View)
// ============================================================

type SortField = 'name' | 'role' | 'department' | 'email' | 'lastLogin';
type SortDirection = 'asc' | 'desc';

interface ContactTableProps {
  users: User[];
  onViewProfile: (user: User) => void;
  onSendDocument: (userId: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return sortDirection === 'asc' ? (
    <ChevronUp className="h-3 w-3 ml-1" />
  ) : (
    <ChevronDown className="h-3 w-3 ml-1" />
  );
}

function ContactTable({ users, onViewProfile, onSendDocument, sortField, sortDirection, onSort }: ContactTableProps) {
  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[280px]">
              <button
                onClick={() => onSort('name')}
                className="flex items-center hover:text-foreground transition-colors font-semibold"
              >
                Name <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => onSort('role')}
                className="flex items-center hover:text-foreground transition-colors font-semibold"
              >
                Role <SortIcon field="role" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <button
                onClick={() => onSort('department')}
                className="flex items-center hover:text-foreground transition-colors font-semibold"
              >
                Department <SortIcon field="department" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <button
                onClick={() => onSort('email')}
                className="flex items-center hover:text-foreground transition-colors font-semibold"
              >
                Email <SortIcon field="email" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </TableHead>
            <TableHead className="hidden xl:table-cell">Docs</TableHead>
            <TableHead className="hidden lg:table-cell">
              <button
                onClick={() => onSort('lastLogin')}
                className="flex items-center hover:text-foreground transition-colors font-semibold"
              >
                Last Login <SortIcon field="lastLogin" sortField={sortField} sortDirection={sortDirection} />
              </button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {users.map((user, i) => {
              const deptColor = getDeptColor(user.department);
              const online = isOnline(user.lastLogin);
              const roleVariant = ROLE_BADGE_VARIANTS[user.role] || ROLE_BADGE_VARIANTS.viewer;

              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="group cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onViewProfile(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={cn('text-white text-xs font-semibold', deptColor.avatar)}>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
                            online ? 'bg-emerald-500' : 'bg-gray-400'
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.jobTitle || '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-[10px] px-2 py-0 h-5', roleVariant.bg, roleVariant.text, 'border-0')}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.department ? (
                      <Badge className={cn('text-[10px] px-2 py-0 h-5', deptColor.bg, deptColor.text, 'border-0')}>
                        {user.department}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground truncate block max-w-[200px]">{user.email}</span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <span className="text-xs font-medium">{getRandomDocCount(user.id)}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, h:mm a') : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                        onClick={() => onSendDocument(user.id)}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => onViewProfile(user)}
                      >
                        <Users className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================
// Main ContactsPage Component
// ============================================================

export function ContactsPage() {
  const { navigate } = useAppStore();

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Data fetching
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['contacts-users', searchQuery, roleFilter, departmentFilter],
    queryFn: async () => {
      try {
        const filters: Record<string, unknown> = { pageSize: 100 };
        if (searchQuery) filters.search = searchQuery;
        if (roleFilter !== 'all') filters.role = [roleFilter];
        if (departmentFilter !== 'all') filters.department = departmentFilter;

        const res = await api.getUsers(filters as any);
        if (res.success && res.data) {
          return res.data.items;
        }
        return mockUsers;
      } catch {
        return mockUsers;
      }
    },
    staleTime: 30 * 1000,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['contacts-departments'],
    queryFn: async () => {
      try {
        const res = await api.getDepartments();
        if (res.success && res.data) return res.data;
        return [];
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  // Build department list for tabs
  const departments = useMemo(() => {
    const baseDepts = ['All', 'Engineering', 'Legal', 'Sales', 'Finance', 'HR', 'Procurement'];
    // Add any departments from API that aren't in the base list
    if (departmentsData) {
      departmentsData.forEach((d: Department) => {
        if (!baseDepts.includes(d.name)) {
          baseDepts.push(d.name);
        }
      });
    }
    return baseDepts;
  }, [departmentsData]);

  // Filter & sort users
  const filteredUsers = useMemo(() => {
    const users = usersData || mockUsers;
    let result = [...users];

    // Apply search filter client-side (for more responsive filtering)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.jobTitle && u.jobTitle.toLowerCase().includes(q)) ||
          (u.department && u.department.toLowerCase().includes(q))
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      result = result.filter((u) => u.department === departmentFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'role':
          cmp = a.role.localeCompare(b.role);
          break;
        case 'department':
          cmp = (a.department || '').localeCompare(b.department || '');
          break;
        case 'email':
          cmp = a.email.localeCompare(b.email);
          break;
        case 'lastLogin':
          cmp = (a.lastLogin || '').localeCompare(b.lastLogin || '');
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [usersData, searchQuery, roleFilter, departmentFilter, sortField, sortDirection]);

  // Handlers
  const handleViewProfile = useCallback((user: User) => {
    setSelectedUser(user);
    setDetailOpen(true);
  }, []);

  const handleSendDocument = useCallback(
    (userId: string) => {
      navigate('documents', { recipientId: userId });
    },
    [navigate]
  );

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortDirection('asc');
      }
      return field;
    });
  }, []);

  // Stats
  const totalContacts = filteredUsers.length;
  const onlineCount = filteredUsers.filter((u) => isOnline(u.lastLogin)).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 py-4">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Contacts</h1>
                <p className="text-xs text-muted-foreground">
                  {totalContacts} contacts &middot; <span className="text-emerald-600 dark:text-emerald-400">{onlineCount} online</span>
                </p>
              </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/30">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 px-3 text-xs',
                    viewMode === 'grid' && 'bg-background shadow-sm'
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 px-3 text-xs',
                    viewMode === 'list' && 'bg-background shadow-sm'
                  )}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-3.5 w-3.5 mr-1" />
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Search + Filters row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <motion.div
                animate={{ rotate: searchQuery ? 90 : 0, scale: searchQuery ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                <Search className={cn('h-4 w-4', searchQuery ? 'text-emerald-500' : 'text-muted-foreground')} />
              </motion.div>
              <Input
                placeholder="Search contacts by name, email, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm input-glow-focus"
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center transition-colors"
                >
                  <span className="text-[10px] text-muted-foreground leading-none">×</span>
                </motion.button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="signer">Signer</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments
                    .filter((d) => d !== 'All')
                    .map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Department Tabs with animated underline */}
        <div className="px-4 sm:px-6 pb-3">
          <Tabs
            value={departmentFilter}
            onValueChange={(v) => setDepartmentFilter(v === 'all' ? 'all' : v)}
            className="w-full"
          >
            <ScrollArea className="w-full">
              <TabsList className="h-9 p-0 bg-transparent border-b border-border rounded-none gap-0">
                <TabsTrigger
                  value="all"
                  className="h-9 px-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 transition-all duration-200"
                  onClick={() => setDepartmentFilter('all')}
                >
                  All
                </TabsTrigger>
                {departments
                  .filter((d) => d !== 'All')
                  .map((d) => {
                    const deptColor = getDeptColor(d);
                    return (
                      <TabsTrigger
                        key={d}
                        value={d}
                        className="h-9 px-3 text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 transition-all duration-200"
                        onClick={() => setDepartmentFilter(d)}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', deptColor.avatar)} />
                        {d}
                      </TabsTrigger>
                    );
                  })}
              </TabsList>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-5">
        {usersLoading ? (
          // Loading skeleton
          <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1')}>
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden relative">
                  <div className="h-1.5 skeleton-shimmer" />
                  <div className="absolute left-0 top-0 bottom-0 w-1 skeleton-shimmer" />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full skeleton-shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 skeleton-shimmer w-3/4" />
                        <div className="h-3 skeleton-shimmer w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-5 w-16 skeleton-shimmer rounded-full" />
                      <div className="h-5 w-14 skeleton-shimmer rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 skeleton-shimmer w-full" />
                      <div className="h-3 skeleton-shimmer w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="p-4 rounded-2xl bg-muted/50 mb-4">
              <Users className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No contacts found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Try adjusting your search or filter criteria to find the contacts you&apos;re looking for.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setDepartmentFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          // Grid view
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((user, i) => (
              <ContactCard
                key={user.id}
                user={user}
                index={i}
                onViewProfile={handleViewProfile}
                onSendDocument={handleSendDocument}
              />
            ))}
          </div>
        ) : (
          // List view
          <ContactTable
            users={filteredUsers}
            onViewProfile={handleViewProfile}
            onSendDocument={handleSendDocument}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Contact Detail Dialog */}
      <ContactDetailDialog
        user={selectedUser}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSendDocument={handleSendDocument}
      />
    </div>
  );
}
