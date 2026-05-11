'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Trophy, Medal, Crown, Zap, CheckCircle2, Moon, Sun, Users, Flame,
  Timer, GraduationCap, Shield, Sparkles, Cake, ArrowUp, ArrowDown,
  Minus, TrendingUp, Star
} from 'lucide-react';

// ============================================================
// Mock Data
// ============================================================

const teamMembers = [
  { id: 1, name: 'Sarah Chen', department: 'HR', role: 'HR Director', avatar: 'SC', docsSigned: 48, approvalRate: 98, avgResponseTime: '1.2h', streak: 12, rankChange: 0, points: 2840, badge: 'Top Performer' as const },
  { id: 2, name: 'David Kim', department: 'Finance', role: 'Finance Lead', avatar: 'DK', docsSigned: 42, approvalRate: 96, avgResponseTime: '1.5h', streak: 8, rankChange: 2, points: 2520, badge: 'Top Performer' as const },
  { id: 3, name: 'Emily Watson', department: 'Legal', role: 'Legal Counsel', avatar: 'EW', docsSigned: 39, approvalRate: 92, avgResponseTime: '2.1h', streak: 15, rankChange: -1, points: 2340, badge: 'Rising Star' as const },
  { id: 4, name: 'John Martinez', department: 'Sales', role: 'Sales Manager', avatar: 'JM', docsSigned: 35, approvalRate: 94, avgResponseTime: '1.8h', streak: 6, rankChange: 1, points: 2100, badge: 'Rising Star' as const },
  { id: 5, name: 'Lisa Park', department: 'Engineering', role: 'Tech Lead', avatar: 'LP', docsSigned: 31, approvalRate: 100, avgResponseTime: '0.9h', streak: 22, rankChange: 3, points: 1980, badge: 'Top Performer' as const },
  { id: 6, name: 'Alex Rivera', department: 'Marketing', role: 'Marketing Director', avatar: 'AR', docsSigned: 28, approvalRate: 89, avgResponseTime: '2.3h', streak: 4, rankChange: -2, points: 1680, badge: 'Rising Star' as const },
  { id: 7, name: 'Mike Johnson', department: 'Finance', role: 'Senior Accountant', avatar: 'MJ', docsSigned: 25, approvalRate: 95, avgResponseTime: '1.7h', streak: 9, rankChange: 0, points: 1500, badge: 'Rising Star' as const },
  { id: 8, name: 'Rachel Green', department: 'HR', role: 'HR Specialist', avatar: 'RG', docsSigned: 23, approvalRate: 97, avgResponseTime: '1.1h', streak: 18, rankChange: 1, points: 1420, badge: 'Top Performer' as const },
  { id: 9, name: 'Tom Anderson', department: 'Legal', role: 'Paralegal', avatar: 'TA', docsSigned: 20, approvalRate: 91, avgResponseTime: '2.5h', streak: 3, rankChange: -1, points: 1200, badge: 'Rising Star' as const },
  { id: 10, name: 'Nina Patel', department: 'Engineering', role: 'Software Engineer', avatar: 'NP', docsSigned: 18, approvalRate: 93, avgResponseTime: '1.4h', streak: 11, rankChange: 2, points: 1080, badge: 'Rising Star' as const },
  { id: 11, name: 'Chris Lee', department: 'Sales', role: 'Account Executive', avatar: 'CL', docsSigned: 15, approvalRate: 88, avgResponseTime: '3.0h', streak: 2, rankChange: -3, points: 900, badge: 'Rising Star' as const },
  { id: 12, name: 'Diana Ross', department: 'Marketing', role: 'Content Manager', avatar: 'DR', docsSigned: 12, approvalRate: 90, avgResponseTime: '2.8h', streak: 5, rankChange: 0, points: 720, badge: 'Rising Star' as const },
];

