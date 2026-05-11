'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, isToday, isYesterday, subDays, isAfter, isBefore } from 'date-fns';
import {
  Bell,
  Mail,
  FileText,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Clock,
  Settings,
  Trash2,
  CheckCheck,
  Filter,
  Search,
  Volume2,
  VolumeX,
  ExternalLink,
  X,
  ChevronDown,
  Sparkles,
  Shield,
  UserCheck,
  Send,
  Eye,
  AlertCircle,
  PenTool,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

// --- Types ---
interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'document' | 'signature' | 'workflow' | 'system' | 'mention';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
  sender?: { name: string; initials: string };
  urgent?: boolean;
}

// --- Mock Data ---
const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'success',
    category: 'signature',
    title: 'Document signed by John Martinez',
    message: 'Enterprise License Agreement has been signed by John Martinez. All signatures are now complete.',
    isRead: false,
    actionUrl: '/documents/1',
    createdAt: new Date(Date.now() - 1 * 60 * 1000),
    sender: { name: 'John Martinez', initials: 'JM' },
  },
  {
    id: '2',
    type: 'info',
    category: 'document',
    title: 'Document sent for signature',
    message: 'NDA - TechStart Inc. has been sent to 3 recipients for signature.',
    isRead: false,
    actionUrl: '/documents/2',
    createdAt: new Date(Date.now() - 3 * 60 * 1000),
    sender: { name: 'Sarah Chen', initials: 'SC' },
  },
  {
    id: '3',
    type: 'warning',
    category: 'workflow',
    title: 'Approval request from Sarah Chen',
    message: 'Sarah Chen has requested your approval on Vendor Agreement Q4 2024.',
    isRead: false,
    actionUrl: '/documents/3',
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
    sender: { name: 'Sarah Chen', initials: 'SC' },
    urgent: true,
  },
  {
    id: '4',
    type: 'error',
    category: 'workflow',
    title: 'Document rejected by Legal team',
    message: 'Service Agreement - GlobalTech was rejected by the Legal department. Reason: Missing liability clause.',
    isRead: false,
    actionUrl: '/documents/4',
    createdAt: new Date(Date.now() - 25 * 60 * 1000),
    urgent: true,
  },
  {
    id: '5',
    type: 'success',
    category: 'workflow',
    title: 'Workflow completed: Contract Approval',
    message: 'The Contract Approval workflow for Partnership Agreement has been completed successfully.',
    isRead: false,
    actionUrl: '/documents/5',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: '6',
    type: 'warning',
    category: 'system',
    title: 'Password expires in 7 days',
    message: 'Your account password will expire on March 15, 2025. Please update your password to maintain access.',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '7',
    type: 'info',
    category: 'mention',
    title: '@Sarah mentioned you in a comment',
    message: 'On "NDA - TechStart": "@you Can you review clause 4.2 before we send this out?"',
    isRead: false,
    actionUrl: '/documents/6',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    sender: { name: 'Sarah Chen', initials: 'SC' },
  },
  {
    id: '8',
    type: 'warning',
    category: 'document',
    title: 'Reminder: Enterprise License Agreement expires tomorrow',
    message: 'Enterprise License Agreement is set to expire tomorrow. Please take action to renew or extend.',
    isRead: false,
    actionUrl: '/documents/7',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    urgent: true,
  },
  {
    id: '9',
    type: 'info',
    category: 'signature',
    title: 'Document viewed by external signer',
    message: 'Michael Torres has viewed the Partnership Agreement. Awaiting signature.',
    isRead: true,
    actionUrl: '/documents/8',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    sender: { name: 'Michael Torres', initials: 'MT' },
  },
  {
    id: '10',
    type: 'info',
    category: 'document',
    title: 'Template "NDA Standard" was updated',
    message: 'The NDA Standard template has been updated with new compliance clauses. Version 3.2 is now available.',
    isRead: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: '11',
    type: 'success',
    category: 'signature',
    title: 'Document signed by Lisa Park',
    message: 'Employment Offer Letter has been signed by Lisa Park.',
    isRead: true,
    actionUrl: '/documents/9',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    sender: { name: 'Lisa Park', initials: 'LP' },
  },
  {
    id: '12',
    type: 'info',
    category: 'workflow',
    title: 'New workflow started: Procurement Review',
    message: 'A new Procurement Review workflow has been initiated for Office Supply Contract.',
    isRead: true,
    actionUrl: '/documents/10',
    createdAt: new Date(Date.now() - 27 * 60 * 60 * 1000),
  },
  {
    id: '13',
    type: 'error',
    category: 'document',
    title: 'Document expired',
    message: 'Consulting Agreement - DataFlow Corp has expired without all signatures being collected.',
    isRead: true,
    actionUrl: '/documents/11',
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
  },
  {
    id: '14',
    type: 'info',
    category: 'mention',
    title: '@David mentioned you in "Q4 Budget"',
    message: 'On "Q4 Budget Proposal": "@you Need your input on the marketing allocation section."',
    isRead: true,
    actionUrl: '/documents/12',
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
    sender: { name: 'David Kim', initials: 'DK' },
  },
  {
    id: '15',
    type: 'warning',
    category: 'system',
    title: 'Scheduled maintenance tonight',
    message: 'System maintenance is scheduled for tonight from 2:00 AM to 4:00 AM EST. Services may be briefly unavailable.',
    isRead: true,
    createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000),
  },
  {
    id: '16',
    type: 'success',
    category: 'document',
    title: 'Document completed',
    message: 'Master Service Agreement - InnovateTech has been fully executed and completed.',
    isRead: true,
    actionUrl: '/documents/13',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '17',
    type: 'info',
    category: 'system',
    title: 'New feature: AI Document Summarization',
    message: 'You can now use AI to automatically summarize long documents. Try it from the document viewer.',
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: '18',
    type: 'warning',
    category: 'signature',
    title: 'Signature reminder: Pending for 3 days',
    message: 'Non-Compete Agreement still awaits your signature. Please sign at your earliest convenience.',
    isRead: true,
    actionUrl: '/documents/14',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    urgent: true,
  },
  {
    id: '19',
    type: 'info',
    category: 'workflow',
    title: 'Approval step completed by Finance',
    message: 'The Finance department has approved the budget allocation step in the Procurement workflow.',
    isRead: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: '20',
    type: 'success',
    category: 'document',
    title: 'Template created from document',
    message: 'A new template "Standard NDA v2" has been created from your Non-Disclosure Agreement.',
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '21',
    type: 'info',
    category: 'signature',
    title: 'Signature request forwarded',
    message: 'Rachel Adams has forwarded the signature request for Marketing Agreement to James Wilson.',
    isRead: true,
    actionUrl: '/documents/15',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    sender: { name: 'Rachel Adams', initials: 'RA' },
  },
  {
    id: '22',
    type: 'error',
    category: 'system',
    title: 'Integration sync failed',
    message: 'Sync with Microsoft 365 failed at 3:42 PM. Some documents may not be up to date. Retry scheduled.',
    isRead: true,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    id: '23',
    type: 'warning',
    category: 'document',
    title: 'Document approaching expiry',
    message: 'Service Level Agreement with CloudNet will expire in 5 days. Consider renewal.',
    isRead: true,
    actionUrl: '/documents/16',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

// --- Category Config ---
const categoryConfig = {
  document: { label: 'Documents', icon: FileText, color: 'border-l-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', badgeVariant: 'secondary' as const },
  signature: { label: 'Signatures', icon: PenTool, color: 'border-l-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', badgeVariant: 'secondary' as const },
  workflow: { label: 'Workflows', icon: RefreshCw, color: 'border-l-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', badgeVariant: 'secondary' as const },
  system: { label: 'System', icon: Shield, color: 'border-l-slate-500', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', badgeVariant: 'secondary' as const },
  mention: { label: 'Mentions', icon: MessageSquare, color: 'border-l-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', badgeVariant: 'secondary' as const },
};

const typeConfig = {
  info: { icon: Bell, color: 'text-blue-500' },
  success: { icon: CheckCircle2, color: 'text-emerald-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
  error: { icon: AlertCircle, color: 'text-red-500' },
};

// --- Time Grouping ---
function getTimeGroup(date: Date): string {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  if (isAfter(date, fiveMinutesAgo)) return 'Just Now';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isAfter(date, subDays(now, 7))) return 'Earlier this week';
  return 'Older';
}

const timeGroupOrder = ['Just Now', 'Today', 'Yesterday', 'Earlier this week', 'Older'];

// --- Sparkline Data ---
const sparklineData = [3, 5, 2, 8, 6, 4, 7, 9, 5, 3, 6, 8, 4, 7];

function MiniSparkline({ data, color = 'emerald' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  const colorMap: Record<string, { stroke: string; fill: string }> = {
    emerald: { stroke: '#10b981', fill: 'url(#sparkGradient-emerald)' },
    amber: { stroke: '#f59e0b', fill: 'url(#sparkGradient-amber)' },
    blue: { stroke: '#3b82f6', fill: 'url(#sparkGradient-blue)' },
  };

  const colors = colorMap[color] || colorMap.emerald;

  return (
    <svg width={width} height={height} className="inline-block">
      <defs>
        <linearGradient id={`sparkGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={colors.fill} />
      <polyline points={points} fill="none" stroke={colors.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- Main Component ---
export function NotificationCenterPage() {
  const { navigate, markAsRead, markAllAsRead } = useAppStore();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Preferences state
  const [prefs, setPrefs] = useState({
    emailDocument: true,
    emailSignature: true,
    emailWorkflow: true,
    emailSystem: false,
    emailMention: true,
    inAppDocument: true,
    inAppSignature: true,
    inAppWorkflow: true,
    inAppSystem: true,
    inAppMention: true,
    digestFrequency: 'realtime',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  // Derived stats
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const urgent = notifications.filter(n => n.urgent).length;
    return { total, unread, urgent };
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Tab filter
    if (activeTab === 'unread') result = result.filter(n => !n.isRead);
    else if (activeTab !== 'all') result = result.filter(n => n.category === activeTab);

    // Category pills filter
    if (selectedCategories.size > 0) {
      result = result.filter(n => selectedCategories.has(n.category));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q)
      );
    }

    // Sort by date descending
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return result;
  }, [notifications, activeTab, selectedCategories, searchQuery]);

  // Grouped notifications
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};
    for (const n of filteredNotifications) {
      const group = getTimeGroup(n.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    }
    return groups;
  }, [filteredNotifications]);

  // Handlers
  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    markAllAsRead();
    toast({ title: 'All notifications marked as read', description: `${stats.unread} notifications updated` });
  }, [markAllAsRead, stats.unread, toast]);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    markAsRead(id);
  }, [markAsRead]);

  const handleDismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast({ title: 'Notification dismissed' });
  }, [toast]);

  const handleNavigate = useCallback((notification: NotificationItem) => {
    if (!notification.isRead) {
      handleMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate('document-detail', { id: notification.actionUrl.split('/').pop() });
    }
  }, [handleMarkRead, navigate]);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  }, [selectedIds.size, filteredNotifications]);

  const handleBulkMarkRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => (selectedIds.has(n.id) ? { ...n, isRead: true } : n))
    );
    toast({ title: `${selectedIds.size} notifications marked as read` });
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [selectedIds, toast]);

  const handleBulkDismiss = useCallback(() => {
    setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
    toast({ title: `${selectedIds.size} notifications dismissed` });
    setSelectedIds(new Set());
    setSelectMode(false);
  }, [selectedIds, toast]);

  const handleSavePreferences = useCallback(() => {
    toast({ title: 'Preferences saved', description: 'Your notification preferences have been updated.' });
    setPreferencesOpen(false);
  }, [toast]);

  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => !prev);
    setSelectedIds(new Set());
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated on your documents, workflows, and system alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={stats.unread === 0}>
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Mark All Read
          </Button>
          <Button
            variant={selectMode ? 'default' : 'outline'}
            size="sm"
            onClick={toggleSelectMode}
          >
            <Checkbox checked={selectMode} className="h-3 w-3 mr-1.5" />
            Select
          </Button>
          <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Preferences
                </DialogTitle>
                <DialogDescription>
                  Configure how and when you receive notifications.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Email Notifications */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Notifications
                  </h4>
                  <div className="space-y-3">
                    {([
                      { key: 'emailDocument', label: 'Documents', desc: 'Document creation, updates, and status changes' },
                      { key: 'emailSignature', label: 'Signatures', desc: 'Signature requests and completions' },
                      { key: 'emailWorkflow', label: 'Workflows', desc: 'Approval requests and workflow updates' },
                      { key: 'emailSystem', label: 'System', desc: 'System alerts and maintenance notices' },
                      { key: 'emailMention', label: 'Mentions', desc: 'When someone @mentions you' },
                    ] as const).map(item => (
                      <div key={item.key} className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium">{item.label}</Label>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={prefs[item.key]}
                          onCheckedChange={v => setPrefs(p => ({ ...p, [item.key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* In-App Notifications */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    In-App Notifications
                  </h4>
                  <div className="space-y-3">
                    {([
                      { key: 'inAppDocument', label: 'Documents', desc: 'Document creation, updates, and status changes' },
                      { key: 'inAppSignature', label: 'Signatures', desc: 'Signature requests and completions' },
                      { key: 'inAppWorkflow', label: 'Workflows', desc: 'Approval requests and workflow updates' },
                      { key: 'inAppSystem', label: 'System', desc: 'System alerts and maintenance notices' },
                      { key: 'inAppMention', label: 'Mentions', desc: 'When someone @mentions you' },
                    ] as const).map(item => (
                      <div key={item.key} className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium">{item.label}</Label>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={prefs[item.key]}
                          onCheckedChange={v => setPrefs(p => ({ ...p, [item.key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Digest Frequency */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Digest Frequency
                  </h4>
                  <Select
                    value={prefs.digestFrequency}
                    onValueChange={v => setPrefs(p => ({ ...p, digestFrequency: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How often email digests are sent for non-urgent notifications.
                  </p>
                </div>

                <Separator />

                {/* Quiet Hours */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      {prefs.quietHoursEnabled ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
                      Quiet Hours
                    </h4>
                    <Switch
                      checked={prefs.quietHoursEnabled}
                      onCheckedChange={v => setPrefs(p => ({ ...p, quietHoursEnabled: v }))}
                    />
                  </div>
                  {prefs.quietHoursEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Start</Label>
                        <Input
                          type="time"
                          value={prefs.quietHoursStart}
                          onChange={e => setPrefs(p => ({ ...p, quietHoursStart: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <span className="text-muted-foreground mt-5">to</span>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">End</Label>
                        <Input
                          type="time"
                          value={prefs.quietHoursEnd}
                          onChange={e => setPrefs(p => ({ ...p, quietHoursEnd: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </motion.div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Silence non-urgent notifications during specified hours.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreferencesOpen(false)}>Cancel</Button>
                <Button onClick={handleSavePreferences}>
                  <CheckCheck className="h-4 w-4 mr-1.5" />
                  Save Preferences
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Unread</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{stats.unread}</p>
                    {stats.unread > 0 && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Action Required</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{stats.urgent}</p>
                    {stats.urgent > 0 && (
                      <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Urgent</Badge>
                    )}
                  </div>
                </div>
                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">This Week</p>
                  <p className="text-lg font-bold mt-0.5">
                    <MiniSparkline data={sparklineData} color="amber" />
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const isActive = selectedCategories.has(key);
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-7 text-xs gap-1',
                    isActive && config.bg
                  )}
                  onClick={() => toggleCategory(key)}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                  {isActive && <X className="h-3 w-3 ml-0.5" />}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread
              {stats.unread > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                  {stats.unread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="document" className="text-xs">Documents</TabsTrigger>
            <TabsTrigger value="signature" className="text-xs">Signatures</TabsTrigger>
            <TabsTrigger value="workflow" className="text-xs">Workflows</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
            <TabsTrigger value="mention" className="text-xs">Mentions</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50"
          >
            <Checkbox
              checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
            </span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkMarkRead}
              disabled={selectedIds.size === 0}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDismiss}
              disabled={selectedIds.size === 0}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification List */}
      <ScrollArea className="max-h-[calc(100vh-380px)]">
        {filteredNotifications.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No notifications found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery
                ? `No notifications match "${searchQuery}". Try a different search term.`
                : selectedCategories.size > 0
                  ? 'No notifications match your selected filters. Try adjusting your filters.'
                  : activeTab !== 'all'
                    ? `No ${activeTab} notifications. They'll appear here when available.`
                    : "You're all caught up! New notifications will appear here."
              }
            </p>
            {(searchQuery || selectedCategories.size > 0 || activeTab !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategories(new Set());
                  setActiveTab('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {timeGroupOrder.map(group => {
              const groupNotifications = groupedNotifications[group];
              if (!groupNotifications || groupNotifications.length === 0) return null;

              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </h3>
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">
                      {groupNotifications.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {groupNotifications.map((notification, index) => {
                      const catConfig = categoryConfig[notification.category];
                      const typConfig = typeConfig[notification.type];
                      const CatIcon = catConfig.icon;
                      const TypeIcon = typConfig.icon;
                      const isSelected = selectedIds.has(notification.id);

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.3 }}
                          layout
                        >
                          <Card
                            className={cn(
                              'cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 group',
                              catConfig.color,
                              !notification.isRead && 'bg-muted/30',
                              isSelected && 'ring-2 ring-primary/50',
                              notification.urgent && !notification.isRead && 'border-l-red-500'
                            )}
                            onClick={() => {
                              if (selectMode) {
                                toggleSelect(notification.id);
                              } else {
                                handleNavigate(notification);
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Select checkbox */}
                                {selectMode && (
                                  <div className="pt-0.5">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleSelect(notification.id)}
                                      onClick={e => e.stopPropagation()}
                                    />
                                  </div>
                                )}

                                {/* Category Icon */}
                                <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', catConfig.bg)}>
                                  <CatIcon className={cn('h-4 w-4', catConfig.text)} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        {!notification.isRead && (
                                          <span className="relative flex h-2 w-2 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                          </span>
                                        )}
                                        <h4
                                          className={cn(
                                            'text-sm truncate',
                                            !notification.isRead ? 'font-semibold' : 'font-medium text-muted-foreground'
                                          )}
                                        >
                                          {notification.title}
                                        </h4>
                                      </div>
                                      <p className={cn(
                                        'text-xs mt-0.5 line-clamp-2',
                                        notification.isRead ? 'text-muted-foreground/70' : 'text-muted-foreground'
                                      )}>
                                        {notification.message}
                                      </p>
                                    </div>

                                    {/* Right side: time + actions */}
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <div className="flex items-center gap-1.5">
                                        {notification.urgent && (
                                          <Badge variant="destructive" className="text-[10px] h-4 px-1 shrink-0">
                                            Urgent
                                          </Badge>
                                        )}
                                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                        </span>
                                      </div>

                                      {/* Action buttons */}
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {notification.actionUrl && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={e => {
                                              e.stopPropagation();
                                              handleNavigate(notification);
                                            }}
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        )}
                                        {!notification.isRead && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={e => {
                                              e.stopPropagation();
                                              handleMarkRead(notification.id);
                                            }}
                                          >
                                            <CheckCircle2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                          onClick={e => {
                                            e.stopPropagation();
                                            handleDismiss(notification.id);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Footer: sender + type */}
                                  <div className="flex items-center gap-2 mt-2">
                                    {notification.sender && (
                                      <div className="flex items-center gap-1.5">
                                        <Avatar className="h-5 w-5">
                                          <AvatarFallback className="text-[8px] bg-primary/10">
                                            {notification.sender.initials}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-[11px] text-muted-foreground">
                                          {notification.sender.name}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 ml-auto">
                                      <TypeIcon className={cn('h-3 w-3', typConfig.color)} />
                                      <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                                        {notification.type}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
