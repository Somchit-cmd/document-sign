'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer, AlertTriangle, CheckCircle2, Clock, FileText, Search, Bell, RefreshCw, Calendar,
  Download, Send, Settings2, ArrowRight, AlertCircle, ExternalLink, History, Plus,
  Grid3X3, List, X, Shield, Building2, FileCheck, FileSignature, Scale, Truck,
  ChevronDown, Eye, Mail
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ExpiryStatus = 'active' | 'expiring-soon' | 'expired' | 'renewed';
type DocumentCategory = 'Contracts' | 'NDAs' | 'Agreements' | 'Licenses' | 'Leases' | 'Policies';
type RenewalType = 'extend' | 'new-version' | 'replace';
type ViewMode = 'grid' | 'list';
type SortOption = 'expiry-date' | 'document-name' | 'priority' | 'days-remaining';

interface ExpiryDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  status: ExpiryStatus;
  expiryDate: Date;
  owner: string;
  ownerInitials: string;
  department: string;
  autoRenew: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  daysRemaining: number;
  totalDays: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const now = new Date();

const mockDocuments: ExpiryDocument[] = [
  // 3 Expired (1-30 days ago)
  {
    id: 'DOC-001',
    title: 'Master Service Agreement - TechCorp',
    category: 'Contracts',
    status: 'expired',
    expiryDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    department: 'Legal',
    autoRenew: false,
    priority: 'critical',
    daysRemaining: -2,
    totalDays: 365,
  },
  {
    id: 'DOC-002',
    title: 'Non-Disclosure Agreement - DataFlow Inc',
    category: 'NDAs',
    status: 'expired',
    expiryDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    owner: 'Michael Ross',
    ownerInitials: 'MR',
    department: 'Business Dev',
    autoRenew: false,
    priority: 'high',
    daysRemaining: -15,
    totalDays: 180,
  },
  {
    id: 'DOC-003',
    title: 'Software License - Adobe Creative Cloud',
    category: 'Licenses',
    status: 'expired',
    expiryDate: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000),
    owner: 'Emily Park',
    ownerInitials: 'EP',
    department: 'IT',
    autoRenew: true,
    priority: 'medium',
    daysRemaining: -27,
    totalDays: 365,
  },
  // 4 Expiring within 30 days
  {
    id: 'DOC-004',
    title: 'Vendor Supply Agreement - GlobalParts',
    category: 'Agreements',
    status: 'expiring-soon',
    expiryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    owner: 'David Kim',
    ownerInitials: 'DK',
    department: 'Procurement',
    autoRenew: false,
    priority: 'critical',
    daysRemaining: 3,
    totalDays: 365,
  },
  {
    id: 'DOC-005',
    title: 'Office Lease Agreement - Floor 12',
    category: 'Leases',
    status: 'expiring-soon',
    expiryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    owner: 'Lisa Wang',
    ownerInitials: 'LW',
    department: 'Facilities',
    autoRenew: false,
    priority: 'critical',
    daysRemaining: 7,
    totalDays: 730,
  },
  {
    id: 'DOC-006',
    title: 'Mutual NDA - PartnerCo Ventures',
    category: 'NDAs',
    status: 'expiring-soon',
    expiryDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
    owner: 'James Liu',
    ownerInitials: 'JL',
    department: 'Legal',
    autoRenew: true,
    priority: 'high',
    daysRemaining: 18,
    totalDays: 365,
  },
  {
    id: 'DOC-007',
    title: 'Insurance Policy - General Liability',
    category: 'Policies',
    status: 'expiring-soon',
    expiryDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
    owner: 'Rachel Green',
    ownerInitials: 'RG',
    department: 'Risk Mgmt',
    autoRenew: true,
    priority: 'high',
    daysRemaining: 28,
    totalDays: 365,
  },
  // 2 Expiring within 60 days
  {
    id: 'DOC-008',
    title: 'Software License - Microsoft 365 Enterprise',
    category: 'Licenses',
    status: 'expiring-soon',
    expiryDate: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000),
    owner: 'Tom Anderson',
    ownerInitials: 'TA',
    department: 'IT',
    autoRenew: true,
    priority: 'medium',
    daysRemaining: 42,
    totalDays: 365,
  },
  {
    id: 'DOC-009',
    title: 'Service Level Agreement - CloudHost Pro',
    category: 'Agreements',
    status: 'expiring-soon',
    expiryDate: new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000),
    owner: 'Nina Patel',
    ownerInitials: 'NP',
    department: 'Engineering',
    autoRenew: false,
    priority: 'medium',
    daysRemaining: 55,
    totalDays: 365,
  },
  // 3 Active (>60 days)
  {
    id: 'DOC-010',
    title: 'Employment Agreement Template 2024',
    category: 'Contracts',
    status: 'active',
    expiryDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    owner: 'Karen Davis',
    ownerInitials: 'KD',
    department: 'HR',
    autoRenew: false,
    priority: 'low',
    daysRemaining: 90,
    totalDays: 365,
  },
  {
    id: 'DOC-011',
    title: 'Compliance Certification - SOC 2 Type II',
    category: 'Policies',
    status: 'active',
    expiryDate: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000),
    owner: 'Alex Rivera',
    ownerInitials: 'AR',
    department: 'Compliance',
    autoRenew: false,
    priority: 'medium',
    daysRemaining: 150,
    totalDays: 365,
  },
  {
    id: 'DOC-012',
    title: 'Warehouse Lease - Building C',
    category: 'Leases',
    status: 'active',
    expiryDate: new Date(now.getTime() + 210 * 24 * 60 * 60 * 1000),
    owner: 'Brian Taylor',
    ownerInitials: 'BT',
    department: 'Operations',
    autoRenew: true,
    priority: 'low',
    daysRemaining: 210,
    totalDays: 730,
  },
  // 3 Recently Renewed
  {
    id: 'DOC-013',
    title: 'Consulting Agreement - Deloitte',
    category: 'Contracts',
    status: 'renewed',
    expiryDate: new Date(now.getTime() + 340 * 24 * 60 * 60 * 1000),
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    department: 'Legal',
    autoRenew: true,
    priority: 'low',
    daysRemaining: 340,
    totalDays: 365,
  },
  {
    id: 'DOC-014',
    title: 'NDA - Confidential Project Alpha',
    category: 'NDAs',
    status: 'renewed',
    expiryDate: new Date(now.getTime() + 280 * 24 * 60 * 60 * 1000),
    owner: 'Michael Ross',
    ownerInitials: 'MR',
    department: 'R&D',
    autoRenew: false,
    priority: 'low',
    daysRemaining: 280,
    totalDays: 365,
  },
  {
    id: 'DOC-015',
    title: 'Data Processing Agreement - EU GDPR',
    category: 'Agreements',
    status: 'renewed',
    expiryDate: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000),
    owner: 'Emma Watson',
    ownerInitials: 'EW',
    department: 'Privacy',
    autoRenew: true,
    priority: 'medium',
    daysRemaining: 300,
    totalDays: 365,
  },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