const departments = [
  { name: 'HR', icon: Users, color: 'from-emerald-500 to-teal-500', teamSize: 8, totalSigned: 71, avgTurnaround: '1.15h', completionRate: 97, weeklyTrend: [5, 8, 6, 9, 7, 10, 8], topPerformer: 'Sarah Chen', topPerformerAvatar: 'SC' },
  { name: 'Finance', icon: Trophy, color: 'from-amber-500 to-orange-500', teamSize: 6, totalSigned: 67, avgTurnaround: '1.6h', completionRate: 95, weeklyTrend: [4, 6, 7, 5, 8, 6, 9], topPerformer: 'David Kim', topPerformerAvatar: 'DK' },
  { name: 'Legal', icon: Shield, color: 'from-violet-500 to-purple-500', teamSize: 5, totalSigned: 59, avgTurnaround: '2.3h', completionRate: 91, weeklyTrend: [3, 5, 4, 6, 5, 7, 6], topPerformer: 'Emily Watson', topPerformerAvatar: 'EW' },
  { name: 'Engineering', icon: Zap, color: 'from-cyan-500 to-blue-500', teamSize: 7, totalSigned: 49, avgTurnaround: '1.15h', completionRate: 96, weeklyTrend: [6, 4, 7, 5, 8, 6, 7], topPerformer: 'Lisa Park', topPerformerAvatar: 'LP' },
  { name: 'Sales', icon: TrendingUp, color: 'from-rose-500 to-pink-500', teamSize: 9, totalSigned: 50, avgTurnaround: '2.4h', completionRate: 91, weeklyTrend: [3, 4, 5, 3, 6, 5, 4], topPerformer: 'John Martinez', topPerformerAvatar: 'JM' },
  { name: 'Marketing', icon: Sparkles, color: 'from-fuchsia-500 to-violet-500', teamSize: 4, totalSigned: 40, avgTurnaround: '2.55h', completionRate: 89, weeklyTrend: [2, 3, 4, 3, 5, 4, 3], topPerformer: 'Alex Rivera', topPerformerAvatar: 'AR' },
];

const departmentChartData = [
  { name: 'HR', created: 82, signed: 71, approved: 68, rejected: 3 },
  { name: 'Finance', created: 75, signed: 67, approved: 63, rejected: 4 },
  { name: 'Legal', created: 65, signed: 59, approved: 54, rejected: 5 },
  { name: 'Engineering', created: 55, signed: 49, approved: 47, rejected: 2 },
  { name: 'Sales', created: 58, signed: 50, approved: 45, rejected: 5 },
  { name: 'Marketing', created: 45, signed: 40, approved: 36, rejected: 4 },
];

const achievements = [
  { id: 'speed-demon', title: 'Speed Demon', description: 'Sign 10 documents in one day', icon: Zap, earned: true, earnedDate: 'Jan 15, 2025', gradient: 'from-amber-400 to-orange-500' },
  { id: 'perfectionist', title: 'Perfectionist', description: '100% approval rate for 30 days', icon: CheckCircle2, earned: true, earnedDate: 'Feb 2, 2025', gradient: 'from-emerald-400 to-teal-500' },
  { id: 'night-owl', title: 'Night Owl', description: 'Sign documents after 10 PM', icon: Moon, earned: true, earnedDate: 'Dec 28, 2024', gradient: 'from-indigo-400 to-purple-500' },
  { id: 'early-bird', title: 'Early Bird', description: 'Sign documents before 8 AM', icon: Sun, earned: true, earnedDate: 'Jan 8, 2025', gradient: 'from-yellow-400 to-amber-500' },
  { id: 'team-player', title: 'Team Player', description: 'Delegate 20 approvals', icon: Users, earned: true, earnedDate: 'Feb 10, 2025', gradient: 'from-sky-400 to-blue-500' },
  { id: 'streak-master', title: 'Streak Master', description: '30-day signing streak', icon: Flame, earned: true, earnedDate: 'Nov 20, 2024', gradient: 'from-red-400 to-rose-500' },
  { id: 'marathon-runner', title: 'Marathon Runner', description: 'Sign 500 total documents', icon: Trophy, earned: true, earnedDate: 'Oct 5, 2024', gradient: 'from-emerald-400 to-cyan-500' },
  { id: 'quick-responder', title: 'Quick Responder', description: 'Avg response under 1 hour', icon: Timer, earned: true, earnedDate: 'Jan 22, 2025', gradient: 'from-teal-400 to-emerald-500' },
  { id: 'mentor', title: 'Mentor', description: 'Help 10 new signers', icon: GraduationCap, earned: false, earnedDate: null, gradient: 'from-violet-400 to-purple-500', progress: 60 },
  { id: 'audit-champion', title: 'Audit Champion', description: 'Zero compliance issues', icon: Shield, earned: false, earnedDate: null, gradient: 'from-cyan-400 to-blue-500', progress: 80 },
  { id: 'innovation', title: 'Innovation Award', description: 'Use AI features 50 times', icon: Sparkles, earned: false, earnedDate: null, gradient: 'from-fuchsia-400 to-pink-500', progress: 40 },
  { id: 'anniversary', title: 'Anniversary', description: '1 year on platform', icon: Cake, earned: false, earnedDate: null, gradient: 'from-rose-400 to-red-500', progress: 90 },
];

