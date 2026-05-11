'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  AlertTriangle,
  ArrowRight,
  User,
  FileText,
  Eye,
  PenTool,
  Shield,
  Stamp,
  ChevronDown,
  Send,
  RotateCcw,
  Users,
  ArrowUpDown,
  Bell,
  Zap,
  TrendingUp,
  Timer,
  CheckCheck,
  Loader2,
  MessageSquare,
  Paperclip,
  Calendar,
  ChevronRight,
  X,
  ThumbsUp,
  ThumbsDown,
  Share2,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================
// Types
// ============================================================

type StepType = 'review' | 'sign' | 'approve' | 'finalize';
type StepStatus = 'completed' | 'current' | 'pending' | 'rejected' | 'delegated';

interface ApprovalStep {
  id: string;
  type: StepType;
  status: StepStatus;
  approverName: string;
  approverRole: string;
  approverAvatar: string;
  completedAt?: string;
  comment?: string;
  attachment?: string;
  delegatedTo?: string;
  delegatedReason?: string;
  startedAt?: string;
}

interface ApprovalChain {
  id: string;
  documentName: string;
  documentType: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  steps: ApprovalStep[];
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
  isParallel: boolean;
}

type FilterStatus = 'all' | 'pending' | 'in-progress' | 'completed' | 'rejected';
type SortOption = 'priority' | 'date' | 'progress';

// ============================================================
// Mock Data
// ============================================================

