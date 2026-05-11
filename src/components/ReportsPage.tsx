'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  ShieldCheck,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileSignature,
  Target,
  Award,
  Timer,
  Eye,
  Send,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { format, subDays, formatDistanceToNow } from 'date-fns';

// ============================================================
// Mock Data
// ============================================================

const documentActivityData = [
  { date: 'Jan 6', created: 18, signed: 12, completed: 8 },
  { date: 'Jan 7', created: 22, signed: 15, completed: 11 },
  { date: 'Jan 8', created: 15, signed: 10, completed: 7 },
  { date: 'Jan 9', created: 28, signed: 20, completed: 15 },
  { date: 'Jan 10', created: 32, signed: 24, completed: 18 },
  { date: 'Jan 11', created: 20, signed: 16, completed: 12 },
  { date: 'Jan 12', created: 12, signed: 8, completed: 5 },
  { date: 'Jan 13', created: 25, signed: 18, completed: 14 },
  { date: 'Jan 14', created: 30, signed: 22, completed: 17 },
  { date: 'Jan 15', created: 35, signed: 28, completed: 20 },
  { date: 'Jan 16', created: 27, signed: 19, completed: 14 },
  { date: 'Jan 17', created: 38, signed: 30, completed: 24 },
  { date: 'Jan 18', created: 22, signed: 15, completed: 10 },
  { date: 'Jan 19', created: 16, signed: 10, completed: 7 },
];

const departmentPerformanceData = [
  { department: 'HR', avgDays: 1.8, target: 3 },
  { department: 'Finance', avgDays: 2.4, target: 3 },
  { department: 'Legal', avgDays: 3.6, target: 3 },
  { department: 'Engineering', avgDays: 1.5, target: 3 },
  { department: 'Sales', avgDays: 2.1, target: 3 },
  { department: 'Marketing', avgDays: 2.8, target: 3 },
];

const documentStatusData = [
  { name: 'Completed', value: 342, color: '#10b981' },
  { name: 'In Progress', value: 87, color: '#14b8a6' },
  { name: 'Pending Signature', value: 56, color: '#06b6d4' },
  { name: 'Draft', value: 34, color: '#94a3b8' },
  { name: 'Expired', value: 12, color: '#f59e0b' },
  { name: 'Rejected', value: 8, color: '#ef4444' },
];

const topSignersData = [
  { id: 1, name: 'Sarah Chen', email: 'sarah.chen@acme.com', department: 'HR', documentsSigned: 48, avgTimeDays: 1.2, completionRate: 98, avatar: 'SC' },
  { id: 2, name: 'David Kim', email: 'david.kim@acme.com', department: 'Finance', documentsSigned: 42, avgTimeDays: 1.5, completionRate: 96, avatar: 'DK' },
  { id: 3, name: 'Emily Watson', email: 'emily.w@acme.com', department: 'Legal', documentsSigned: 39, avgTimeDays: 2.1, completionRate: 92, avatar: 'EW' },
  { id: 4, name: 'John Martinez', email: 'john.m@acme.com', department: 'Sales', documentsSigned: 35, avgTimeDays: 1.8, completionRate: 94, avatar: 'JM' },
  { id: 5, name: 'Lisa Park', email: 'lisa.park@acme.com', department: 'Engineering', documentsSigned: 31, avgTimeDays: 0.9, completionRate: 100, avatar: 'LP' },
  { id: 6, name: 'Alex Rivera', email: 'alex.r@acme.com', department: 'Marketing', documentsSigned: 28, avgTimeDays: 2.3, completionRate: 89, avatar: 'AR' },
  { id: 7, name: 'Mike Johnson', email: 'mike.j@acme.com', department: 'Finance', documentsSigned: 25, avgTimeDays: 1.7, completionRate: 95, avatar: 'MJ' },
];