function getStatusColor(status: ExpiryStatus): string {
  switch (status) {
    case 'active': return 'bg-emerald-500';
    case 'expiring-soon': return 'bg-amber-500';
    case 'expired': return 'bg-red-500';
    case 'renewed': return 'bg-teal-500';
  }
}

function getStatusBadgeVariant(status: ExpiryStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active': return 'default';
    case 'expiring-soon': return 'secondary';
    case 'expired': return 'destructive';
    case 'renewed': return 'outline';
  }
}

function getStatusLabel(status: ExpiryStatus): string {
  switch (status) {
    case 'active': return 'Active';
    case 'expiring-soon': return 'Expiring Soon';
    case 'expired': return 'Expired';
    case 'renewed': return 'Renewed';
  }
}

function getUrgencyColor(days: number): string {
  if (days < 0) return 'red';
  if (days <= 7) return 'red';
  if (days <= 30) return 'amber';
  if (days <= 60) return 'yellow';
  return 'emerald';
}

function getUrgencyBorderColor(days: number): string {
  if (days < 0) return 'border-l-red-500';
  if (days <= 7) return 'border-l-red-500';
  if (days <= 30) return 'border-l-amber-500';
  if (days <= 60) return 'border-l-yellow-500';
  return 'border-l-emerald-500';
}