const MOCK_CHAINS: ApprovalChain[] = [
  {
    id: 'chain-1',
    documentName: 'Master Services Agreement - Acme Corp',
    documentType: 'Contract',
    priority: 'urgent',
    steps: [
      { id: 's1-1', type: 'review', status: 'completed', approverName: 'Sarah Chen', approverRole: 'Legal Review', approverAvatar: 'SC', completedAt: '2025-07-08 09:30', comment: 'Contract terms look good. Minor clause 4.2 updated.' },
      { id: 's1-2', type: 'sign', status: 'completed', approverName: 'David Park', approverRole: 'VP Sales', approverAvatar: 'DP', completedAt: '2025-07-08 14:15', comment: 'Signed with approval.' },
      { id: 's1-3', type: 'approve', status: 'current', approverName: 'Maria Lopez', approverRole: 'CFO', approverAvatar: 'ML', startedAt: '2025-07-08 15:00' },
      { id: 's1-4', type: 'finalize', status: 'pending', approverName: 'James Wilson', approverRole: 'CEO', approverAvatar: 'JW' },
    ],
    createdAt: '2025-07-07 10:00',
    updatedAt: '2025-07-08 15:00',
    estimatedCompletion: '2025-07-09 18:00',
    isParallel: false,
  },
  {
    id: 'chain-2',
    documentName: 'Non-Disclosure Agreement - TechStart Inc',
    documentType: 'NDA',
    priority: 'high',
    steps: [
      { id: 's2-1', type: 'review', status: 'completed', approverName: 'Anna Schmidt', approverRole: 'Legal Counsel', approverAvatar: 'AS', completedAt: '2025-07-09 08:00', comment: 'Standard NDA, no concerns.' },
      { id: 's2-2', type: 'sign', status: 'current', approverName: 'Robert Kim', approverRole: 'CTO', approverAvatar: 'RK', startedAt: '2025-07-09 09:30' },
      { id: 's2-3', type: 'finalize', status: 'pending', approverName: 'Emily Davis', approverRole: 'COO', approverAvatar: 'ED' },
    ],
    createdAt: '2025-07-08 16:00',
    updatedAt: '2025-07-09 09:30',
    estimatedCompletion: '2025-07-10 12:00',
    isParallel: false,
  },
  {
    id: 'chain-3',
    documentName: 'Employment Offer - Senior Developer',
    documentType: 'Employment',
    priority: 'normal',
    steps: [
      { id: 's3-1', type: 'review', status: 'completed', approverName: 'Lisa Wang', approverRole: 'HR Director', approverAvatar: 'LW', completedAt: '2025-07-07 11:00' },
      { id: 's3-2', type: 'approve', status: 'completed', approverName: 'Tom Harris', approverRole: 'Engineering Lead', approverAvatar: 'TH', completedAt: '2025-07-07 14:30', comment: 'Salary band approved. Remote work policy attached.', attachment: 'remote-policy.pdf' },
      { id: 's3-3', type: 'sign', status: 'completed', approverName: 'Karen White', approverRole: 'VP People', approverAvatar: 'KW', completedAt: '2025-07-07 16:00' },
      { id: 's3-4', type: 'finalize', status: 'completed', approverName: 'Michael Brown', approverRole: 'CEO', approverAvatar: 'MB', completedAt: '2025-07-07 17:30', comment: 'Welcome aboard!' },
    ],
    createdAt: '2025-07-07 09:00',
    updatedAt: '2025-07-07 17:30',
    isParallel: false,
  },
  {
    id: 'chain-4',
    documentName: 'Partnership Agreement - GlobalNet',
    documentType: 'Contract',
    priority: 'high',
    steps: [
      { id: 's4-1', type: 'review', status: 'completed', approverName: 'Sarah Chen', approverRole: 'Legal Review', approverAvatar: 'SC', completedAt: '2025-07-06 10:00' },
      { id: 's4-2', type: 'approve', status: 'rejected', approverName: 'Maria Lopez', approverRole: 'CFO', approverAvatar: 'ML', completedAt: '2025-07-06 15:00', comment: 'Revenue share terms are unfavorable. Need renegotiation on clause 7.3.' },
      { id: 's4-3', type: 'sign', status: 'pending', approverName: 'James Wilson', approverRole: 'CEO', approverAvatar: 'JW' },
      { id: 's4-4', type: 'finalize', status: 'pending', approverName: 'Anna Schmidt', approverRole: 'Legal Counsel', approverAvatar: 'AS' },
    ],
    createdAt: '2025-07-05 14:00',
    updatedAt: '2025-07-06 15:00',
    isParallel: false,
  },
  {
    id: 'chain-5',
    documentName: 'Software License - CloudSync Pro',
    documentType: 'License',
    priority: 'normal',
    steps: [
      { id: 's5-1', type: 'review', status: 'completed', approverName: 'David Park', approverRole: 'IT Director', approverAvatar: 'DP', completedAt: '2025-07-09 10:00' },
      { id: 's5-2', type: 'sign', status: 'current', approverName: 'Robert Kim', approverRole: 'CTO', approverAvatar: 'RK', startedAt: '2025-07-09 11:00', delegatedTo: 'Anna Schmidt', delegatedReason: 'Out of office - delegated to Legal Counsel for technical review' },
      { id: 's5-3', type: 'finalize', status: 'pending', approverName: 'Karen White', approverRole: 'VP People', approverAvatar: 'KW' },
    ],
    createdAt: '2025-07-08 09:00',
    updatedAt: '2025-07-09 11:00',
    estimatedCompletion: '2025-07-10 17:00',
    isParallel: true,
  },
  {
    id: 'chain-6',
    documentName: 'Vendor Agreement - DataPipe Solutions',
    documentType: 'Contract',
    priority: 'low',
    steps: [
      { id: 's6-1', type: 'review', status: 'completed', approverName: 'Lisa Wang', approverRole: 'Procurement', approverAvatar: 'LW', completedAt: '2025-07-05 09:00' },
      { id: 's6-2', type: 'approve', status: 'completed', approverName: 'Tom Harris', approverRole: 'Engineering Lead', approverAvatar: 'TH', completedAt: '2025-07-05 12:00' },
      { id: 's6-3', type: 'sign', status: 'completed', approverName: 'Michael Brown', approverRole: 'CEO', approverAvatar: 'MB', completedAt: '2025-07-05 15:00' },
      { id: 's6-4', type: 'finalize', status: 'completed', approverName: 'Emily Davis', approverRole: 'COO', approverAvatar: 'ED', completedAt: '2025-07-05 16:30' },
    ],
    createdAt: '2025-07-04 14:00',
    updatedAt: '2025-07-05 16:30',
    isParallel: false,
  },
  {
    id: 'chain-7',
    documentName: 'Lease Agreement - 350 5th Ave Office',
    documentType: 'Lease',
    priority: 'urgent',
    steps: [
      { id: 's7-1', type: 'review', status: 'completed', approverName: 'Anna Schmidt', approverRole: 'Legal Counsel', approverAvatar: 'AS', completedAt: '2025-07-09 08:00', comment: 'Lease terms standard. Security deposit clause reviewed.' },
      { id: 's7-2', type: 'approve', status: 'current', approverName: 'Maria Lopez', approverRole: 'CFO', approverAvatar: 'ML', startedAt: '2025-07-09 09:00' },
      { id: 's7-3', type: 'sign', status: 'pending', approverName: 'James Wilson', approverRole: 'CEO', approverAvatar: 'JW' },
      { id: 's7-4', type: 'approve', status: 'pending', approverName: 'Karen White', approverRole: 'VP People', approverAvatar: 'KW' },
      { id: 's7-5', type: 'finalize', status: 'pending', approverName: 'Emily Davis', approverRole: 'COO', approverAvatar: 'ED' },
    ],
    createdAt: '2025-07-08 14:00',
    updatedAt: '2025-07-09 09:00',
    estimatedCompletion: '2025-07-11 12:00',
    isParallel: false,
  },
  {
    id: 'chain-8',
    documentName: 'Consulting Agreement - StrategyBoost',
    documentType: 'Contract',
    priority: 'normal',
    steps: [
      { id: 's8-1', type: 'review', status: 'completed', approverName: 'Sarah Chen', approverRole: 'Legal Review', approverAvatar: 'SC', completedAt: '2025-07-08 10:00' },
      { id: 's8-2', type: 'approve', status: 'completed', approverName: 'Tom Harris', approverRole: 'Dept Manager', approverAvatar: 'TH', completedAt: '2025-07-08 14:00', comment: 'Budget approved within Q3 allocation.' },
      { id: 's8-3', type: 'sign', status: 'current', approverName: 'Robert Kim', approverRole: 'CTO', approverAvatar: 'RK', startedAt: '2025-07-08 15:00' },
    ],
    createdAt: '2025-07-07 16:00',
    updatedAt: '2025-07-08 15:00',
    estimatedCompletion: '2025-07-10 10:00',
    isParallel: true,
  },
  {
    id: 'chain-9',
    documentName: 'IP Assignment - Project Phoenix',
    documentType: 'NDA',
    priority: 'high',
    steps: [
      { id: 's9-1', type: 'review', status: 'completed', approverName: 'Lisa Wang', approverRole: 'IP Counsel', approverAvatar: 'LW', completedAt: '2025-07-09 07:30' },
      { id: 's9-2', type: 'approve', status: 'current', approverName: 'David Park', approverRole: 'VP Engineering', approverAvatar: 'DP', startedAt: '2025-07-09 08:00' },
    ],
    createdAt: '2025-07-09 06:00',
    updatedAt: '2025-07-09 08:00',
    estimatedCompletion: '2025-07-09 18:00',
    isParallel: false,
  },
  {
    id: 'chain-10',
    documentName: 'Non-Compete Agreement - Key Executive',
    documentType: 'Employment',
    priority: 'urgent',
    steps: [
      { id: 's10-1', type: 'review', status: 'completed', approverName: 'Anna Schmidt', approverRole: 'Legal Counsel', approverAvatar: 'AS', completedAt: '2025-07-06 09:00', comment: 'Non-compete scope narrowed to 12 months, 50-mile radius.' },
      { id: 's10-2', type: 'approve', status: 'rejected', approverName: 'Michael Brown', approverRole: 'CEO', approverAvatar: 'MB', completedAt: '2025-07-06 11:00', comment: 'Restrictions too aggressive for C-level. Please revise.' },
      { id: 's10-3', type: 'review', status: 'current', approverName: 'Sarah Chen', approverRole: 'Legal Review', approverAvatar: 'SC', startedAt: '2025-07-06 14:00', comment: 'Revising non-compete terms per CEO feedback.' },
      { id: 's10-4', type: 'sign', status: 'pending', approverName: 'James Wilson', approverRole: 'CEO', approverAvatar: 'JW' },
      { id: 's10-5', type: 'finalize', status: 'pending', approverName: 'Emily Davis', approverRole: 'COO', approverAvatar: 'ED' },
      { id: 's10-6', type: 'finalize', status: 'pending', approverName: 'Karen White', approverRole: 'VP People', approverAvatar: 'KW' },
    ],
    createdAt: '2025-07-05 10:00',
    updatedAt: '2025-07-06 14:00',
    isParallel: false,
  },
];