const monthlyTrendsData = [
  { month: 'Aug', documents: 156, signatures: 142, avgTime: 3.2, completionRate: 82 },
  { month: 'Sep', documents: 178, signatures: 160, avgTime: 2.9, completionRate: 84 },
  { month: 'Oct', documents: 195, signatures: 178, avgTime: 2.6, completionRate: 86 },
  { month: 'Nov', documents: 210, signatures: 195, avgTime: 2.4, completionRate: 88 },
  { month: 'Dec', documents: 188, signatures: 172, avgTime: 2.5, completionRate: 87 },
  { month: 'Jan', documents: 234, signatures: 218, avgTime: 2.1, completionRate: 91 },
];

const departmentBreakdownData = [
  { department: 'HR', documents: 78, percentage: 100 },
  { department: 'Finance', documents: 65, percentage: 83 },
  { department: 'Legal', documents: 54, percentage: 69 },
  { department: 'Engineering', documents: 48, percentage: 62 },
  { department: 'Sales', documents: 42, percentage: 54 },
  { department: 'Marketing', documents: 35, percentage: 45 },
];

const complianceData = [
  { name: 'Compliance', value: 94, fill: 'url(#complianceGradient)' },
];

const recentActivityData = [
  { id: 1, type: 'signed', user: 'Sarah Chen', action: 'signed', target: 'Employment Agreement - Q1', time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), department: 'HR' },
  { id: 2, type: 'completed', user: 'System', action: 'completed', target: 'Vendor Contract - CloudSync', time: new Date(Date.now() - 12 * 60 * 1000).toISOString(), department: 'Finance' },
  { id: 3, type: 'sent', user: 'David Kim', action: 'sent for signature', target: 'NDA - TechStart Inc', time: new Date(Date.now() - 28 * 60 * 1000).toISOString(), department: 'Legal' },
  { id: 4, type: 'viewed', user: 'Emily Watson', action: 'viewed', target: 'Partnership MOU', time: new Date(Date.now() - 45 * 60 * 1000).toISOString(), department: 'Sales' },
  { id: 5, type: 'rejected', user: 'John Martinez', action: 'rejected', target: 'Lease Agreement - Suite 400', time: new Date(Date.now() - 1.2 * 60 * 60 * 1000).toISOString(), department: 'Finance' },
  { id: 6, type: 'signed', user: 'Lisa Park', action: 'signed', target: 'IP Assignment - Project Alpha', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), department: 'Engineering' },
  { id: 7, type: 'created', user: 'Alex Rivera', action: 'created', target: 'Marketing Budget Q2', time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), department: 'Marketing' },
  { id: 8, type: 'completed', user: 'System', action: 'completed', target: 'Consulting Agreement - Deloitte', time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), department: 'Legal' },
  { id: 9, type: 'signed', user: 'Mike Johnson', action: 'signed', target: 'Revenue Share Agreement', time: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(), department: 'Sales' },
  { id: 10, type: 'expired', user: 'System', action: 'expired', target: 'Old Vendor Agreement - Retired', time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), department: 'Finance' },
];

// ============================================================
// Animation Variants
// ============================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ============================================================
// Helper: Animated Counter
// ============================================================