const personalStats = {
  rank: 5,
  rankChange: 3,
  pointsThisMonth: 480,
  docsSigned: 31,
  docsPending: 4,
  avgResponseTime: '0.9h',
  streak: 22,
  nextAchievement: { name: 'Audit Champion', progress: 80, icon: Shield },
  totalPoints: 1980,
  percentile: 92,
};

// ============================================================
// Animation Variants
// ============================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const podiumVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  }),
};

// ============================================================
// Custom Recharts Tooltip
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
// Sparkline (inline mini bar chart)
// ============================================================

function Sparkline({ data, height = 32 }: { data: number[]; height?: number }) {
  const max = Math.max(...data);
  const barWidth = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      {data.map((val, i) => {
        const barHeight = (val / max) * (height - 4);
        return (
          <rect
            key={i}
            x={i * barWidth + 1}
            y={height - barHeight - 2}
            width={barWidth - 2}
            height={barHeight}
            rx={2}
            className="fill-emerald-400 dark:fill-emerald-500 opacity-70"
          />
        );
      })}
    </svg>
  );
}

// ============================================================
// Podium Card
// ============================================================

function PodiumCard({ member, rank }: { member: typeof teamMembers[0]; rank: number }) {
  const colors = {
    1: {
      border: 'border-amber-400 dark:border-amber-500',
      bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20',
      glow: 'shadow-amber-200/50 dark:shadow-amber-900/30',
      ring: 'ring-amber-400 dark:ring-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      label: '🥇',
    },
    2: {
      border: 'border-slate-300 dark:border-slate-500',
      bg: 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/20',
      glow: 'shadow-slate-200/50 dark:shadow-slate-800/30',
      ring: 'ring-slate-400 dark:ring-slate-500',
      text: 'text-slate-600 dark:text-slate-400',
      label: '🥈',
    },
    3: {
      border: 'border-orange-300 dark:border-orange-500',
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20',
      glow: 'shadow-orange-200/50 dark:shadow-orange-900/30',
      ring: 'ring-orange-400 dark:ring-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
      label: '🥉',
    },
  }[rank]!;

  return (
    <motion.div
      custom={rank}
      variants={podiumVariants}
      initial="hidden"
      animate="visible"
      className={`relative`}
    >
      <Card className={`border-2 ${colors.border} ${colors.bg} shadow-lg ${colors.glow} overflow-hidden`}>
        <CardContent className="p-5 text-center">
          {/* Crown for 1st */}
          {rank === 1 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Crown className="h-7 w-7 text-amber-500 drop-shadow-md" />
            </motion.div>
          )}

          {/* Avatar */}
          <div className="relative inline-block mb-3 mt-2">
            <Avatar className={`h-16 w-16 ring-3 ${colors.ring} mx-auto`}>
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold
              ${rank === 1 ? 'bg-amber-500 text-white' : rank === 2 ? 'bg-slate-400 text-white' : 'bg-orange-500 text-white'}`}>
              {rank}
            </div>
          </div>

          {/* Name & Info */}
          <h3 className="font-bold text-base">{member.name}</h3>
          <p className="text-xs text-muted-foreground">{member.department} · {member.role}</p>

          {/* Badge */}
          <Badge
            className={`mt-2 text-[10px] ${
              member.badge === 'Top Performer'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0'
            }`}
          >
            {member.badge === 'Top Performer' ? <Star className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
            {member.badge}
          </Badge>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div>
              <p className="text-lg font-bold">{member.docsSigned}</p>
              <p className="text-[10px] text-muted-foreground">Signed</p>
            </div>
            <div>
              <p className="text-lg font-bold">{member.approvalRate}%</p>
              <p className="text-[10px] text-muted-foreground">Approval</p>
            </div>
            <div>
              <p className="text-lg font-bold">{member.avgResponseTime}</p>
              <p className="text-[10px] text-muted-foreground">Avg Time</p>
            </div>
          </div>

          {/* Streak */}
          <div className="mt-3 flex items-center justify-center gap-1">
            <Flame className={`h-4 w-4 ${member.streak >= 10 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">{member.streak}-day streak</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Rank Change Indicator
// ============================================================

function RankChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
        <ArrowUp className="h-3 w-3" />{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-500 dark:text-red-400 text-xs font-semibold">
        <ArrowDown className="h-3 w-3" />{Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground text-xs">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

// ============================================================
// SortHeader Component (outside render)
// ============================================================

function SortHeader({ label, sortKeyValue, currentSortKey, currentSortDir, onSort, className = '' }: {
  label: string;
  sortKeyValue: string;
  currentSortKey: string;
  currentSortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  className?: string;
}) {
  return (
    <th
      className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none ${className}`}
      onClick={() => onSort(sortKeyValue)}
    >
      <div className="flex items-center gap-1">
        {label}
        {currentSortKey === sortKeyValue && (
          <span className="text-primary">{currentSortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );
}

// ============================================================
// Leaderboard Tab
// ============================================================

function LeaderboardTab() {
  const [sortKey, setSortKey] = useState<string>('points');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedMembers = useMemo(() => {
    const sorted = [...teamMembers].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a];
      const bVal = b[sortKey as keyof typeof b];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 2nd Place */}
        <div className="sm:order-1 sm:mt-6">
          <PodiumCard member={teamMembers[1]} rank={2} />
        </div>
        {/* 1st Place */}
        <div className="sm:order-2">
          <PodiumCard member={teamMembers[0]} rank={1} />
        </div>
        {/* 3rd Place */}
        <div className="sm:order-3 sm:mt-8">
          <PodiumCard member={teamMembers[2]} rank={3} />
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card className="border-border overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Medal className="h-4 w-4 text-primary" />
              Full Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-left w-12">Rank</th>
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-left">Member</th>
                    <SortHeader label="Department" sortKeyValue="department" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-left hidden md:table-cell" />
                    <SortHeader label="Signed" sortKeyValue="docsSigned" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-center" />
                    <SortHeader label="Approval" sortKeyValue="approvalRate" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-center hidden sm:table-cell" />
                    <SortHeader label="Avg Time" sortKeyValue="avgResponseTime" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-center hidden lg:table-cell" />
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-center hidden md:table-cell">Streak</th>
                    <SortHeader label="Points" sortKeyValue="points" currentSortKey={sortKey} currentSortDir={sortDir} onSort={handleSort} className="px-4 py-3 text-center" />
                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 text-center w-16">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.map((member, idx) => {
                    const isCurrentUser = member.id === 5;
                    const rank = idx + 1;
                    return (
                      <motion.tr
                        key={member.id}
                        variants={itemVariants}
                        className={`border-b border-border/50 transition-colors ${
                          isCurrentUser
                            ? 'bg-primary/8 dark:bg-primary/10 border-l-2 border-l-primary'
                            : 'hover:bg-accent/30'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold text-sm ${
                              rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-orange-500' : 'text-muted-foreground'
                            }`}>
                              #{rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate flex items-center gap-1.5">
                                {member.name}
                                {isCurrentUser && (
                                  <Badge className="text-[8px] h-4 px-1 bg-primary/20 text-primary border-0">You</Badge>
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="secondary" className="text-[10px]">{member.department}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold">{member.docsSigned}</span>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className={`text-sm font-semibold ${
                            member.approvalRate >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
                            member.approvalRate >= 90 ? 'text-teal-600 dark:text-teal-400' :
                            'text-amber-600 dark:text-amber-400'
                          }`}>
                            {member.approvalRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span className="text-sm">{member.avgResponseTime}</span>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            <Flame className={`h-3.5 w-3.5 ${member.streak >= 10 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                            <span className="text-sm">{member.streak}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold">{member.points.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RankChangeIndicator change={member.rankChange} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================================
// Departments Tab
// ============================================================

function DepartmentsTab() {
  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) => b.completionRate - a.completionRate);
  }, []);

  return (
    <div className="space-y-6">
      {/* Department Comparison Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {sortedDepartments.map((dept, idx) => {
          const Icon = dept.icon;
          return (
            <motion.div key={dept.name} variants={itemVariants}>
              <Card className="border-border overflow-hidden hover:shadow-lg transition-shadow relative">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${dept.color}`} />
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-lg bg-gradient-to-br ${dept.color} p-2 text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{dept.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{dept.teamSize} members</p>
                      </div>
                    </div>
                    <Badge
                      className={`text-[9px] border-0 ${
                        idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                        idx === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                        'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      #{idx + 1} Rank
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-lg font-bold">{dept.totalSigned}</p>
                      <p className="text-[10px] text-muted-foreground">Total Signed</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{dept.avgTurnaround}</p>
                      <p className="text-[10px] text-muted-foreground">Avg Time</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{dept.completionRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Completion</p>
                    </div>
                  </div>

                  {/* Completion Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground">Completion Rate</span>
                      <span className="text-[11px] font-semibold">{dept.completionRate}%</span>
                    </div>
                    <Progress value={dept.completionRate} className="h-1.5" />
                  </div>

                  {/* Weekly Trend Sparkline */}
                  <div className="mb-3">
                    <p className="text-[11px] text-muted-foreground mb-1">Weekly Trend</p>
                    <Sparkline data={dept.weeklyTrend} height={28} />
                  </div>

                  {/* Top Performer */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[9px] font-semibold bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        {dept.topPerformerAvatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">Top Performer</p>
                      <p className="text-xs font-medium truncate">{dept.topPerformer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Stacked Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart className="h-4 w-4 text-primary" style={{ display: 'inline' }} />
              Department Comparison
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Created, signed, approved, and rejected documents by department</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={departmentChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <RTooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
                <Bar dataKey="created" stackId="a" fill="#10b981" name="Created" radius={[0, 0, 0, 0]} />
                <Bar dataKey="signed" stackId="a" fill="#14b8a6" name="Signed" />
                <Bar dataKey="approved" stackId="a" fill="#06b6d4" name="Approved" />
                <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================================
// Achievements Tab
// ============================================================

function AchievementsTab() {
  const earnedCount = achievements.filter(a => a.earned).length;
  const totalPoints = achievements.filter(a => a.earned).reduce((sum, a) => {
    const pts: Record<string, number> = {
      'speed-demon': 100, 'perfectionist': 200, 'night-owl': 50, 'early-bird': 50,
      'team-player': 150, 'streak-master': 300, 'marathon-runner': 500, 'quick-responder': 150,
      'mentor': 200, 'audit-champion': 250, 'innovation': 100, 'anniversary': 75,
    };
    return sum + (pts[a.id] || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Achievement Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-border overflow-hidden bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-cyan-50/80 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/20">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white shadow-lg">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{earnedCount}/{achievements.length} Achievements Unlocked</h3>
                  <p className="text-sm text-muted-foreground">Keep going to unlock them all!</p>
                </div>
              </div>
              <div className="flex-1">
                <Progress value={(earnedCount / achievements.length) * 100} className="h-3 mb-1" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round((earnedCount / achievements.length) * 100)}% Complete</span>
                  <span>{achievements.length - earnedCount} remaining</span>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:ml-6">
                <div className="text-center">
                  <p className="text-2xl font-bold gradient-text-animated">{totalPoints.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Points</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center">
                  <p className="text-2xl font-bold">Top {100 - personalStats.percentile}%</p>
                  <p className="text-[10px] text-muted-foreground">Rank Percentile</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievement Badges Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        {achievements.map((achievement, idx) => {
          const Icon = achievement.icon;
          return (
            <motion.div
              key={achievement.id}
              custom={idx}
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`relative group cursor-pointer`}>
                      {/* Badge Circle */}
                      <div
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                          achievement.earned
                            ? `bg-gradient-to-br ${achievement.gradient} shadow-lg hover:shadow-xl hover:scale-105`
                            : 'bg-muted/50 grayscale opacity-50 hover:opacity-70'
                        }`}
                        style={
                          achievement.earned
                            ? { boxShadow: '0 0 20px rgba(16, 185, 129, 0.25), 0 0 40px rgba(20, 184, 166, 0.1)' }
                            : {}
                        }
                      >
                        <Icon className={`h-8 w-8 ${achievement.earned ? 'text-white' : 'text-muted-foreground'}`} />

                        {/* Earned checkmark */}
                        {achievement.earned && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + idx * 0.05, type: 'spring', stiffness: 500, damping: 15 }}
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white dark:border-card"
                          >
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <div className="text-center">
                      <p className="font-semibold text-xs">{achievement.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{achievement.description}</p>
                      {achievement.earned && achievement.earnedDate && (
                        <p className="text-[10px] text-emerald-500 mt-1">Earned: {achievement.earnedDate}</p>
                      )}
                      {!achievement.earned && achievement.progress !== undefined && (
                        <div className="mt-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Progress</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-1 mt-0.5" />
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Label */}
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium ${achievement.earned ? '' : 'text-muted-foreground'}`}>
                  {achievement.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {achievement.earned ? 'Unlocked' : 'Locked'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ============================================================
// Personal Stats Sidebar
// ============================================================

function PersonalStatsSidebar() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <Card className="border-border overflow-hidden sticky top-20">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-white/30">
              <AvatarFallback className="text-base font-bold bg-white/20 text-white">
                LP
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">Lisa Park</p>
              <p className="text-xs text-white/80">Engineering · Tech Lead</p>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Rank */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Rank</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold">#{personalStats.rank}</span>
              <RankChangeIndicator change={personalStats.rankChange} />
            </div>
          </div>

          <Separator />

          {/* Points This Month */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Points This Month</span>
            </div>
            <span className="text-lg font-bold">{personalStats.pointsThisMonth}</span>
          </div>

          <Separator />

          {/* Documents Signed / Pending */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/20">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{personalStats.docsSigned}</p>
              <p className="text-[10px] text-muted-foreground">Signed</p>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/20">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{personalStats.docsPending}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
          </div>

          {/* Avg Response Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium">Avg Response</span>
            </div>
            <span className="text-sm font-bold">{personalStats.avgResponseTime}</span>
          </div>

          <Separator />

          {/* Current Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Current Streak</span>
            </div>
            <span className="text-sm font-bold">{personalStats.streak} days 🔥</span>
          </div>

          <Separator />

          {/* Next Achievement */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Next Achievement</p>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 p-2 text-white">
                <personalStats.nextAchievement.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{personalStats.nextAchievement.name}</p>
                <Progress value={personalStats.nextAchievement.progress} className="h-1.5 mt-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">{personalStats.nextAchievement.progress}% complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Main Team Leaderboard Page
// ============================================================

export function TeamLeaderboardPage() {
  const [activeTab, setActiveTab] = useState('leaderboard');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Team Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Track team performance and signing achievements across your organization
        </p>
      </motion.div>

      {/* Main Layout: Content + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="leaderboard" className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Departments
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-1.5">
                <Medal className="h-3.5 w-3.5" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="mt-4">
              <LeaderboardTab />
            </TabsContent>

            <TabsContent value="departments" className="mt-4">
              <DepartmentsTab />
            </TabsContent>

            <TabsContent value="achievements" className="mt-4">
              <AchievementsTab />
            </TabsContent>
          </Tabs>
        </div>

        {/* Personal Stats Sidebar */}
        <div className="xl:col-span-1">
          <PersonalStatsSidebar />
        </div>
      </div>
    </div>
  );
}