// ============================================================
// Helper Functions
// ============================================================

function getChainOverallStatus(chain: ApprovalChain): FilterStatus {
  const hasRejected = chain.steps.some(s => s.status === 'rejected');
  if (hasRejected) return 'rejected';
  const allCompleted = chain.steps.every(s => s.status === 'completed');
  if (allCompleted) return 'completed';
  const hasCurrent = chain.steps.some(s => s.status === 'current');
  if (hasCurrent) return 'in-progress';
  return 'pending';
}

function getChainProgress(chain: ApprovalChain): number {
  const completed = chain.steps.filter(s => s.status === 'completed').length;
  return Math.round((completed / chain.steps.length) * 100);
}

const STEP_TYPE_ICONS: Record<StepType, typeof Eye> = {
  review: Eye,
  sign: PenTool,
  approve: Shield,
  finalize: Stamp,
};

function getStepTypeLabel(type: StepType) {
  switch (type) {
    case 'review': return 'Review';
    case 'sign': return 'Sign';
    case 'approve': return 'Approve';
    case 'finalize': return 'Finalize';
  }
}

function getDocTypeColor(type: string) {
  switch (type) {
    case 'NDA': return 'from-purple-500 to-violet-600';
    case 'Contract': return 'from-teal-500 to-cyan-600';
    case 'Employment': return 'from-pink-500 to-rose-600';
    case 'License': return 'from-amber-500 to-orange-600';
    case 'Lease': return 'from-emerald-500 to-green-600';
    default: return 'from-slate-500 to-gray-600';
  }
}

