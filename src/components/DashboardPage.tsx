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
import {
  FileText,
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  Upload,
  LayoutTemplate,
  Inbox,
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

  const stats: DashboardStats = statsData || mockDashboardStats;
  const activities: ActivityItem[] = activityData || mockActivity;
  const pendingDocs: Document[] = pendingDocsData || mockDocuments.filter(
    (d) => d.status === 'sent' || d.status === 'viewed'
  );

  // Build status data from stats if available
  const statusData = defaultStatusData;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your documents today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('documents')} variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button onClick={() => navigate('templates')} size="sm" className="bg-primary hover:bg-primary/90">
            <LayoutTemplate className="mr-2 h-4 w-4" />
            From Template
          </Button>
        </div>
      </div>

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
              icon={<FileText className="h-5 w-5 text-primary" />}
            />
            <StatCard
              title="Pending Signatures"
              value={stats.pendingSignatures}
              trend={stats.signaturesTrend}
              icon={<FileSignature className="h-5 w-5 text-primary" />}
            />
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              trend={stats.approvalsTrend}
              icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            />
            <StatCard
              title="Completed This Month"
              value={stats.completedThisMonth}
              trend={stats.completedTrend}
              icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Document Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
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
                <Bar dataKey="created" fill="#10b981" radius={[4, 4, 0, 0]} name="Created" />
                <Bar dataKey="completed" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
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
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
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

        {/* Needs Attention */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Needs Your Attention</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('inbox')}>
              <Inbox className="mr-1 h-4 w-4" />
              Inbox
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => navigate('document-detail', { id: doc.id })}
                  className="flex items-start gap-3 w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
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
                </button>
              ))}
              {pendingDocs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No documents need your attention
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
