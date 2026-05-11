'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { api, mockDashboardStats, mockActivity, mockDocuments } from '@/lib/api';
import type { DashboardStats, ActivityItem, Document } from '@/lib/types';
import { StatCard } from './StatCard';
import { ActivityFeed } from './ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FileText,
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  Upload,
  LayoutTemplate,
  Inbox,
  Send,
  ArrowRight,
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Timer,
  Activity,
  Zap,
  Calendar,
  Bell,
  BarChart3,
  UserPlus,
  HelpCircle,
  MessageSquare,
  Eye,
  PenTool,
  ThumbsUp,
  Users,
  MapPin,
  GitCommitHorizontal,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { motion } from 'framer-motion';
import { formatDistanceToNow, differenceInHours, differenceInDays, format } from 'date-fns';

// ============================================================
// Mock Data for New Sections
// ============================================================

const monthlyData = [
  { name: 'Feb', created: 65, completed: 45 },
  { name: 'Mar', created: 78, completed: 62 },
  { name: 'Apr', created: 90, completed: 71 },
  { name: 'May', created: 81, completed: 65 },
  { name: 'Jun', created: 95, completed: 80 },
  { name: 'Jul', created: 110, completed: 95 },
];

const defaultStatusData = [
  { name: 'Completed', value: 156, color: '#10b981' },
  { name: 'Pending', value: 23, color: '#f59e0b' },
  { name: 'Signed', value: 34, color: '#14b8a6' },
  { name: 'Draft', value: 12, color: '#94a3b8' },
  { name: 'Rejected', value: 5, color: '#ef4444' },
  { name: 'Voided', value: 3, color: '#6b7280' },
];

// Weekly Activity Bar Chart data (current week Mon-Sun)
const weeklyActivityData = [
  { name: 'Mon', created: 8, signed: 5, approved: 3 },
  { name: 'Tue', created: 12, signed: 9, approved: 6 },
  { name: 'Wed', created: 15, signed: 11, approved: 8 },
  { name: 'Thu', created: 10, signed: 7, approved: 5 },
  { name: 'Fri', created: 14, signed: 10, approved: 7 },
  { name: 'Sat', created: 4, signed: 2, approved: 1 },
  { name: 'Sun', created: 2, signed: 1, approved: 0 },
];

// Expiring soon documents
const now = new Date();

// Upcoming Deadlines data (top 5 with priority colors)
const upcomingDeadlines = [
  {
    id: 'ud-1',
    title: 'Enterprise License Agreement',
    deadline: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'David Kim',
    priority: 'urgent' as const,
  },
  {
    id: 'ud-2',
    title: 'Employment Agreement - M. Torres',
    deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Sarah Chen',
    priority: 'high' as const,
  },
  {
    id: 'ud-3',
    title: 'Vendor Contract - CloudSync',
    deadline: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'John Martinez',
    priority: 'high' as const,
  },
  {
    id: 'ud-4',
    title: 'Partnership MOU - DataViz',
    deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Emily Watson',
    priority: 'normal' as const,
  },
  {
    id: 'ud-5',
    title: 'Sales Contract - Global Logistics',
    deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Lisa Park',
    priority: 'normal' as const,
  },
];

// Enhanced Team Activity Feed data
const enhancedTeamActivity = [
  { name: 'Sarah Chen', action: 'signed', target: 'Q4 Sales Agreement', time: '2m ago', avatar: 'SC', actionIcon: PenTool, actionColor: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Mike Johnson', action: 'approved', target: 'Vendor Contract', time: '15m ago', avatar: 'MJ', actionIcon: ThumbsUp, actionColor: 'text-teal-600 dark:text-teal-400' },
  { name: 'Emily Davis', action: 'commented on', target: 'NDA - Acme Corp', time: '1h ago', avatar: 'ED', actionIcon: MessageSquare, actionColor: 'text-cyan-600 dark:text-cyan-400' },
  { name: 'Alex Kim', action: 'viewed', target: 'Partnership Proposal', time: '2h ago', avatar: 'AK', actionIcon: Eye, actionColor: 'text-blue-600 dark:text-blue-400' },
  { name: 'Lisa Wang', action: 'signed', target: 'Lease Agreement', time: '3h ago', avatar: 'LW', actionIcon: PenTool, actionColor: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'David Kim', action: 'approved', target: 'Service Agreement', time: '4h ago', avatar: 'DK', actionIcon: ThumbsUp, actionColor: 'text-teal-600 dark:text-teal-400' },
  { name: 'Rachel Lee', action: 'commented on', target: 'Procurement Contract', time: '5h ago', avatar: 'RL', actionIcon: MessageSquare, actionColor: 'text-cyan-600 dark:text-cyan-400' },
];

// Signing Analytics mock data
const signingAnalytics = {
  avgSigningTime: 2.3, // days
  avgSigningTimeTrend: -12, // negative = improvement (faster)
  completionRate: 87, // percentage
  completionRateTrend: 5.2,
  weeklyComparison: [
    { week: 'This Week', avg: 2.1 },
    { week: 'Last Week', avg: 2.8 },
    { week: '2 Weeks Ago', avg: 3.2 },
  ],
};

const expiringSoonDocs = [
  {
    id: 'doc-exp-1',
    title: 'Enterprise License Agreement',
    expiresAt: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(), // 18h from now
    signer: 'David Kim',
  },
  {
    id: 'doc-exp-2',
    title: 'Employment Agreement - M. Torres',
    expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
    signer: 'Sarah Chen',
  },
  {
    id: 'doc-exp-3',
    title: 'Vendor Agreement - CloudSync',
    expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
    signer: 'John Martinez',
  },
  {
    id: 'doc-exp-4',
    title: 'Partnership MOU - DataViz',
    expiresAt: new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000).toISOString(), // 6.5 days
    signer: 'Emily Watson',
  },
];