function getDocTypeBadgeVariant(type: string): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'NDA': return 'secondary';
    case 'Contract': return 'default';
    default: return 'outline';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return 'text-red-500';
    case 'high': return 'text-amber-500';
    case 'normal': return 'text-emerald-500';
    case 'low': return 'text-slate-400';
    default: return 'text-slate-400';
  }
}

function getPriorityBg(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-red-500/10 border-red-500/20';
    case 'high': return 'bg-amber-500/10 border-amber-500/20';
    case 'normal': return 'bg-emerald-500/10 border-emerald-500/20';
    case 'low': return 'bg-slate-500/10 border-slate-500/20';
    default: return 'bg-slate-500/10 border-slate-500/20';
  }
}

// ============================================================
// Step Node Component
// ============================================================

function StepNode({ step, index, totalSteps, isLast }: {
  step: ApprovalStep;
  index: number;
  totalSteps: number;
  isLast: boolean;
}) {
  const StepIcon = STEP_TYPE_ICONS[step.type];

  return (
    <div className="flex items-start gap-0 group">
      {/* Node */}
      <div className="flex flex-col items-center">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                {/* Completed step */}
                {step.status === 'completed' && (
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 border-2 border-background flex items-center justify-center">
                      <StepIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                )}

                {/* Current step */}
                {step.status === 'current' && (
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-400/30 ring-offset-2 ring-offset-background">
                      <StepIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                )}

                {/* Pending step */}
                {step.status === 'pending' && (
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/40" />
                    </div>
                  </div>
                )}

                {/* Rejected step */}
                {step.status === 'rejected' && (
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 ring-2 ring-red-500/20">
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 border-2 border-background flex items-center justify-center">
                      <StepIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                )}

                {/* Delegated step */}
                {step.status === 'delegated' && (
                  <div className="relative">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-2 ring-amber-500/20">
                      <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-600 border-2 border-background flex items-center justify-center">
                      <StepIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="font-semibold">{getStepTypeLabel(step.type)}</p>
              <p className="text-xs text-muted-foreground">{step.approverName} · {step.approverRole}</p>
              <p className="text-xs capitalize mt-1">{step.status}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Approver info below node */}
        <div className="mt-1.5 text-center max-w-[72px] sm:max-w-[96px]">
          <p className="text-[9px] sm:text-[11px] font-medium text-foreground truncate">{step.approverName}</p>
          <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">{step.approverRole}</p>
        </div>
      </div>

      {/* Connection line */}
      {!isLast && (
        <div className="flex-1 flex items-center mt-1 min-w-[20px] sm:min-w-[40px]">
          {step.status === 'completed' && (
            <div className="w-full h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
          )}
          {step.status === 'current' && (
            <div className="w-full h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-muted-foreground/20 rounded-full gradient-flow-line" />
          )}
          {(step.status === 'pending') && (
            <div className="w-full h-0.5 border-t-2 border-dashed border-muted-foreground/20" />
          )}
          {step.status === 'rejected' && (
            <div className="w-full h-0.5 bg-gradient-to-r from-red-500 to-red-400 rounded-full" />
          )}
          {step.status === 'delegated' && (
            <div className="w-full h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Statistics Bar
// ============================================================

function StatisticsBar({ chains }: { chains: ApprovalChain[] }) {
  const totalActive = chains.filter(c => {
    const status = getChainOverallStatus(c);
    return status === 'in-progress' || status === 'pending';
  }).length;

  const awaitingMyAction = chains.filter(c =>
    c.steps.some(s => s.status === 'current')
  ).length;

  const completedThisWeek = chains.filter(c => getChainOverallStatus(c) === 'completed').length;

  const avgCompletionTime = '2.4 days';

  const stats = [
    {
      label: 'Active Chains',
      value: totalActive,
      icon: GitMerge,
      color: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'Awaiting Action',
      value: awaitingMyAction,
      icon: Zap,
      color: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-500/10',
      urgent: true,
    },
    {
      label: 'Completed This Week',
      value: completedThisWeek,
      icon: CheckCheck,
      color: 'from-cyan-500 to-blue-600',
      iconBg: 'bg-cyan-500/10',
    },
    {
      label: 'Avg Completion',
      value: avgCompletionTime,
      icon: Timer,
      color: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-500/10',
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card className={cn(
            'relative overflow-hidden border-0 glass-card card-shadow-premium',
            stat.urgent && 'ring-1 ring-amber-500/30'
          )}>
            <div className={cn(
              'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
              stat.color
            )} />
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold mt-0.5">
                    {stat.isText ? stat.value : stat.value}
                    {stat.urgent && stat.value > 0 && (
                      <Badge className="ml-2 bg-red-500/10 text-red-500 border-red-500/20 text-[9px] px-1.5 py-0 h-4">
                        Urgent
                      </Badge>
                    )}
                  </p>
                </div>
                <div className={cn('p-2 rounded-xl', stat.iconBg)}>
                  <stat.icon className={cn('w-4 h-4 sm:w-5 sm:h-5', 'text-foreground/60')} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// Chain Card Component
// ============================================================

function ChainCard({ chain, onClick, index }: {
  chain: ApprovalChain;
  onClick: () => void;
  index: number;
}) {
  const overallStatus = getChainOverallStatus(chain);
  const progress = getChainProgress(chain);
  const currentStep = chain.steps.find(s => s.status === 'current');
  const rejectedStep = chain.steps.find(s => s.status === 'rejected');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card
        className="cursor-pointer border border-border/50 hover:border-emerald-500/30 card-shadow-premium hover:shadow-xl transition-all duration-300 overflow-hidden group"
        onClick={onClick}
      >
        {/* Gradient top border by doc type */}
        <div className={cn('h-1 bg-gradient-to-r', getDocTypeColor(chain.documentType))} />

        <CardContent className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base truncate max-w-[260px] sm:max-w-none">
                  {chain.documentName}
                </h3>
                <Badge
                  variant={getDocTypeBadgeVariant(chain.documentType)}
                  className={cn(
                    'text-[9px] px-1.5 py-0 h-4 shrink-0 border-0',
                    chain.documentType === 'NDA' && 'bg-purple-500/10 text-purple-500',
                    chain.documentType === 'Contract' && 'bg-teal-500/10 text-teal-500',
                    chain.documentType === 'Employment' && 'bg-pink-500/10 text-pink-500',
                    chain.documentType === 'License' && 'bg-amber-500/10 text-amber-500',
                    chain.documentType === 'Lease' && 'bg-emerald-500/10 text-emerald-500',
                  )}
                >
                  {chain.documentType}
                </Badge>
                <Badge className={cn('text-[9px] px-1.5 py-0 h-4 border shrink-0', getPriorityBg(chain.priority))}>
                  <span className={getPriorityColor(chain.priority)}>{chain.priority}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Created {chain.createdAt}
                </span>
                {chain.isParallel && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 gap-0.5">
                    <Users className="w-2.5 h-2.5" />
                    Parallel
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className={cn(
                  'text-lg font-bold',
                  overallStatus === 'completed' && 'text-emerald-500',
                  overallStatus === 'in-progress' && 'text-amber-500',
                  overallStatus === 'rejected' && 'text-red-500',
                  overallStatus === 'pending' && 'text-muted-foreground',
                )}>
                  {progress}%
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <Progress value={progress} className="h-1.5 bg-muted" />
          </div>

          {/* Step progress visualization */}
          <div className="flex items-start overflow-x-auto pb-1 scrollbar-none">
            {chain.steps.map((step, i) => (
              <StepNode
                key={step.id}
                step={step}
                index={i}
                totalSteps={chain.steps.length}
                isLast={i === chain.steps.length - 1}
              />
            ))}
          </div>

          {/* Current step info */}
          {currentStep && (
            <div className="mt-3 flex items-center gap-2 text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Awaiting {getStepTypeLabel(currentStep.type)} from {currentStep.approverName}
              </span>
              {chain.estimatedCompletion && (
                <span className="text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Est. {chain.estimatedCompletion}
                </span>
              )}
            </div>
          )}

          {/* Rejected step info */}
          {rejectedStep && !currentStep && (
            <div className="mt-3 flex items-center gap-2 text-xs bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-red-600 dark:text-red-400 font-medium truncate">
                Rejected by {rejectedStep.approverName}: {rejectedStep.comment || 'No reason provided'}
              </span>
            </div>
          )}

          {/* Delegated step info */}
          {chain.steps.some(s => s.status === 'current' && s.delegatedTo) && (
            <div className="mt-2 flex items-center gap-2 text-xs bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
              <Share2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-amber-600 dark:text-amber-400 font-medium truncate">
                Delegated to {chain.steps.find(s => s.delegatedTo)?.delegatedTo}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// Chain Detail Dialog
// ============================================================

function ChainDetailDialog({ chain, open, onClose }: {
  chain: ApprovalChain | null;
  open: boolean;
  onClose: () => void;
}) {
  const [activeActionStep, setActiveActionStep] = useState<string | null>(null);

  if (!chain) return null;

  const overallStatus = getChainOverallStatus(chain);
  const progress = getChainProgress(chain);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        {/* Gradient header */}
        <div className={cn('h-2 bg-gradient-to-r', getDocTypeColor(chain.documentType))} />
        <DialogHeader className="px-6 pt-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold truncate">{chain.documentName}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={cn(
                  'text-[9px] px-1.5 py-0 h-4 border-0',
                  chain.documentType === 'NDA' && 'bg-purple-500/10 text-purple-500',
                  chain.documentType === 'Contract' && 'bg-teal-500/10 text-teal-500',
                  chain.documentType === 'Employment' && 'bg-pink-500/10 text-pink-500',
                  chain.documentType === 'License' && 'bg-amber-500/10 text-amber-500',
                  chain.documentType === 'Lease' && 'bg-emerald-500/10 text-emerald-500',
                )}>
                  {chain.documentType}
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                  {chain.isParallel ? 'Parallel' : 'Sequential'}
                </Badge>
                <Badge className={cn('text-[9px] px-1.5 py-0 h-4 border', getPriorityBg(chain.priority))}>
                  <span className={getPriorityColor(chain.priority)}>{chain.priority}</span>
                </Badge>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={cn(
                'text-2xl font-bold',
                overallStatus === 'completed' && 'text-emerald-500',
                overallStatus === 'in-progress' && 'text-amber-500',
                overallStatus === 'rejected' && 'text-red-500',
                overallStatus === 'pending' && 'text-muted-foreground',
              )}>
                {progress}%
              </span>
              <p className="text-[10px] text-muted-foreground">Complete</p>
            </div>
          </div>
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6 pb-6">
          {/* Timeline */}
          <div className="space-y-0 mt-2">
            {chain.steps.map((step, i) => {
              const StepIcon = STEP_TYPE_ICONS[step.type];
              const isCurrent = step.status === 'current';

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex gap-4">
                    {/* Timeline line + node */}
                    <div className="flex flex-col items-center">
                      {/* Node */}
                      <div className="relative z-10">
                        {step.status === 'completed' && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        )}
                        {isCurrent && (
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/20">
                              <StepIcon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                        {step.status === 'pending' && (
                          <div className="w-10 h-10 rounded-full bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-muted-foreground/30" />
                          </div>
                        )}
                        {step.status === 'rejected' && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                            <XCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                        {step.status === 'delegated' && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Share2 className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Vertical connector */}
                      {i < chain.steps.length - 1 && (
                        <div className={cn(
                          'w-0.5 flex-1 min-h-[24px]',
                          step.status === 'completed' ? 'bg-emerald-500' :
                          step.status === 'rejected' ? 'bg-red-500' :
                          step.status === 'delegated' ? 'bg-amber-500' :
                          isCurrent ? 'bg-gradient-to-b from-emerald-500 to-muted-foreground/20' :
                          'bg-muted-foreground/10'
                        )} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-5">
                      <div className={cn(
                        'rounded-xl p-4 border transition-all',
                        isCurrent ? 'bg-emerald-500/5 border-emerald-500/20' :
                        step.status === 'rejected' ? 'bg-red-500/5 border-red-500/10' :
                        'bg-muted/30 border-border/50'
                      )}>
                        {/* Step header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className={cn(
                                'text-[10px] font-bold',
                                step.status === 'completed' && 'bg-emerald-500/10 text-emerald-600',
                                step.status === 'rejected' && 'bg-red-500/10 text-red-600',
                                isCurrent && 'bg-emerald-500/10 text-emerald-600',
                                step.status === 'pending' && 'bg-muted text-muted-foreground',
                                step.status === 'delegated' && 'bg-amber-500/10 text-amber-600',
                              )}>
                                {step.approverAvatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">{step.approverName}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {getStepTypeLabel(step.type)} · {step.approverRole}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn(
                            'text-[9px] px-2 py-0.5 h-5 border-0',
                            step.status === 'completed' && 'bg-emerald-500/10 text-emerald-600',
                            step.status === 'rejected' && 'bg-red-500/10 text-red-600',
                            isCurrent && 'bg-amber-500/10 text-amber-600',
                            step.status === 'pending' && 'bg-muted text-muted-foreground',
                            step.status === 'delegated' && 'bg-amber-500/10 text-amber-600',
                          )}>
                            {step.status === 'completed' && '✓ Completed'}
                            {step.status === 'current' && '● In Progress'}
                            {step.status === 'pending' && '○ Pending'}
                            {step.status === 'rejected' && '✕ Rejected'}
                            {step.status === 'delegated' && '↗ Delegated'}
                          </Badge>
                        </div>

                        {/* Timestamps */}
                        {(step.completedAt || step.startedAt) && (
                          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                            {step.startedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Started: {step.startedAt}
                              </span>
                            )}
                            {step.completedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed: {step.completedAt}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Comment */}
                        {step.comment && (
                          <div className="mt-2 flex items-start gap-2 text-xs">
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-muted-foreground">{step.comment}</p>
                          </div>
                        )}

                        {/* Attachment */}
                        {step.attachment && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-primary hover:underline cursor-pointer">{step.attachment}</span>
                          </div>
                        )}

                        {/* Delegation info */}
                        {step.delegatedTo && (
                          <div className="mt-2 flex items-start gap-2 text-xs bg-amber-500/5 rounded-lg p-2">
                            <Share2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-amber-600 dark:text-amber-400 font-medium">Delegated to {step.delegatedTo}</p>
                              {step.delegatedReason && (
                                <p className="text-muted-foreground mt-0.5">{step.delegatedReason}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action buttons for current step */}
                        {isCurrent && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            {activeActionStep === step.id ? (
                              <div className="flex items-center gap-2">
                                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white h-8 text-xs">
                                  <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 text-xs">
                                  <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                                  Reject
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 text-xs">
                                  <Share2 className="w-3.5 h-3.5 mr-1" />
                                  Delegate
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 text-xs ml-auto" onClick={() => setActiveActionStep(null)}>
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white h-8 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionStep(step.id);
                                }}
                              >
                                Take Action
                                <ArrowRight className="w-3.5 h-3.5 ml-1" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* History */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Action History
            </h4>
            <div className="space-y-2">
              {chain.steps
                .filter(s => s.completedAt)
                .map((step) => (
                  <div key={step.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    )}
                    <span className="font-medium text-foreground">{step.approverName}</span>
                    <span>{step.status === 'completed' ? 'approved' : 'rejected'}</span>
                    <span className="capitalize">{getStepTypeLabel(step.type)}</span>
                    <span className="ml-auto">{step.completedAt}</span>
                  </div>
                ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Main Approval Chains Page
// ============================================================

export function ApprovalChainsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('priority');
  const [showDelegated, setShowDelegated] = useState(false);
  const [selectedChain, setSelectedChain] = useState<ApprovalChain | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredChains = useMemo(() => {
    let chains = [...MOCK_CHAINS];

    // Filter by delegated
    if (showDelegated) {
      chains = chains.filter(c => c.steps.some(s => s.delegatedTo));
    }

    // Filter by status
    if (filterStatus !== 'all') {
      chains = chains.filter(c => getChainOverallStatus(c) === filterStatus);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      chains = chains.filter(c =>
        c.documentName.toLowerCase().includes(q) ||
        c.documentType.toLowerCase().includes(q)
      );
    }

    // Sort
    chains.sort((a, b) => {
      if (sortOption === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortOption === 'date') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortOption === 'progress') {
        return getChainProgress(b) - getChainProgress(a);
      }
      return 0;
    });

    return chains;
  }, [filterStatus, searchQuery, sortOption, showDelegated]);

  const filterButtons: { value: FilterStatus; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: MOCK_CHAINS.length },
    { value: 'pending', label: 'Pending', count: MOCK_CHAINS.filter(c => getChainOverallStatus(c) === 'pending').length },
    { value: 'in-progress', label: 'In Progress', count: MOCK_CHAINS.filter(c => getChainOverallStatus(c) === 'in-progress').length },
    { value: 'completed', label: 'Completed', count: MOCK_CHAINS.filter(c => getChainOverallStatus(c) === 'completed').length },
    { value: 'rejected', label: 'Rejected', count: MOCK_CHAINS.filter(c => getChainOverallStatus(c) === 'rejected').length },
  ];

  const handleCardClick = (chain: ApprovalChain) => {
    setSelectedChain(chain);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <GitMerge className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Approval Chains</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Track and manage document approval workflows</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Statistics Bar */}
      <StatisticsBar chains={MOCK_CHAINS} />

      {/* Filters and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="space-y-3"
      >
        {/* Search and Quick Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by document name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1.5"
              onClick={() => {
                // Simulate remind all
              }}
            >
              <Bell className="w-3.5 h-3.5" />
              Remind All
            </Button>

            <Button
              variant={showDelegated ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-9 text-xs gap-1.5',
                showDelegated && 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0'
              )}
              onClick={() => setShowDelegated(!showDelegated)}
            >
              <Share2 className="w-3.5 h-3.5" />
              Delegated
            </Button>

            <div className="flex items-center gap-1">
              {(['priority', 'date', 'progress'] as SortOption[]).map((opt) => (
                <Button
                  key={opt}
                  variant={sortOption === opt ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-9 text-xs capitalize',
                    sortOption === opt && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  )}
                  onClick={() => setSortOption(opt)}
                >
                  <ArrowUpDown className="w-3 h-3 mr-1" />
                  {opt}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterButtons.map((fb) => (
            <Button
              key={fb.value}
              variant={filterStatus === fb.value ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 text-xs gap-1.5',
                filterStatus === fb.value && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0'
              )}
              onClick={() => setFilterStatus(fb.value)}
            >
              {fb.label}
              <Badge className={cn(
                'h-4 min-w-4 px-1 text-[9px]',
                filterStatus === fb.value
                  ? 'bg-white/20 text-white'
                  : 'bg-muted text-muted-foreground'
              )}>
                {fb.count}
              </Badge>
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Chain Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredChains.length > 0 ? (
            filteredChains.map((chain, i) => (
              <ChainCard
                key={chain.id}
                chain={chain}
                onClick={() => handleCardClick(chain)}
                index={i}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full"
            >
              <Card className="border-dashed">
                <CardContent className="py-16 flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <GitMerge className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="font-semibold text-muted-foreground">No approval chains found</h3>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Try adjusting your filters or search query
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chain Detail Dialog */}
      <ChainDetailDialog
        chain={selectedChain}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedChain(null);
        }}
      />
    </div>
  );
}
