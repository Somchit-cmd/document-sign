'use client';

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
import { Badge } from '@/components/ui/badge';
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
} from 'recharts';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

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
  { name: 'Sent', value: 18, color: '#06b6d4' },
  { name: 'Draft', value: 12, color: '#94a3b8' },
  { name: 'Rejected', value: 5, color: '#ef4444' },
];

// Quick Actions configuration
const quickActions = [
  {
    id: 'upload',
    label: 'Upload Document',
    description: 'Upload a PDF to sign',
    icon: Upload,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    page: 'documents' as const,
  },
  {
    id: 'template',
    label: 'Create from Template',
    description: 'Use a pre-built template',
    icon: LayoutTemplate,
    color: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    page: 'templates' as const,
  },
  {
    id: 'send',
    label: 'Send for Signature',
    description: 'Route to signers',
    icon: Send,
    color: 'from-cyan-500 to-teal-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    page: 'documents' as const,
  },
  {
    id: 'inbox',
    label: 'View Inbox',
    description: 'Pending approvals',
    icon: Inbox,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    page: 'inbox' as const,
  },
];

// Team Activity item
function TeamActivityItem({ name, action, target, time, avatar }: {
  name: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2"
    >
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
          {avatar}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs truncate">
          <span className="font-medium">{name}</span>{' '}
          <span className="text-muted-foreground">{action}</span>{' '}
          <span className="font-medium text-primary/80 truncate">{target}</span>
        </p>
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{time}</span>
    </motion.div>
  );
}

export function DashboardPage() {
  const { navigate, user } = useAppStore();

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

  const stats: DashboardStats = statsData || mockDashboardStats;
  const activities: ActivityItem[] = activityData || mockActivity;
  const pendingDocs: Document[] = pendingDocsData || mockDocuments.filter(
    (d) => d.status === 'sent' || d.status === 'viewed'
  );
  const recentDocs: Document[] = recentDocsData || mockDocuments.slice(0, 8);

  // Build status data from stats if available
  const statusData = defaultStatusData;

  // Mock team activity data
  const teamActivity = [
    { name: 'Sarah Chen', action: 'signed', target: 'Q4 Sales Agreement', time: '2m ago', avatar: 'SC' },
    { name: 'Mike Johnson', action: 'approved', target: 'Vendor Contract', time: '15m ago', avatar: 'MJ' },
    { name: 'Emily Davis', action: 'sent', target: 'NDA - Acme Corp', time: '1h ago', avatar: 'ED' },
    { name: 'Alex Kim', action: 'viewed', target: 'Partnership Proposal', time: '2h ago', avatar: 'AK' },
    { name: 'Lisa Wang', action: 'rejected', target: 'Lease Agreement', time: '3h ago', avatar: 'LW' },
  ];

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
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your documents today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('documents')} variant="outline" size="sm" className="btn-click-scale">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button onClick={() => navigate('templates')} size="sm" className="bg-primary hover:bg-primary/90 btn-click-scale">
            <LayoutTemplate className="mr-2 h-4 w-4" />
            From Template
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            />
            <StatCard
              title="Pending Signatures"
              value={stats.pendingSignatures}
              trend={stats.signaturesTrend}
              icon={<FileSignature className="h-5 w-5" />}
              variant="teal"
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              trend={stats.approvalsTrend}
              icon={<ShieldCheck className="h-5 w-5" />}
              variant="cyan"
            />
            <StatCard
              title="Completed This Month"
              value={stats.completedThisMonth}
              trend={stats.completedTrend}
              icon={<CheckCircle2 className="h-5 w-5" />}
              variant="amber"
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
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {recentDocs.slice(0, 6).map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
              whileHover={{ y: -3 }}
              className="shrink-0 w-52"
            >
              <button
                onClick={() => navigate('document-detail', { id: doc.id })}
                className="w-full text-left rounded-xl border border-border bg-card p-3 hover:shadow-md transition-all group"
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
      </motion.div>

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
              <CardTitle className="text-base">Document Status</CardTitle>
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

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
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
          transition={{ delay: 0.7, duration: 0.4 }}
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
          transition={{ delay: 0.8, duration: 0.4 }}
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
                {teamActivity.map((item, i) => (
                  <TeamActivityItem key={i} {...item} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