// Expiring documents for dashboard widget
const expiringDocs = [
  { id: 'exp-1', title: 'Enterprise License Agreement', expiresIn: '3 days', expiryDate: 'Jan 18, 2026', owner: 'David Kim', urgency: 'critical' as const, progress: 95 },
  { id: 'exp-2', title: 'Office Lease Agreement', expiresIn: '12 days', expiryDate: 'Jan 27, 2026', owner: 'Sarah Chen', urgency: 'urgent' as const, progress: 82 },
  { id: 'exp-3', title: 'Software License - Adobe', expiresIn: '21 days', expiryDate: 'Feb 5, 2026', owner: 'Mike Johnson', urgency: 'soon' as const, progress: 68 },
  { id: 'exp-4', title: 'Insurance Policy - General', expiresIn: '28 days', expiryDate: 'Feb 12, 2026', owner: 'Lisa Park', urgency: 'soon' as const, progress: 55 },
];

// Signing velocity data (past 14 days)
const signingVelocityData = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  signed: Math.floor(Math.random() * 8) + 3 + Math.floor(Math.sin(i / 3) * 2),
}));

// Signing Velocity Trend: docs signed per day over last 7 days
const signingVelocityTrendData = [
  { day: 'Mon', signed: 8 },
  { day: 'Tue', signed: 12 },
  { day: 'Wed', signed: 10 },
  { day: 'Thu', signed: 15 },
  { day: 'Fri', signed: 11 },
  { day: 'Sat', signed: 5 },
  { day: 'Sun', signed: 3 },
];

// Recent Activity Map: document activity across regions/departments as heat grid
const activityRegions = ['Sales', 'Legal', 'HR', 'Finance', 'Ops', 'Engineering'];
const activityActionTypes = ['Signed', 'Approved', 'Created', 'Reviewed', 'Sent'];
const activityMapData = activityRegions.map((region) =>
  activityActionTypes.map((action) => ({
    region,
    action,
    value: Math.floor(Math.random() * 20) + 1,
  }))
);

// Quick Stats Footer data
const quickStatsFooterData = [
  { label: 'Documents This Week', value: 47, icon: FileText, color: 'from-emerald-500 to-teal-600', bgLight: 'bg-emerald-50', bgDark: 'dark:bg-emerald-950/20' },
  { label: 'Avg Sign Time', value: 2.3, suffix: ' days', decimals: 1, icon: Timer, color: 'from-teal-500 to-cyan-600', bgLight: 'bg-teal-50', bgDark: 'dark:bg-teal-950/20' },
  { label: 'Pending Approvals', value: 18, icon: ShieldCheck, color: 'from-cyan-500 to-teal-600', bgLight: 'bg-cyan-50', bgDark: 'dark:bg-cyan-950/20' },
  { label: 'Active Users', value: 24, icon: Users, color: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-950/20' },
];

// Weekly Activity Heatmap mock data (7 days x 24 hours)
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hourLabels = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];
const heatmapData = dayLabels.map((day, dayIdx) =>
  hourLabels.map((hour, hourIdx) => ({
    day,
    dayIdx,
    hour,
    hourIdx,
    value: Math.floor(
      // Simulate realistic activity patterns: higher mid-week, mid-day
      (Math.sin((dayIdx / 7) * Math.PI) * 3 +
        Math.sin((hourIdx / 9) * Math.PI) * 4 +
        Math.random() * 2) *
        2
    ),
  }))
);