function getProgressColor(days: number): string {
  if (days < 0) return 'bg-red-500';
  if (days <= 7) return 'bg-red-500';
  if (days <= 30) return 'bg-amber-500';
  if (days <= 60) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

function getProgressGradient(days: number): string {
  if (days < 0) return 'from-red-600 to-red-400';
  if (days <= 7) return 'from-red-600 to-red-400';
  if (days <= 30) return 'from-amber-600 to-amber-400';
  if (days <= 60) return 'from-yellow-600 to-yellow-400';
  return 'from-emerald-600 to-emerald-400';
}

function getCountdownText(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day remaining';
  return `${days} days remaining`;
}

function CategoryIconRenderer({ category, className }: { category: DocumentCategory; className?: string }) {
  switch (category) {
    case 'Contracts': return <FileSignature className={className} />;
    case 'NDAs': return <Shield className={className} />;
    case 'Agreements': return <FileCheck className={className} />;
    case 'Licenses': return <FileText className={className} />;
    case 'Leases': return <Building2 className={className} />;
    case 'Policies': return <Scale className={className} />;
  }
}

function getCategoryColor(category: DocumentCategory): string {
  switch (category) {
    case 'Contracts': return 'bg-teal-500/10 text-teal-600 dark:text-teal-400';
    case 'NDAs': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    case 'Agreements': return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400';
    case 'Licenses': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'Leases': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    case 'Policies': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
  }
}

function formatExpiryDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Animated Counter Hook ───────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return count;
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendLabel,
  pulse,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  trendLabel?: string;
  pulse?: boolean;
}) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`relative overflow-hidden backdrop-blur-sm bg-card/80 border ${color} glass-card`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold" data-testid="stat-value">{animatedValue}</p>
                {trend && (
                  <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-amber-500'}`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
                  </span>
                )}
              </div>
            </div>
            <div className={`rounded-xl p-2.5 ${color.replace('border-', 'bg-').replace('/30', '/15')} ${pulse ? 'animate-pulse' : ''}`}>
              <Icon className={`h-5 w-5 ${color.includes('emerald') ? 'text-emerald-500' : color.includes('amber') ? 'text-amber-500' : color.includes('red') ? 'text-red-500' : color.includes('teal') ? 'text-teal-500' : 'text-cyan-500'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Timeline Component ──────────────────────────────────────────────────────

function ExpiryTimeline({ documents }: { documents: ExpiryDocument[] }) {
  const days = 90;
  const today = new Date();

  const timelineDocs = useMemo(() => {
    return documents
      .filter(d => d.status !== 'renewed')
      .filter(d => {
        const diff = Math.ceil((d.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= -30 && diff <= days;
      })
      .map(d => {
        const diff = Math.ceil((d.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const position = Math.max(0, Math.min(100, ((diff + 30) / (days + 30)) * 100));
        return { ...d, position, diff };
      });
  }, [documents, today]);

  const getMarkerColor = (diff: number) => {
    if (diff < 0) return 'bg-red-500 border-red-400';
    if (diff <= 7) return 'bg-red-500 border-red-400';
    if (diff <= 30) return 'bg-amber-500 border-amber-400';
    if (diff <= 60) return 'bg-yellow-500 border-yellow-400';
    return 'bg-emerald-500 border-emerald-400';
  };

  const todayPosition = ((0 + 30) / (days + 30)) * 100;

  return (
    <Card className="backdrop-blur-sm bg-card/80 glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-500" />
          Expiry Timeline — Next 90 Days
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative h-20">
          {/* Timeline base line */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-muted rounded-full" />

          {/* Day markers */}
          {[0, 15, 30, 45, 60, 75, 90].map((d) => {
            const pos = ((d + 30) / (days + 30)) * 100;
            return (
              <div key={d} className="absolute" style={{ left: `${pos}%` }}>
                <div className="h-3 w-px bg-muted-foreground/30 -translate-y-1.5" />
                <span className="text-[9px] text-muted-foreground/60 -translate-x-1/2 block mt-0.5">
                  {d === 0 ? 'Today' : `+${d}d`}
                </span>
              </div>
            );
          })}

          {/* Today marker */}
          <div
            className="absolute top-4 -translate-x-1/2 z-10"
            style={{ left: `${todayPosition}%` }}
          >
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-t">Today</span>
              <div className="w-0.5 h-4 bg-primary" />
            </div>
          </div>

          {/* Document markers */}
          <TooltipProvider delayDuration={100}>
            {timelineDocs.map((doc) => (
              <Tooltip key={doc.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    className={`absolute top-6 -translate-x-1/2 cursor-pointer ${doc.diff < 7 ? 'z-20' : 'z-10'}`}
                    style={{ left: `${doc.position}%` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                  >
                    <div className={`w-3 h-3 rounded-full border-2 ${getMarkerColor(doc.diff)} ${doc.diff < 0 || doc.diff <= 7 ? 'animate-pulse' : ''}`} />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold">{doc.title}</p>
                  <p className="text-muted-foreground">{formatExpiryDate(doc.expiryDate)}</p>
                  <p>{getCountdownText(doc.diff)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Document Card (Grid View) ───────────────────────────────────────────────

function DocumentCard({
  doc,
  onRenew,
  onRemind,
  selected,
  onSelect,
}: {
  doc: ExpiryDocument;
  onRenew: (doc: ExpiryDocument) => void;
  onRemind: (doc: ExpiryDocument) => void;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) {
  const urgency = getUrgencyColor(doc.daysRemaining);
  const progressValue = Math.max(0, Math.min(100, ((doc.totalDays - doc.daysRemaining) / doc.totalDays) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card className={`relative overflow-hidden h-full backdrop-blur-sm bg-card/80 border-l-4 ${getUrgencyBorderColor(doc.daysRemaining)} glass-card transition-shadow hover:shadow-lg`}>
        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect(doc.id, !!checked)}
                className="shrink-0"
              />
              <div className={`rounded-lg p-1.5 ${getCategoryColor(doc.category)} shrink-0`}>
                <CategoryIconRenderer category={doc.category} className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">{doc.title}</h3>
                <p className="text-[10px] text-muted-foreground">{doc.id}</p>
              </div>
            </div>
            <Badge
              variant={getStatusBadgeVariant(doc.status)}
              className={`shrink-0 text-[10px] ${
                doc.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20' :
                doc.status === 'expiring-soon' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20' :
                doc.status === 'expired' ? 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border-red-500/20' :
                'bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 border-teal-500/20'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full mr-1 ${getStatusColor(doc.status)} ${doc.status === 'expired' ? 'animate-pulse' : ''}`} />
              {getStatusLabel(doc.status)}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">Time remaining</span>
              <span className={`text-[10px] font-semibold ${
                doc.daysRemaining < 0 ? 'text-red-500' :
                doc.daysRemaining <= 7 ? 'text-red-500' :
                doc.daysRemaining <= 30 ? 'text-amber-500' :
                doc.daysRemaining <= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-emerald-500'
              }`}>
                {getCountdownText(doc.daysRemaining)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${getProgressGradient(doc.daysRemaining)}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressValue}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Expiry date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Expires: {formatExpiryDate(doc.expiryDate)}</span>
            {doc.autoRenew && (
              <Badge variant="outline" className="text-[9px] h-4 px-1 ml-auto border-teal-500/30 text-teal-600 dark:text-teal-400">
                <RefreshCw className="h-2.5 w-2.5 mr-0.5" />
                Auto-renew
              </Badge>
            )}
          </div>

          {/* Owner & Department */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                  {doc.ownerInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{doc.owner}</span>
            </div>
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
              {doc.department}
            </Badge>
          </div>

          <Separator />

          {/* Quick actions */}
          <div className="flex items-center gap-1.5">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Document</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onRemind(doc)}>
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Remind
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send Reminder</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                    onClick={() => onRenew(doc)}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Renew
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Initiate Renewal</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                    <History className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View History</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Document Row (List View) ────────────────────────────────────────────────

function DocumentRow({
  doc,
  onRenew,
  onRemind,
  selected,
  onSelect,
}: {
  doc: ExpiryDocument;
  onRenew: (doc: ExpiryDocument) => void;
  onRemind: (doc: ExpiryDocument) => void;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${getUrgencyBorderColor(doc.daysRemaining)} bg-card hover:bg-accent/50 transition-colors`}>
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(doc.id, !!checked)}
        />

        <div className={`rounded-lg p-1.5 ${getCategoryColor(doc.category)} shrink-0`}>
          <CategoryIconRenderer category={doc.category} className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium truncate">{doc.title}</h3>
            {doc.autoRenew && (
              <RefreshCw className="h-3 w-3 text-teal-500 shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{doc.id} · {doc.category}</p>
        </div>

        <Badge
          variant={getStatusBadgeVariant(doc.status)}
          className={`shrink-0 text-[10px] ${
            doc.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
            doc.status === 'expiring-soon' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
            doc.status === 'expired' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
            'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full mr-1 ${getStatusColor(doc.status)} ${doc.status === 'expired' ? 'animate-pulse' : ''}`} />
          {getStatusLabel(doc.status)}
        </Badge>

        <div className="shrink-0 w-36 text-center">
          <span className={`text-xs font-semibold ${
            doc.daysRemaining < 0 ? 'text-red-500' :
            doc.daysRemaining <= 7 ? 'text-red-500' :
            doc.daysRemaining <= 30 ? 'text-amber-500' :
            doc.daysRemaining <= 60 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-emerald-500'
          }`}>
            {getCountdownText(doc.daysRemaining)}
          </span>
        </div>

        <div className="shrink-0 w-24 text-xs text-muted-foreground">
          {formatExpiryDate(doc.expiryDate)}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 w-28">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
              {doc.ownerInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">{doc.owner}</span>
        </div>

        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">
          {doc.department}
        </Badge>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onRemind(doc)}>
            <Mail className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-teal-600 dark:text-teal-400" onClick={() => onRenew(doc)}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Renewal Workflow Dialog ─────────────────────────────────────────────────

function RenewalDialog({
  doc,
  open,
  onClose,
}: {
  doc: ExpiryDocument | null;
  open: boolean;
  onClose: () => void;
}) {
  const [renewalType, setRenewalType] = useState<RenewalType>('extend');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [approvers, setApprovers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const approverOptions = [
    { id: 'legal', label: 'Legal Department', initial: 'LD' },
    { id: 'finance', label: 'Finance Team', initial: 'FT' },
    { id: 'compliance', label: 'Compliance Officer', initial: 'CO' },
    { id: 'dept-head', label: 'Department Head', initial: 'DH' },
  ];

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 1500);
  };

  const toggleApprover = (id: string) => {
    setApprovers(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent key={doc?.id ?? 'none'} className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-teal-500" />
            Initiate Renewal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Document Details */}
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`rounded-lg p-1.5 ${getCategoryColor(doc.category)}`}>
                  <CategoryIconRenderer category={doc.category} className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{doc.title}</h4>
                  <p className="text-xs text-muted-foreground">{doc.id} · {doc.category}</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Current Expiry: <strong>{formatExpiryDate(doc.expiryDate)}</strong></span>
                <span>Owner: <strong>{doc.owner}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Renewal Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Renewal Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'extend' as RenewalType, label: 'Extend Current', icon: Clock, desc: 'Same terms, new dates' },
                { value: 'new-version' as RenewalType, label: 'New Version', icon: Plus, desc: 'Updated terms & dates' },
                { value: 'replace' as RenewalType, label: 'Replace', icon: ArrowRight, desc: 'New document entirely' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setRenewalType(type.value)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    renewalType === type.value
                      ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <type.icon className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-xs font-medium">{type.label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* New Expiry Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">New Expiry Date</Label>
            <Input
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Renewal Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Renewal Notes</Label>
            <Textarea
              placeholder="Add notes about this renewal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Approvers */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Approvers</Label>
            <div className="grid grid-cols-2 gap-2">
              {approverOptions.map((approver) => (
                <label
                  key={approver.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    approvers.includes(approver.id)
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <Checkbox
                    checked={approvers.includes(approver.id)}
                    onCheckedChange={() => toggleApprover(approver.id)}
                  />
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[8px]">{approver.initial}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{approver.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Auto-renew toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-teal-500" />
              <div>
                <Label className="text-sm font-medium">Enable Auto-Renew</Label>
                <p className="text-[10px] text-muted-foreground">Automatically renew before expiry</p>
              </div>
            </div>
            <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !newExpiryDate}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Submit Renewal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reminder Settings Dialog ────────────────────────────────────────────────

function ReminderSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [firstReminder, setFirstReminder] = useState('30');
  const [secondReminder, setSecondReminder] = useState('14');
  const [finalReminder, setFinalReminder] = useState('7');
  const [sendToOwner, setSendToOwner] = useState(true);
  const [sendToDeptHead, setSendToDeptHead] = useState(true);
  const [sendToLegal, setSendToLegal] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 1000);
  };

  const reminderOptions = [
    { value: '7', label: '7 days' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-teal-500" />
            Expiry Reminder Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reminder Schedule */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Reminder Schedule</Label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">First reminder</Label>
                <Select value={firstReminder} onValueChange={setFirstReminder}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} before
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Second reminder</Label>
                <Select value={secondReminder} onValueChange={setSecondReminder}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} before
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Final reminder</Label>
                <Select value={finalReminder} onValueChange={setFinalReminder}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} before
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Send To */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Send Reminders To</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-owner"
                  checked={sendToOwner}
                  onCheckedChange={(checked) => setSendToOwner(!!checked)}
                />
                <Label htmlFor="send-owner" className="text-xs cursor-pointer">Document Owner</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-dept"
                  checked={sendToDeptHead}
                  onCheckedChange={(checked) => setSendToDeptHead(!!checked)}
                />
                <Label htmlFor="send-dept" className="text-xs cursor-pointer">Department Head</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-legal"
                  checked={sendToLegal}
                  onCheckedChange={(checked) => setSendToLegal(!!checked)}
                />
                <Label htmlFor="send-legal" className="text-xs cursor-pointer">Legal Team</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Weekly Digest */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="text-sm font-medium">Include expired in weekly digest</Label>
              <p className="text-[10px] text-muted-foreground">Show already expired documents in weekly report</p>
            </div>
            <Switch checked={includeExpired} onCheckedChange={setIncludeExpired} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Batch Renewal Dialog ────────────────────────────────────────────────────

function BatchRenewalDialog({
  count,
  open,
  onClose,
}: {
  count: number;
  open: boolean;
  onClose: () => void;
}) {
  const [renewalType, setRenewalType] = useState<RenewalType>('extend');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-teal-500" />
            Bulk Renewal — {count} Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are about to initiate renewal for <strong>{count} documents</strong>. Select a renewal type that will apply to all selected documents.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'extend' as RenewalType, label: 'Extend Current', icon: Clock },
              { value: 'new-version' as RenewalType, label: 'New Version', icon: Plus },
              { value: 'replace' as RenewalType, label: 'Replace', icon: ArrowRight },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setRenewalType(type.value)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  renewalType === type.value
                    ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <type.icon className="h-4 w-4 mx-auto mb-1" />
                <p className="text-xs font-medium">{type.label}</p>
              </button>
            ))}
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Individual renewal details (expiry dates, approvers) can be set after this step. Each document owner will be notified.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing {count} Renewals...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Initiate Bulk Renewal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Export Dialog ───────────────────────────────────────────────────────────