function AnimatedCounter({ value, suffix = '', decimals = 0, duration = 1.2 }: {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ============================================================
// Helper: Circular Progress
// ============================================================

function CircularProgress({ value, size = 100, strokeWidth = 8 }: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
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
          stroke="url(#circularGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
        />
        <defs>
          <linearGradient id="circularGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <AnimatedCounter value={value} suffix="%" decimals={0} />
        </motion.span>
      </div>
    </div>
  );
}

// ============================================================
// Helper: Activity Icon
// ============================================================

function getActivityIcon(type: string) {
  switch (type) {
    case 'signed':
      return { icon: FileSignature, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
    case 'completed':
      return { icon: CheckCircle2, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/30' };
    case 'sent':
      return { icon: Send, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30' };
    case 'viewed':
      return { icon: Eye, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    case 'rejected':
      return { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
    case 'expired':
      return { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' };
    case 'created':
      return { icon: FileText, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30' };
    default:
      return { icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted' };
  }
}

// ============================================================
// Custom Tooltip
// ============================================================

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================
// Main Reports Page
// ============================================================

export function ReportsPage() {
  const { navigate } = useAppStore();
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  // Key metrics
  const metrics = useMemo(() => ({
    totalDocuments: 539,
    totalDocumentsTrend: 12.4,
    avgTurnaround: 2.1,
    avgTurnaroundTrend: -8.7,
    completionRate: 91,
    completionRateTrend: 5.2,
    requiringAction: 23,
    urgent: 5,
    high: 8,
    normal: 10,
  }), []);

  // Filtered activity data based on date range
  const filteredActivityData = useMemo(() => {
    const days = parseInt(dateRange);
    return documentActivityData.slice(-days);
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your document signing workflow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="btn-click-scale">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="signers">Signers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Key Metrics Row */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Total Documents */}
            <motion.div variants={itemVariants}>
              <Card className="border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/80 to-card dark:from-emerald-950/20 dark:to-card overflow-hidden relative">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                    <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2 text-white">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">
                      <AnimatedCounter value={metrics.totalDocuments} />
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      +{metrics.totalDocumentsTrend}% from last period
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-5">
                    <FileText className="h-24 w-24 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Average Turnaround Time */}
            <motion.div variants={itemVariants}>
              <Card className="border-teal-200/50 dark:border-teal-900/30 bg-gradient-to-br from-teal-50/80 to-card dark:from-teal-950/20 dark:to-card overflow-hidden relative">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Avg Turnaround</p>
                    <div className="rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 p-2 text-white">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">
                      <AnimatedCounter value={metrics.avgTurnaround} decimals={1} />
                    </span>
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingDown className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {Math.abs(metrics.avgTurnaroundTrend)}% faster
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-5">
                    <Clock className="h-24 w-24 text-teal-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Signature Completion Rate */}
            <motion.div variants={itemVariants}>
              <Card className="border-cyan-200/50 dark:border-cyan-900/30 bg-gradient-to-br from-cyan-50/80 to-card dark:from-cyan-950/20 dark:to-card overflow-hidden">
                <CardContent className="p-5 flex items-center gap-4">
                  <CircularProgress value={metrics.completionRate} size={90} strokeWidth={7} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        +{metrics.completionRateTrend}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">vs last period</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Documents Requiring Action */}
            <motion.div variants={itemVariants}>
              <Card className="border-amber-200/50 dark:border-amber-900/30 bg-gradient-to-br from-amber-50/80 to-card dark:from-amber-950/20 dark:to-card overflow-hidden relative">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Require Action</p>
                    <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-2 text-white">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">
                      <AnimatedCounter value={metrics.requiringAction} />
                    </span>
                    <span className="text-sm text-muted-foreground">docs</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="destructive" className="text-[9px] h-4 px-1.5">{metrics.urgent} urgent</Badge>
                    <Badge className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0">{metrics.high} high</Badge>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{metrics.normal} normal</Badge>
                  </div>
                  <div className="absolute -bottom-2 -right-2 opacity-5">
                    <AlertTriangle className="h-24 w-24 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Charts Row 1: Document Activity + Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="border-border overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Document Activity</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Created, signed, and completed over time
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={filteredActivityData}>
                      <defs>
                        <linearGradient id="createdAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="signedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="completedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                      <YAxis className="text-xs" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-xs text-foreground">{value}</span>
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="created"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#createdAreaGrad)"
                        name="Created"
                      />
                      <Area
                        type="monotone"
                        dataKey="signed"
                        stroke="#14b8a6"
                        strokeWidth={2}
                        fill="url(#signedAreaGrad)"
                        name="Signed"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill="url(#completedAreaGrad)"
                        name="Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Document Status Distribution - Donut Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Card className="border-border overflow-hidden h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status Distribution</CardTitle>
                  <CardDescription className="text-xs">Current document statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={documentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        animationBegin={300}
                        animationDuration={1200}
                      >
                        {documentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value} docs`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                    {documentStatusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] text-muted-foreground truncate">{item.name}</span>
                        <span className="text-[11px] font-semibold ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts Row 2: Signing Performance + Monthly Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signing Performance by Department */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Card className="border-border overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Signing Performance</CardTitle>
                  <CardDescription className="text-xs">Average signing speed by department (days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={departmentPerformanceData} layout="vertical">
                      <defs>
                        <linearGradient id="perfBarGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                      <YAxis dataKey="department" type="category" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgDays" fill="url(#perfBarGrad)" radius={[0, 6, 6, 0]} name="Avg Days" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Trends */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Card className="border-border overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Monthly Trends</CardTitle>
                  <CardDescription className="text-xs">6-month document and signature trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyTrendsData}>
                      <defs>
                        <linearGradient id="docsLineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value: string) => (
                          <span className="text-xs text-foreground">{value}</span>
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="documents"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                        name="Documents"
                      />
                      <Line
                        type="monotone"
                        dataKey="signatures"
                        stroke="#14b8a6"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#14b8a6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, stroke: '#14b8a6', strokeWidth: 2 }}
                        name="Signatures"
                      />
                      <Line
                        type="monotone"
                        dataKey="completionRate"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Completion %"
                        yAxisId={0}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bottom Row: Compliance Score + Recent Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compliance Score */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <Card className="border-border overflow-hidden h-full bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50 dark:from-emerald-950/10 dark:via-teal-950/5 dark:to-cyan-950/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Compliance Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={complianceData} startAngle={180} endAngle={0}>
                      <defs>
                        <linearGradient id="complianceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill="url(#complianceGradient)"
                        background={{ fill: 'var(--muted)', opacity: 0.15 }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="text-center -mt-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1, duration: 0.4 }}
                    >
                      <span className="text-4xl font-bold tracking-tight">
                        <AnimatedCounter value={94} suffix="%" decimals={0} />
                      </span>
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">Enterprise Compliance Level</p>
                  </div>
                  <div className="w-full mt-4 space-y-2">
                    {[
                      { label: 'Audit Trail Integrity', value: 98, color: 'bg-emerald-500' },
                      { label: 'Authentication Security', value: 96, color: 'bg-teal-500' },
                      { label: 'Data Retention Policy', value: 92, color: 'bg-cyan-500' },
                      { label: 'Access Control Compliance', value: 90, color: 'bg-amber-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-muted-foreground">{item.label}</span>
                          <span className="text-[11px] font-semibold">{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="lg:col-span-2"
            >
              <Card className="border-border overflow-hidden h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Recent Activity
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => navigate('audit-logs')}
                    >
                      View all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    <AnimatePresence>
                      {recentActivityData.map((activity, i) => {
                        const iconData = getActivityIcon(activity.type);
                        const Icon = iconData.icon;
                        return (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors group"
                          >
                            <div className={`rounded-lg p-1.5 shrink-0 ${iconData.bg}`}>
                              <Icon className={`h-3.5 w-3.5 ${iconData.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate">
                                <span className="font-medium">{activity.user}</span>{' '}
                                <span className="text-muted-foreground">{activity.action}</span>{' '}
                                <span className="font-medium text-primary/80 truncate">{activity.target}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[9px] h-3.5 px-1">{activity.department}</Badge>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                            </span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown - Horizontal Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-border overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Department Activity</CardTitle>
                  <CardDescription className="text-xs">Documents processed by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentBreakdownData} layout="vertical">
                      <defs>
                        <linearGradient id="deptBarGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.9} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                      <YAxis dataKey="department" type="category" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={80} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="documents" fill="url(#deptBarGrad)" radius={[0, 6, 6, 0]} name="Documents" barSize={22}>
                        {departmentBreakdownData.map((_, index) => (
                          <Cell key={`dept-cell-${index}`} fill="url(#deptBarGrad)" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Department Detail Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                { name: 'HR', docs: 78, avgTime: 1.8, rate: 96, icon: Users, gradient: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50/80 dark:from-emerald-950/20', border: 'border-emerald-200/50 dark:border-emerald-900/30' },
                { name: 'Finance', docs: 65, avgTime: 2.4, rate: 92, icon: Target, gradient: 'from-teal-500 to-cyan-600', bg: 'from-teal-50/80 dark:from-teal-950/20', border: 'border-teal-200/50 dark:border-teal-900/30' },
                { name: 'Legal', docs: 54, avgTime: 3.6, rate: 85, icon: ShieldCheck, gradient: 'from-cyan-500 to-teal-600', bg: 'from-cyan-50/80 dark:from-cyan-950/20', border: 'border-cyan-200/50 dark:border-cyan-900/30' },
                { name: 'Engineering', docs: 48, avgTime: 1.5, rate: 100, icon: Zap, gradient: 'from-emerald-500 to-cyan-600', bg: 'from-emerald-50/80 dark:from-emerald-950/20', border: 'border-emerald-200/50 dark:border-emerald-900/30' },
                { name: 'Sales', docs: 42, avgTime: 2.1, rate: 94, icon: TrendingUp, gradient: 'from-teal-500 to-emerald-600', bg: 'from-teal-50/80 dark:from-teal-950/20', border: 'border-teal-200/50 dark:border-teal-900/30' },
                { name: 'Marketing', docs: 35, avgTime: 2.8, rate: 89, icon: Award, gradient: 'from-cyan-500 to-emerald-600', bg: 'from-cyan-50/80 dark:from-cyan-950/20', border: 'border-cyan-200/50 dark:border-cyan-900/30' },
              ].map((dept) => {
                const DeptIcon = dept.icon;
                return (
                  <motion.div key={dept.name} variants={itemVariants}>
                    <Card className={`border ${dept.border} bg-gradient-to-br ${dept.bg} to-card overflow-hidden`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`rounded-lg bg-gradient-to-br ${dept.gradient} p-1.5 text-white`}>
                            <DeptIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-semibold">{dept.name}</span>
                          <Badge variant="secondary" className="ml-auto text-[10px]">{dept.docs} docs</Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-muted-foreground">Avg Turnaround</span>
                              <span className="text-[10px] font-semibold">{dept.avgTime} days</span>
                            </div>
                            <Progress value={Math.max(0, 100 - (dept.avgTime / 5) * 100)} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-muted-foreground">Completion Rate</span>
                              <span className="text-[10px] font-semibold">{dept.rate}%</span>
                            </div>
                            <Progress value={dept.rate} className="h-1.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Department Signing Speed Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card className="border-border overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Signing Speed by Department</CardTitle>
                <CardDescription className="text-xs">Average days to complete signing vs 3-day target</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentPerformanceData}>
                    <defs>
                      <linearGradient id="speedBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="department" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                    <Bar dataKey="avgDays" fill="url(#speedBarGrad)" radius={[6, 6, 0, 0]} name="Avg Days" barSize={40} />
                    <Bar dataKey="target" fill="#94a3b8" fillOpacity={0.3} radius={[6, 6, 0, 0]} name="Target (3d)" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Signers Tab */}
        <TabsContent value="signers" className="space-y-6 mt-4">
          {/* Top Signers Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-border overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Top Signers
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Most active signers ranked by document volume
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="btn-click-scale">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Signer</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Docs Signed</TableHead>
                      <TableHead className="text-right">Avg Time</TableHead>
                      <TableHead className="text-right">Completion Rate</TableHead>
                      <TableHead className="text-right">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSignersData.map((signer, i) => (
                      <motion.tr
                        key={signer.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        className="hover:bg-accent/50 transition-colors border-b group"
                      >
                        <TableCell>
                          <span className={`text-xs font-bold ${
                            i === 0 ? 'text-amber-500' :
                            i === 1 ? 'text-slate-400' :
                            i === 2 ? 'text-amber-700 dark:text-amber-600' :
                            'text-muted-foreground'
                          }`}>
                            {i + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                                {signer.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium group-hover:text-primary transition-colors">{signer.name}</p>
                              <p className="text-[10px] text-muted-foreground">{signer.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{signer.department}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{signer.documentsSigned}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm ${signer.avgTimeDays <= 2 ? 'text-emerald-600 dark:text-emerald-400' : signer.avgTimeDays <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {signer.avgTimeDays}d
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-semibold ${signer.completionRate >= 95 ? 'text-emerald-600 dark:text-emerald-400' : signer.completionRate >= 90 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {signer.completionRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Progress value={signer.completionRate} className="h-1.5 w-16" />
                            {signer.completionRate >= 95 ? (
                              <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            ) : signer.completionRate >= 90 ? (
                              <ArrowUpRight className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {/* Signer Performance Summary Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { label: 'Total Active Signers', value: 47, icon: Users, trend: 8.3, suffix: '' },
              { label: 'Avg Signer Rating', value: 4.6, icon: Award, trend: 2.1, suffix: '/5' },
              { label: 'Fastest Signer', value: 0.9, icon: Zap, trend: 0, suffix: 'd avg', extra: 'Lisa Park' },
              { label: 'Most Productive', value: 48, icon: Target, trend: 12, suffix: ' docs', extra: 'Sarah Chen' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} variants={itemVariants}>
                  <Card className="border-border overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                        <div className="rounded-lg bg-primary/10 p-1.5">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold tracking-tight">
                        {typeof stat.value === 'number' && stat.value > 10 ? (
                          <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                        ) : (
                          <AnimatedCounter value={stat.value} decimals={stat.value % 1 !== 0 ? 1 : 0} suffix={stat.suffix} />
                        )}
                      </p>
                      {stat.trend > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            +{stat.trend}% from last month
                          </span>
                        </div>
                      )}
                      {stat.extra && (
                        <p className="text-[10px] text-muted-foreground mt-1">{stat.extra}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Signing Trend by Top 5 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card className="border-border overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Signer Volume Trend</CardTitle>
                <CardDescription className="text-xs">Monthly signing volume for top 5 signers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[
                    { month: 'Aug', sarah: 8, david: 7, emily: 6, john: 5, lisa: 4 },
                    { month: 'Sep', sarah: 9, david: 6, emily: 7, john: 6, lisa: 5 },
                    { month: 'Oct', sarah: 7, david: 8, emily: 5, john: 7, lisa: 6 },
                    { month: 'Nov', sarah: 10, david: 7, emily: 8, john: 5, lisa: 5 },
                    { month: 'Dec', sarah: 8, david: 9, emily: 6, john: 6, lisa: 7 },
                    { month: 'Jan', sarah: 11, david: 8, emily: 7, john: 8, lisa: 6 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value: string) => {
                        const names: Record<string, string> = { sarah: 'Sarah', david: 'David', emily: 'Emily', john: 'John', lisa: 'Lisa' };
                        return <span className="text-xs text-foreground">{names[value] || value}</span>;
                      }}
                    />
                    <Bar dataKey="sarah" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Sarah" />
                    <Bar dataKey="david" stackId="a" fill="#14b8a6" name="David" />
                    <Bar dataKey="emily" stackId="a" fill="#06b6d4" name="Emily" />
                    <Bar dataKey="john" stackId="a" fill="#f59e0b" name="John" />
                    <Bar dataKey="lisa" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Lisa" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