// Deadline Tracker mock data
const deadlineData = [
  {
    id: 'dl-1',
    title: 'Enterprise License Agreement',
    deadline: new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'David Kim',
    priority: 'urgent' as const,
    docId: 'doc-1',
  },
  {
    id: 'dl-2',
    title: 'Employment Agreement',
    deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Sarah Chen',
    priority: 'high' as const,
    docId: 'doc-4',
  },
  {
    id: 'dl-3',
    title: 'Vendor Agreement - CloudSync',
    deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'John Martinez',
    priority: 'normal' as const,
    docId: 'doc-5',
  },
  {
    id: 'dl-4',
    title: 'Partnership MOU',
    deadline: new Date(now.getTime() + 6.5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Emily Watson',
    priority: 'low' as const,
    docId: 'doc-6',
  },
  {
    id: 'dl-5',
    title: 'Sales Contract - Global Logistics',
    deadline: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Lisa Park',
    priority: 'normal' as const,
    docId: 'doc-3',
  },
  {
    id: 'dl-6',
    title: 'NDA - TechStart Inc',
    deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // overdue
    assignedTo: 'Mike Johnson',
    priority: 'urgent' as const,
    docId: 'doc-2',
  },
];

// Quick Actions / Quick Links configuration (expanded to 6)
const quickActions = [
  {
    id: 'upload',
    label: 'Upload Document',
    description: 'Upload a PDF to sign or send',
    icon: Upload,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    page: 'documents' as const,
  },
  {
    id: 'template',
    label: 'Create Template',
    description: 'Build reusable templates',
    icon: LayoutTemplate,
    color: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    page: 'templates' as const,
  },
  {
    id: 'reports',
    label: 'View Reports',
    description: 'Analytics & insights',
    icon: BarChart3,
    color: 'from-cyan-500 to-teal-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    page: 'reports' as const,
  },
  {
    id: 'send',
    label: 'Request Signature',
    description: 'Send for e-signature',
    icon: Send,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    page: 'documents' as const,
  },
  {
    id: 'invite',
    label: 'Invite Team Member',
    description: 'Add users to workspace',
    icon: UserPlus,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    page: 'admin' as const,
  },
  {
    id: 'help',
    label: 'Help Center',
    description: 'Guides & documentation',
    icon: HelpCircle,
    color: 'from-slate-500 to-gray-600',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    page: 'settings' as const,
  },
];

// ============================================================
// Helper: Animated Counter Component
// ============================================================

function AnimatedValue({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const duration = 1200;

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ============================================================
// Helper: Circular Progress (Completion Rate)
// ============================================================

function CircularProgress({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#completionGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
        />
        <defs>
          <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <AnimatedValue value={value} suffix="%" decimals={0} />
        </motion.span>
        <span className="text-[10px] text-muted-foreground">Completion</span>
      </div>
    </div>
  );
}

// ============================================================
// Helper: Heatmap Cell
// ============================================================

function HeatmapCell({ value, maxVal }: { value: number; maxVal: number }) {
  const intensity = Math.max(0, Math.min(1, value / maxVal));
  const bgColor =
    intensity === 0
      ? 'bg-muted/20'
      : intensity < 0.25
        ? 'bg-emerald-100 dark:bg-emerald-900/30'
        : intensity < 0.5
          ? 'bg-emerald-300 dark:bg-emerald-700/50'
          : intensity < 0.75
            ? 'bg-emerald-500 dark:bg-emerald-600/70'
            : 'bg-emerald-700 dark:bg-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`w-7 h-7 rounded-sm ${bgColor} transition-colors`}
      title={`${value} activities`}
    />
  );
}

// ============================================================
// Helper: Urgency Color for Expiring Documents
// ============================================================

function getUrgencyStyle(expiresAt: string) {
  const hours = differenceInHours(new Date(expiresAt), now);
  if (hours < 24) return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900/50', label: 'critical' };
  if (hours < 72) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900/50', label: 'urgent' };
  return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-900/50', label: 'soon' };
}

function getDeadlineBorderStyle(deadline: string) {
  const hours = differenceInHours(new Date(deadline), now);
  if (hours < 0) return 'border-l-red-500'; // overdue
  if (hours < 24) return 'border-l-amber-500'; // due today
  if (hours < 168) return 'border-l-yellow-500'; // this week
  return 'border-l-emerald-500'; // later
}

function getCountdownText(deadline: string) {
  const hours = differenceInHours(new Date(deadline), now);
  if (hours < 0) return { text: 'Overdue', isOverdue: true };
  if (hours < 24) return { text: `${hours}h remaining`, isOverdue: false };
  const days = differenceInDays(new Date(deadline), now);
  return { text: `${days}d remaining`, isOverdue: false };
}

// ============================================================
// Helper: Team Activity Item
// ============================================================

function TeamActivityItem({ name, action, target, time, avatar, actionIcon: ActionIcon, actionColor }: {
  name: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
  actionIcon: React.ElementType;
  actionColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2 group"
    >
      <div className="relative shrink-0">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
            {avatar}
          </AvatarFallback>
        </Avatar>
        <div className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5 ${actionColor}`}>
          <ActionIcon className="h-2.5 w-2.5" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate">
          <span className="font-medium">{name}</span>{' '}
          <span className="text-muted-foreground">{action}</span>{' '}
          <span className="font-medium text-primary/80 truncate">{target}</span>
        </p>
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">{time}</span>
    </motion.div>
  );
}

// ============================================================
// Staggered container animation variants
// ============================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ============================================================
// Main Dashboard Page
// ============================================================

// Time-of-day greeting helper
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTimeEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️';
  if (hour < 17) return '🌤️';
  return '🌙';
}

export function DashboardPage() {
  const { navigate, user } = useAppStore();
  const [currentTime, setCurrentTime] = useState(now);

  // Update current time every minute for countdown accuracy
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.getDashboardStats();
      if (res.success && res.data) return res.data;
      return mockDashboardStats;
    },
    staleTime: 60 * 1000,
  });

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const res = await api.getRecentActivity(10);
      if (res.success && res.data && res.data.length > 0) return res.data;
      return mockActivity;
    },
    staleTime: 30 * 1000,
  });

  // Fetch pending documents
  const { data: pendingDocsData } = useQuery({
    queryKey: ['pending-documents'],
    queryFn: async () => {
      const res = await api.getDocuments({ status: ['sent'], pageSize: 5 });
      if (res.success && res.data && res.data.items.length > 0) return res.data.items;
      return mockDocuments.filter((d) => d.status === 'sent' || d.status === 'viewed');
    },
    staleTime: 30 * 1000,
  });

  // Fetch recent documents for horizontal scroll
  const { data: recentDocsData } = useQuery({
    queryKey: ['recent-documents'],
    queryFn: async () => {
      const res = await api.getDocuments({ pageSize: 8 });
      if (res.success && res.data && res.data.items.length > 0) return res.data.items;
      return mockDocuments.slice(0, 8);
    },
    staleTime: 30 * 1000,
  });

  // Fetch unread notifications count
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const res = await api.getUnreadCount();
      if (res.success && res.data) return res.data.count;
      return 5;
    },
    staleTime: 30 * 1000,
  });

  const stats: DashboardStats = statsData || mockDashboardStats;
  const activities: ActivityItem[] = activityData || mockActivity;
  const pendingDocs: Document[] = pendingDocsData || mockDocuments.filter(
    (d) => d.status === 'sent' || d.status === 'viewed'
  );
  const recentDocs: Document[] = recentDocsData || mockDocuments.slice(0, 8);
  const unreadCount = unreadData || 5;

  // Build status data from stats if available
  const statusData = defaultStatusData;

  // Quick Stats data
  const quickStatsItems = useMemo(() => [
    { icon: FileText, label: 'docs created today', value: 7, color: 'text-emerald-600 dark:text-emerald-400' },
    { icon: FileSignature, label: 'signatures today', value: 12, color: 'text-teal-600 dark:text-teal-400' },
    { icon: Timer, label: 'avg turnaround', value: '2.3 days', color: 'text-cyan-600 dark:text-cyan-400' },
    { icon: Bell, label: 'unread notifications', value: unreadCount, color: 'text-amber-600 dark:text-amber-400' },
    { icon: AlertTriangle, label: 'expiring soon', value: 4, color: 'text-amber-600 dark:text-amber-400' },
  ], [unreadCount]);



  // Heatmap max value for intensity calculation
  const heatmapMax = useMemo(
    () => Math.max(...heatmapData.flat().map((d) => d.value), 1),
    []
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'User'} {getTimeEmoji()}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your documents today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('documents')} variant="outline" size="sm" className="btn-click-scale btn-gradient-sweep">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button onClick={() => navigate('templates')} size="sm" className="bg-primary hover:bg-primary/90 btn-click-scale btn-gradient-sweep">
            <LayoutTemplate className="mr-2 h-4 w-4" />
            From Template
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="glass-card flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-cyan-50/80 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/20 border border-emerald-200/50 dark:border-emerald-900/30 card-shadow-premium"
      >
        {quickStatsItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <Icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm">
                <span className="font-semibold">{typeof item.value === 'number' ? <AnimatedValue value={item.value} /> : item.value}</span>{' '}
                <span className="text-muted-foreground text-xs">{item.label}</span>
              </span>
              {i < quickStatsItems.length - 1 && (
                <span className="hidden sm:inline text-border ml-2">|</span>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Today's Summary compact card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex items-center gap-4 px-4 py-2.5 rounded-lg border border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Today&apos;s Summary</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs"><span className="font-semibold">7</span> created</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileSignature className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-xs"><span className="font-semibold">12</span> signed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs"><span className="font-semibold">5</span> completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs"><span className="font-semibold">2</span> expiring</span>
        </div>
        {/* Mini sparkline visualization */}
        <div className="ml-auto hidden sm:flex items-center gap-0.5">
          {[3, 5, 4, 7, 6, 8, 7, 9, 8, 10, 9, 12].map((v, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-emerald-400/60"
              initial={{ height: 0 }}
              animate={{ height: `${(v / 12) * 16 + 2}px` }}
              transition={{ delay: 0.3 + i * 0.04, duration: 0.4, ease: 'easeOut' }}
            />
          ))}
        </div>
      </motion.div>

      {/* Stat Cards with View Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-fade-up">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Total Documents"
              value={stats.totalDocuments}
              trend={stats.documentsTrend}
              icon={<FileText className="h-5 w-5" />}
              variant="emerald"
              sparklineData={[65, 72, 68, 80, 75, 90, 85]}
              onViewDetails={() => navigate('documents')}
            />
            <StatCard
              title="Pending Signatures"
              value={stats.pendingSignatures}
              trend={stats.signaturesTrend}
              icon={<FileSignature className="h-5 w-5" />}
              variant="teal"
              sparklineData={[12, 15, 10, 18, 14, 11, 16]}
              onViewDetails={() => navigate('inbox')}
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              trend={stats.approvalsTrend}
              icon={<ShieldCheck className="h-5 w-5" />}
              variant="cyan"
              sparklineData={[8, 10, 6, 12, 9, 7, 11]}
              onViewDetails={() => navigate('inbox')}
            />
            <StatCard
              title="Completed This Month"
              value={stats.completedThisMonth}
              trend={stats.completedTrend}
              icon={<CheckCircle2 className="h-5 w-5" />}
              variant="amber"
              sparklineData={[20, 25, 22, 30, 28, 35, 32]}
              onViewDetails={() => navigate('documents')}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-fade-up">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.page)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-border ${action.bgColor} hover:shadow-md transition-all text-center group`}
              >
                <div className={`rounded-lg bg-gradient-to-br ${action.color} p-2.5 text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-[11px] text-muted-foreground">{action.description}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Documents - Horizontal scroll */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Documents</h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('documents')}>
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div className="relative">
          {/* Left gradient fade */}
          <div className="absolute left-0 top-0 bottom-2 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          {/* Right gradient fade */}
          <div className="absolute right-0 top-0 bottom-2 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth-x scroll-fade-edges">
            {recentDocs.slice(0, 6).map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                whileHover={{ y: -4 }}
                className="shrink-0 w-52"
              >
                <button
                  onClick={() => navigate('document-detail', { id: doc.id })}
                  className="w-full text-left rounded-xl border border-border bg-card p-3 hover:shadow-lg card-shadow-premium gradient-border-hover transition-all group"
                >
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{doc.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={doc.status} />
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
        </div>
      </motion.div>

      {/* Deadline Tracker Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Deadline Tracker
          </h2>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('documents')}>
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {deadlineData.map((dl, i) => {
            const countdown = getCountdownText(dl.deadline);
            const borderClass = getDeadlineBorderStyle(dl.deadline);
            const isOverdue = countdown.isOverdue;
            const isUrgent = !isOverdue && differenceInHours(new Date(dl.deadline), currentTime) < 24;

            return (
              <motion.div
                key={dl.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="shrink-0 w-56"
              >
                <button
                  onClick={() => navigate('document-detail', { id: dl.docId })}
                  className={`w-full text-left rounded-xl border-l-4 ${borderClass} border border-border bg-card p-4 hover:shadow-md transition-all group`}
                >
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors mb-1">
                    {dl.title}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(dl.deadline), 'MMM d, yyyy')}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{dl.assignedTo}</span>
                    <PriorityBadge priority={dl.priority} />
                  </div>
                  <motion.div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isOverdue
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        : isUrgent
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}
                    {...(isOverdue || isUrgent ? {
                      animate: { scale: [1, 1.05, 1] },
                      transition: { duration: 2, repeat: Infinity },
                    } : {})}
                  >
                    {isOverdue && <AlertTriangle className="h-3 w-3" />}
                    {isUrgent && !isOverdue && <Zap className="h-3 w-3" />}
                    {!isUrgent && !isOverdue && <Clock className="h-3 w-3" />}
                    {countdown.text}
                  </motion.div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Document Expiry Alert Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Expiring Documents
          </h2>
          <Button variant="ghost" size="sm" className="text-xs btn-gradient-sweep" onClick={() => navigate('document-expiry')}>
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger-fade-up">
          {expiringDocs.map((doc, i) => {
            const urgencyStyles = {
              critical: {
                border: 'border-l-red-500',
                bg: 'bg-red-50 dark:bg-red-950/20',
                text: 'text-red-600 dark:text-red-400',
                progressBg: 'bg-red-500',
                icon: <AlertTriangle className="h-3.5 w-3.5" />,
              },
              urgent: {
                border: 'border-l-amber-500',
                bg: 'bg-amber-50 dark:bg-amber-950/20',
                text: 'text-amber-600 dark:text-amber-400',
                progressBg: 'bg-amber-500',
                icon: <Clock className="h-3.5 w-3.5" />,
              },
              soon: {
                border: 'border-l-emerald-500',
                bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                text: 'text-emerald-600 dark:text-emerald-400',
                progressBg: 'bg-emerald-500',
                icon: <Clock className="h-3.5 w-3.5" />,
              },
            };
            const style = urgencyStyles[doc.urgency];

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.08, duration: 0.35 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="hover-card-glow"
              >
                <div className={`rounded-xl border-l-4 ${style.border} border border-border bg-card p-4 card-shadow-premium transition-all`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium truncate pr-2">{doc.title}</p>
                    <span className={`shrink-0 ${style.text}`}>
                      {style.icon}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold mb-1 ${style.text}`}>
                    Expires in {doc.expiresIn}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-3">
                    {doc.owner} · {doc.expiryDate}
                  </p>
                  {/* Progress bar showing time remaining */}
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${style.progressBg}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${doc.progress}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1 text-right">
                    {doc.progress}% lifespan used
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Signing Velocity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.52, duration: 0.4 }}
      >
        <Card className="border-border overflow-hidden hover-card-glow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Signing Velocity
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Avg {Math.round(signingVelocityData.reduce((a, b) => a + b.signed, 0) / signingVelocityData.length)} docs/day
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  +12%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={signingVelocityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="velocityStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="day"
                  className="text-xs"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} docs`, 'Signed']}
                />
                <Area
                  type="monotone"
                  dataKey="signed"
                  stroke="url(#velocityStroke)"
                  strokeWidth={2.5}
                  fill="url(#velocityGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: '#10b981', stroke: 'var(--card)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="divider-gradient my-2" />

      {/* Weekly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.4 }}
      >
        <Card className="border-border overflow-hidden hover-card-glow">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyActivityData} barGap={4} barCategoryGap="20%">
                <defs>
                  <linearGradient id="weeklyCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="weeklySigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="weeklyApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: 'var(--muted-foreground)' }} />
                <YAxis className="text-xs" tick={{ fill: 'var(--muted-foreground)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={28}
                  formatter={(value) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
                <Bar dataKey="created" fill="url(#weeklyCreated)" radius={[3, 3, 0, 0]} name="Created" />
                <Bar dataKey="signed" fill="url(#weeklySigned)" radius={[3, 3, 0, 0]} name="Signed" />
                <Bar dataKey="approved" fill="url(#weeklyApproved)" radius={[3, 3, 0, 0]} name="Approved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Deadlines & Document Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <Card className="border-border overflow-hidden h-full hover-card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {upcomingDeadlines.map((dl, i) => {
                  const countdown = getCountdownText(dl.deadline);
                  const isOverdue = countdown.isOverdue;
                  const isUrgent = dl.priority === 'urgent';
                  const isHigh = dl.priority === 'high';
                  const priorityColor = isUrgent
                    ? { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' }
                    : isHigh
                      ? { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' }
                      : { border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' };

                  return (
                    <motion.div
                      key={dl.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                      whileHover={{ scale: 1.01, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      onClick={() => navigate('documents')}
                      className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${priorityColor.border} border border-border ${priorityColor.bg} cursor-pointer hover:shadow-sm transition-all group`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {dl.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{dl.assignedTo}</p>
                      </div>
                      <motion.div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold shrink-0 ${priorityColor.badge}`}
                        {...(isUrgent || isOverdue ? {
                          animate: { scale: [1, 1.05, 1] },
                          transition: { duration: 2, repeat: Infinity },
                        } : {})}
                      >
                        {isOverdue && <AlertTriangle className="h-3 w-3" />}
                        {isUrgent && !isOverdue && <Zap className="h-3 w-3" />}
                        {!isUrgent && !isOverdue && <Clock className="h-3 w-3" />}
                        {countdown.text}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Document Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="border-border overflow-hidden h-full hover-card-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Document Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-48 shrink-0">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <defs>
                        {defaultStatusData.map((entry, index) => (
                          <linearGradient key={`grad-${index}`} id={`statusGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={defaultStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {defaultStatusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#statusGrad-${index})`} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {defaultStatusData.map((item, i) => {
                    const total = defaultStatusData.reduce((sum, d) => sum + d.value, 0);
                    const pct = Math.round((item.value / total) * 100);
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                        className="flex items-center gap-3 group"
                      >
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-medium w-20 truncate">{item.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">{item.value}</span>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Document Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <defs>
                    <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'var(--muted-foreground)' }} />
                  <YAxis className="text-xs" tick={{ fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="created" fill="url(#createdGradient)" radius={[4, 4, 0, 0]} name="Created" />
                  <Bar dataKey="completed" fill="url(#completedGradient)" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Document Activity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Signing Analytics Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Signing Analytics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-fade-up">
          {/* Average Signing Time Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-border overflow-hidden h-full bg-gradient-to-br from-teal-50/80 to-card dark:from-teal-950/20 dark:to-card border-teal-200/50 dark:border-teal-900/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Avg Signing Time</p>
                  <div className="rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 p-2 text-white">
                    <Timer className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">
                    <AnimatedValue value={signingAnalytics.avgSigningTime} decimals={1} />
                  </span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {signingAnalytics.avgSigningTimeTrend < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {Math.abs(signingAnalytics.avgSigningTimeTrend)}% faster
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-3 w-3 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        {signingAnalytics.avgSigningTimeTrend}% slower
                      </span>
                    </>
                  )}
                  <span className="text-[10px] text-muted-foreground">vs last week</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completion Rate Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-border overflow-hidden h-full bg-gradient-to-br from-emerald-50/80 to-card dark:from-emerald-950/20 dark:to-card border-emerald-200/50 dark:border-emerald-900/30">
              <CardContent className="p-5 flex flex-col items-center justify-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">Completion Rate</p>
                <CircularProgress value={signingAnalytics.completionRate} size={120} strokeWidth={10} />
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    +{signingAnalytics.completionRateTrend}% from last month
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Expiring Soon Card */}
          <motion.div variants={itemVariants} className="sm:col-span-2">
            <Card className="border-border overflow-hidden h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {expiringSoonDocs.map((doc, i) => {
                    const urgency = getUrgencyStyle(doc.expiresAt);
                    const hours = differenceInHours(new Date(doc.expiresAt), currentTime);
                    const timeLabel =
                      hours < 24
                        ? `${hours}h remaining`
                        : `${differenceInDays(new Date(doc.expiresAt), currentTime)}d remaining`;
                    const isCritical = hours < 24;

                    return (
                      <motion.button
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        onClick={() => navigate('document-detail', { id: doc.id })}
                        className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg border ${urgency.border} ${urgency.bg} hover:shadow-sm transition-all group`}
                      >
                        <div className={`shrink-0 rounded-md p-1.5 ${urgency.bg}`}>
                          {isCritical ? (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <AlertTriangle className={`h-4 w-4 ${urgency.color}`} />
                            </motion.div>
                          ) : (
                            <Clock className={`h-4 w-4 ${urgency.color}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                            {doc.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{doc.signer}</p>
                        </div>
                        <span className={`text-[10px] font-semibold whitespace-nowrap ${urgency.color}`}>
                          {timeLabel}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Weekly Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Card className="border-border overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Weekly Activity Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-flex flex-col gap-1">
                {/* Hour labels row */}
                <div className="flex gap-1">
                  <div className="w-10" /> {/* spacer for day labels */}
                  {hourLabels.map((hour) => (
                    <div key={hour} className="w-7 text-center text-[9px] text-muted-foreground">
                      {hour}
                    </div>
                  ))}
                </div>
                {/* Heatmap rows */}
                {heatmapData.map((row, dayIdx) => (
                  <div key={dayIdx} className="flex gap-1 items-center">
                    <div className="w-10 text-[10px] text-muted-foreground text-right pr-1">
                      {dayLabels[dayIdx]}
                    </div>
                    {row.map((cell) => (
                      <HeatmapCell key={`${dayIdx}-${cell.hourIdx}`} value={cell.value} maxVal={heatmapMax} />
                    ))}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-2 mt-2 ml-11">
                  <span className="text-[9px] text-muted-foreground">Less</span>
                  {['bg-muted/20', 'bg-emerald-100 dark:bg-emerald-900/30', 'bg-emerald-300 dark:bg-emerald-700/50', 'bg-emerald-500 dark:bg-emerald-600/70', 'bg-emerald-700 dark:bg-emerald-500'].map((bg, i) => (
                    <div key={i} className={`w-4 h-4 rounded-sm ${bg}`} />
                  ))}
                  <span className="text-[9px] text-muted-foreground">More</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('audit-logs')}>
                View all
              </Button>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ActivityFeed activities={activities.slice(0, 8)} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Needs Attention */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Needs Your Attention</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('inbox')}>
                <Inbox className="mr-1 h-4 w-4" />
                Inbox
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingDocs.map((doc, i) => (
                  <motion.button
                    key={doc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.01, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    onClick={() => navigate('document-detail', { id: doc.id })}
                    className="flex items-start gap-3 w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 hover:shadow-sm transition-all"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        From {doc.owner.name} · {doc.recipients.filter(r => r.status === 'pending').length} pending signatures
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={doc.status} />
                      <PriorityBadge priority={doc.priority} />
                    </div>
                  </motion.button>
                ))}
                {pendingDocs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No documents need your attention
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Team Activity
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('audit-logs')}>
                View all
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {enhancedTeamActivity.map((item, i) => (
                  <TeamActivityItem key={i} {...item} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity Map - Document activity across departments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
      >
        <Card className="border-border overflow-hidden hover-card-glow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Recent Activity Map
              </CardTitle>
              <span className="text-xs text-muted-foreground">Activity across departments</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-medium text-muted-foreground pb-2 pr-3">Department</th>
                    {activityActionTypes.map((action) => (
                      <th key={action} className="text-center text-[10px] font-medium text-muted-foreground pb-2 px-1">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activityMapData.map((row, i) => {
                    const maxVal = Math.max(...row.map((c) => c.value));
                    return (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.06, duration: 0.3 }}
                      >
                        <td className="text-xs font-medium text-muted-foreground py-1.5 pr-3 whitespace-nowrap">{row[0].region}</td>
                        {row.map((cell, j) => {
                          const intensity = cell.value / maxVal;
                          return (
                            <td key={j} className="px-1 py-1.5">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 + i * 0.06 + j * 0.03, duration: 0.2 }}
                                className={`w-full h-7 rounded-md flex items-center justify-center text-[10px] font-semibold transition-colors cursor-default ${
                                  intensity > 0.75
                                    ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                                    : intensity > 0.5
                                      ? 'bg-emerald-300 text-emerald-900 dark:bg-emerald-700/60 dark:text-emerald-100'
                                      : intensity > 0.25
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-muted/40 text-muted-foreground'
                                }`}
                                title={`${cell.region} - ${cell.action}: ${cell.value}`}
                              >
                                {cell.value}
                              </motion.div>
                            </td>
                          );
                        })}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[9px] text-muted-foreground">Less</span>
              {['bg-muted/40', 'bg-emerald-100 dark:bg-emerald-900/30', 'bg-emerald-300 dark:bg-emerald-700/60', 'bg-emerald-500 dark:bg-emerald-600'].map((bg, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${bg}`} />
              ))}
              <span className="text-[9px] text-muted-foreground">More</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Signing Velocity Trend - Mini chart showing docs signed per day over last 7 days */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
      >
        <Card className="border-border overflow-hidden hover-card-glow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <GitCommitHorizontal className="h-4 w-4 text-primary" />
                Signing Velocity Trend
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{signingVelocityTrendData.reduce((a, b) => a + b.signed, 0)}</span> docs
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  +8%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={signingVelocityTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="day"
                  className="text-xs"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} docs`, 'Signed']}
                />
                <Line
                  type="monotone"
                  dataKey="signed"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', strokeWidth: 2, stroke: 'var(--card)', r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#10b981', stroke: 'var(--card)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Footer with animated counters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        <div className="divider-gradient my-2" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-fade-up">
          {quickStatsFooterData.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.08, duration: 0.35 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="hover-card-glow"
              >
                <div className={`rounded-xl border border-border ${stat.bgLight} ${stat.bgDark} p-4 card-shadow-premium transition-all`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-2 text-white shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tracking-tight count-up-animate">
                      <AnimatedValue
                        value={stat.value}
                        suffix={stat.suffix || ''}
                        decimals={stat.decimals || 0}
                      />
                    </span>
                  </div>
                  {/* Mini progress indicator */}
                  <div className="mt-3 w-full h-1 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stat.value / 50) * 100, 100)}%` }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