function ExportDialog({
  open,
  onClose,
  docCount,
}: {
  open: boolean;
  onClose: () => void;
  docCount: number;
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      // Generate CSV
      const headers = 'Document ID,Title,Category,Status,Expiry Date,Days Remaining,Owner,Department,Auto-Renew\n';
      const rows = mockDocuments.map(d =>
        `${d.id},"${d.title}",${d.category},${d.status},${formatExpiryDate(d.expiryDate)},${d.daysRemaining},${d.owner},${d.department},${d.autoRenew ? 'Yes' : 'No'}`
      ).join('\n');
      const csv = headers + rows;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expiry-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setExporting(false);
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-teal-500" />
            Export Expiry Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Export expiry data for <strong>{docCount} documents</strong> as a CSV file.
          </p>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-medium">Included fields:</p>
            <div className="flex flex-wrap gap-1">
              {['Document ID', 'Title', 'Category', 'Status', 'Expiry Date', 'Days Remaining', 'Owner', 'Department', 'Auto-Renew'].map(field => (
                <Badge key={field} variant="secondary" className="text-[9px] h-4 px-1.5">{field}</Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={exporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
          >
            {exporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DocumentExpiryPage() {
  const { navigate } = useAppStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpiryStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('expiry-date');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Dialog states
  const [renewalDoc, setRenewalDoc] = useState<ExpiryDocument | null>(null);
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false);
  const [batchRenewalOpen, setBatchRenewalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Computed statistics
  const stats = useMemo(() => ({
    active: mockDocuments.filter(d => d.status === 'active').length,
    expiringSoon: mockDocuments.filter(d => d.status === 'expiring-soon').length,
    expired: mockDocuments.filter(d => d.status === 'expired').length,
    renewed: mockDocuments.filter(d => d.status === 'renewed').length,
  }), []);

  // Filtered and sorted documents
  const filteredDocs = useMemo(() => {
    let docs = [...mockDocuments];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter !== 'all') {
      docs = docs.filter(d => d.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      docs = docs.filter(d => d.category === categoryFilter);
    }

    // Sort
    docs.sort((a, b) => {
      switch (sortOption) {
        case 'expiry-date':
          return a.expiryDate.getTime() - b.expiryDate.getTime();
        case 'document-name':
          return a.title.localeCompare(b.title);
        case 'priority': {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case 'days-remaining':
          return a.daysRemaining - b.daysRemaining;
        default:
          return 0;
      }
    });

    return docs;
  }, [searchQuery, statusFilter, categoryFilter, sortOption]);

  // Selection handlers
  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedDocs(new Set(filteredDocs.map(d => d.id)));
  }, [filteredDocs]);

  const deselectAll = useCallback(() => {
    setSelectedDocs(new Set());
  }, []);

  // Action handlers
  const handleRenew = useCallback((doc: ExpiryDocument) => {
    setRenewalDoc(doc);
    setRenewalOpen(true);
  }, []);

  const handleRemind = useCallback((_doc: ExpiryDocument) => {
    // Toast would go here in a real app
  }, []);

  // Status filter pills
  const statusPills: { value: ExpiryStatus | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: mockDocuments.length },
    { value: 'active', label: 'Active', count: stats.active },
    { value: 'expiring-soon', label: 'Expiring Soon', count: stats.expiringSoon },
    { value: 'expired', label: 'Expired', count: stats.expired },
    { value: 'renewed', label: 'Renewed', count: stats.renewed },
  ];

  const categories: (DocumentCategory | 'all')[] = ['all', 'Contracts', 'NDAs', 'Agreements', 'Licenses', 'Leases', 'Policies'];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <motion.h1
            className="text-2xl font-bold tracking-tight flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Timer className="h-6 w-6 text-teal-500" />
            Document Expiry Tracker
          </motion.h1>
          <motion.p
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Monitor document lifecycles, manage renewals, and stay compliant
          </motion.p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReminderSettingsOpen(true)}
          >
            <Settings2 className="h-4 w-4 mr-1.5" />
            Reminder Settings
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
            onClick={() => navigate('document-editor')}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Document
          </Button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Active Documents"
          value={stats.active}
          icon={CheckCircle2}
          color="border-emerald-500/30"
          trend="up"
          trendLabel="+2 this month"
        />
        <StatCard
          title="Expiring Within 30 Days"
          value={stats.expiringSoon}
          icon={AlertTriangle}
          color="border-amber-500/30"
          trend="neutral"
          trendLabel="same as last month"
        />
        <StatCard
          title="Expired Documents"
          value={stats.expired}
          icon={AlertCircle}
          color="border-red-500/30"
          pulse
          trend="down"
          trendLabel="-1 from last month"
        />
        <StatCard
          title="Renewed This Month"
          value={stats.renewed}
          icon={RefreshCw}
          color="border-teal-500/30"
          trend="up"
          trendLabel="+3 this month"
        />
      </div>

      {/* Expiry Timeline */}
      <ExpiryTimeline documents={mockDocuments} />

      {/* Filter Bar */}
      <Card className="backdrop-blur-sm bg-card/80 glass-card">
        <CardContent className="p-4 space-y-3">
          {/* Row 1: Search + Sort + View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by document name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiry-date">Expiry Date</SelectItem>
                <SelectItem value="document-name">Document Name</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="days-remaining">Days Remaining</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-lg overflow-hidden h-9">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-9 rounded-none px-3"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-9 rounded-none px-3"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row 2: Status Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {statusPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  statusFilter === pill.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {pill.label}
                <span className="ml-1 opacity-70">({pill.count})</span>
              </button>
            ))}
          </div>

          {/* Row 3: Category Filter */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions Bar */}
      <AnimatePresence>
        {selectedDocs.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-teal-500/30 bg-teal-500/5"
          >
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30">
                {selectedDocs.size} selected
              </Badge>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAll}>
                Deselect
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {/* send reminders for selected */}}
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                Send Reminders
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                onClick={() => setBatchRenewalOpen(true)}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Bulk Renew
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setExportOpen(true)}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Export Report
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing <strong>{filteredDocs.length}</strong> of {mockDocuments.length} documents
        </p>
        {selectedDocs.size === 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setExportOpen(true)}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export All
          </Button>
        )}
      </div>

      {/* Document Grid/List */}
      {filteredDocs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No documents found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocs.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <DocumentCard
                doc={doc}
                onRenew={handleRenew}
                onRemind={handleRemind}
                selected={selectedDocs.has(doc.id)}
                onSelect={toggleSelect}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[700px] overflow-y-auto">
          {/* List header */}
          <div className="flex items-center gap-3 p-3 text-xs font-medium text-muted-foreground border-b">
            <div className="w-5" />
            <div className="w-6" />
            <div className="flex-1">Document</div>
            <div className="w-20 text-center">Status</div>
            <div className="w-36 text-center">Countdown</div>
            <div className="w-24">Expiry</div>
            <div className="w-28">Owner</div>
            <div className="w-20">Dept</div>
            <div className="w-16">Actions</div>
          </div>

          {filteredDocs.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <DocumentRow
                doc={doc}
                onRenew={handleRenew}
                onRemind={handleRemind}
                selected={selectedDocs.has(doc.id)}
                onSelect={toggleSelect}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <RenewalDialog
        doc={renewalDoc}
        open={renewalOpen}
        onClose={() => {
          setRenewalOpen(false);
          setRenewalDoc(null);
        }}
      />
      <ReminderSettingsDialog
        open={reminderSettingsOpen}
        onClose={() => setReminderSettingsOpen(false)}
      />
      <BatchRenewalDialog
        count={selectedDocs.size}
        open={batchRenewalOpen}
        onClose={() => setBatchRenewalOpen(false)}
      />
      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        docCount={filteredDocs.length}
      />
    </div>
  );
}
