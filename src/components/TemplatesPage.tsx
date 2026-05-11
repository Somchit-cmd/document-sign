'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api, mockTemplates } from '@/lib/api';
import type { TemplateCategory, Template } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  LayoutTemplate,
  FileText,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Eye,
  Plus,
  Sparkles,
  BarChart3,
  X,
  Check,
  Copy,
  Pencil,
  Zap,
  ChevronRight,
  ScrollText,
  ShieldCheck,
  Briefcase,
  Receipt,
  Heart,
  Scale,
  FolderOpen,
  Star,
  ArrowLeftRight,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { EmptyState } from './EmptyState';

// Category definitions with icons and gradient colors
const categories: { value: TemplateCategory | 'all'; label: string; icon: React.ReactNode; gradient: string }[] = [
  { value: 'all', label: 'All', icon: <LayoutTemplate className="h-3.5 w-3.5" />, gradient: 'from-emerald-500 to-teal-500' },
  { value: 'contract', label: 'Contracts', icon: <ScrollText className="h-3.5 w-3.5" />, gradient: 'from-teal-500 to-cyan-500' },
  { value: 'agreement', label: 'Agreements', icon: <ShieldCheck className="h-3.5 w-3.5" />, gradient: 'from-emerald-500 to-green-500' },
  { value: 'nda', label: 'NDAs', icon: <Scale className="h-3.5 w-3.5" />, gradient: 'from-purple-500 to-violet-500' },
  { value: 'proposal', label: 'Proposals', icon: <Briefcase className="h-3.5 w-3.5" />, gradient: 'from-cyan-500 to-blue-500' },
  { value: 'invoice', label: 'Finance', icon: <Receipt className="h-3.5 w-3.5" />, gradient: 'from-amber-500 to-orange-500' },
  { value: 'hr', label: 'HR', icon: <Heart className="h-3.5 w-3.5" />, gradient: 'from-pink-500 to-rose-500' },
  { value: 'legal', label: 'Legal', icon: <Scale className="h-3.5 w-3.5" />, gradient: 'from-red-500 to-rose-500' },
  { value: 'other', label: 'Custom', icon: <FolderOpen className="h-3.5 w-3.5" />, gradient: 'from-gray-500 to-slate-500' },
];

const categoryColors: Record<string, string> = {
  contract: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  agreement: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  nda: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  proposal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  invoice: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hr: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  legal: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// Top border gradient per category
const categoryBorderGradients: Record<string, string> = {
  contract: 'bg-gradient-to-r from-teal-400 to-cyan-400',
  agreement: 'bg-gradient-to-r from-emerald-400 to-green-400',
  nda: 'bg-gradient-to-r from-purple-400 to-violet-400',
  proposal: 'bg-gradient-to-r from-cyan-400 to-blue-400',
  invoice: 'bg-gradient-to-r from-amber-400 to-orange-400',
  hr: 'bg-gradient-to-r from-pink-400 to-rose-400',
  legal: 'bg-gradient-to-r from-red-400 to-rose-400',
  other: 'bg-gradient-to-r from-gray-400 to-slate-400',
};

// Template type icon mapping
const categoryIconMap: Record<string, { icon: React.ReactNode; bg: string }> = {
  contract: { icon: <ScrollText className="h-5 w-5" />, bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  agreement: { icon: <ShieldCheck className="h-5 w-5" />, bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  nda: { icon: <Scale className="h-5 w-5" />, bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  proposal: { icon: <Briefcase className="h-5 w-5" />, bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  invoice: { icon: <Receipt className="h-5 w-5" />, bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  hr: { icon: <Heart className="h-5 w-5" />, bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  legal: { icon: <Scale className="h-5 w-5" />, bg: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  other: { icon: <FileText className="h-5 w-5" />, bg: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
};

// Mock workflow steps for preview dialog
const mockWorkflowSteps = [
  { id: 'ws1', label: 'Legal Review', type: 'review' as const, assignee: 'John M.' },
  { id: 'ws2', label: 'Manager Approval', type: 'approve' as const, assignee: 'Sarah C.' },
  { id: 'ws3', label: 'Sign', type: 'sign' as const, assignee: 'David K.' },
];

// Mock recent uses for preview dialog
const mockRecentUses = [
  { id: 'ru1', title: 'NDA - Acme Corp', date: '2025-07-08T14:30:00Z' },
  { id: 'ru2', title: 'NDA - TechStart Inc', date: '2025-07-06T09:30:00Z' },
  { id: 'ru3', title: 'NDA - DataViz Analytics', date: '2025-07-04T16:00:00Z' },
];

// Mock template fields for preview dialog
const mockTemplateFields: Record<string, { label: string; type: string }[]> = {
  nda: [
    { label: 'Disclosing Party', type: 'text' },
    { label: 'Receiving Party', type: 'text' },
    { label: 'Effective Date', type: 'date' },
    { label: 'Duration', type: 'text' },
    { label: 'Governing Law', type: 'dropdown' },
  ],
  contract: [
    { label: 'Party A', type: 'text' },
    { label: 'Party B', type: 'text' },
    { label: 'Contract Value', type: 'text' },
    { label: 'Start Date', type: 'date' },
    { label: 'End Date', type: 'date' },
    { label: 'Signature', type: 'signature' },
  ],
  hr: [
    { label: 'Employee Name', type: 'text' },
    { label: 'Position', type: 'text' },
    { label: 'Start Date', type: 'date' },
    { label: 'Salary', type: 'text' },
    { label: 'Department', type: 'dropdown' },
  ],
  agreement: [
    { label: 'Party Name', type: 'text' },
    { label: 'Agreement Type', type: 'dropdown' },
    { label: 'Effective Date', type: 'date' },
  ],
  proposal: [
    { label: 'Client Name', type: 'text' },
    { label: 'Project Scope', type: 'text' },
    { label: 'Total Amount', type: 'text' },
    { label: 'Delivery Date', type: 'date' },
  ],
  invoice: [
    { label: 'Invoice Number', type: 'text' },
    { label: 'Client', type: 'text' },
    { label: 'Amount', type: 'text' },
    { label: 'Due Date', type: 'date' },
  ],
  legal: [
    { label: 'Document Title', type: 'text' },
    { label: 'Jurisdiction', type: 'dropdown' },
    { label: 'Filing Date', type: 'date' },
  ],
  other: [
    { label: 'Title', type: 'text' },
    { label: 'Description', type: 'text' },
  ],
};

// Step type icons
const stepTypeIcons: Record<string, React.ReactNode> = {
  review: <Eye className="h-3.5 w-3.5" />,
  approve: <Check className="h-3.5 w-3.5" />,
  sign: <Pencil className="h-3.5 w-3.5" />,
  notify: <Zap className="h-3.5 w-3.5" />,
};

const stepTypeColors: Record<string, string> = {
  review: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  sign: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  notify: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

// Check if template was created in last 7 days
function isNewTemplate(createdAt: string): boolean {
  const created = new Date(createdAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return created > sevenDaysAgo;
}

// Enhanced Template Card with all visual improvements
function EnhancedTemplateCard({
  template,
  onPreview,
  onQuickUse,
}: {
  template: Template;
  onPreview: () => void;
  onQuickUse: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const catIcon = categoryIconMap[template.category] || categoryIconMap.other;
  const borderGradient = categoryBorderGradients[template.category] || categoryBorderGradients.other;
  const maxUsage = 350; // for popularity bar scaling
  const popularityPct = Math.min((template.usageCount / maxUsage) * 100, 100);
  const isNew = isNewTemplate(template.createdAt);
  const isPopular = template.usageCount > 10;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="overflow-hidden transition-all duration-300 cursor-pointer group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Gradient top border */}
        <div className={`h-1 w-full ${borderGradient}`} />

        <CardContent className="p-4 pt-3">
          {/* Template preview area */}
          <div
            className="bg-muted/30 rounded-lg border border-border h-32 flex items-center justify-center mb-4 relative overflow-hidden"
            onClick={onPreview}
          >
            {/* Hover overlay with Quick Use button */}
            <motion.div
              className="absolute inset-0 bg-black/5 dark:bg-white/5 backdrop-blur-[2px] flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                onClick={(e) => { e.stopPropagation(); onQuickUse(); }}
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Quick Use
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="shadow-lg"
                onClick={(e) => { e.stopPropagation(); onPreview(); }}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Preview
              </Button>
            </motion.div>

            {/* Template type icon */}
            <div className={`rounded-xl p-3 ${catIcon.bg}`}>
              {catIcon.icon}
            </div>

            {/* Category badge */}
            <Badge
              className={`absolute top-2 right-2 text-[10px] capitalize ${categoryColors[template.category] || categoryColors.other}`}
            >
              {template.category}
            </Badge>

            {/* Popular badge */}
            {isPopular && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] border-0">
                  <TrendingUp className="mr-1 h-2.5 w-2.5" />
                  Popular
                </Badge>
              </div>
            )}

            {/* New badge */}
            {isNew && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] border-0">
                  <Sparkles className="mr-1 h-2.5 w-2.5" />
                  New
                </Badge>
              </div>
            )}
          </div>

          {/* Info */}
          <h3 className="text-sm font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
            {template.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>

          {/* Usage statistics */}
          <div className="mt-3 space-y-2">
            {/* Popularity bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Used {template.usageCount >= 1000 ? `${(template.usageCount / 1000).toFixed(1)}k` : template.usageCount} times</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(template.updatedAt), { addSuffix: false })} ago</span>
                </div>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${borderGradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${popularityPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[7px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {template.createdBy.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground">
                {template.createdBy.name}
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); onQuickUse(); }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Use template</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Template Preview Dialog
function TemplatePreviewDialog({
  open,
  onClose,
  template,
  onUse,
}: {
  open: boolean;
  onClose: () => void;
  template: Template | null;
  onUse: () => void;
}) {
  if (!template) return null;

  const catIcon = categoryIconMap[template.category] || categoryIconMap.other;
  const borderGradient = categoryBorderGradients[template.category] || categoryBorderGradients.other;
  const fields = mockTemplateFields[template.category] || mockTemplateFields.other;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${catIcon.bg}`}>
              {catIcon.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {template.name}
                <Badge className={`text-[10px] capitalize ${categoryColors[template.category] || categoryColors.other}`}>
                  {template.category}
                </Badge>
                {template.usageCount > 10 && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] border-0">
                    <TrendingUp className="mr-1 h-2.5 w-2.5" /> Popular
                  </Badge>
                )}
              </div>
              <DialogDescription className="mt-1">{template.description}</DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Usage Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{template.usageCount}</p>
              <p className="text-xs text-muted-foreground">Total Uses</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: false })}
              </p>
              <p className="text-xs text-muted-foreground">Last Updated</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fields.length}</p>
              <p className="text-xs text-muted-foreground">Fields</p>
            </div>
          </div>

          {/* Fields Section */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-emerald-500" />
              Template Fields
            </h3>
            <div className="flex flex-wrap gap-2">
              {fields.map((field, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Badge
                    variant="outline"
                    className="px-3 py-1.5 text-xs font-medium gap-1.5"
                  >
                    {field.type === 'signature' ? (
                      <Pencil className="h-3 w-3 text-purple-500" />
                    ) : field.type === 'date' ? (
                      <Clock className="h-3 w-3 text-cyan-500" />
                    ) : field.type === 'dropdown' ? (
                      <BarChart3 className="h-3 w-3 text-amber-500" />
                    ) : (
                      <FileText className="h-3 w-3 text-emerald-500" />
                    )}
                    {field.label}
                    <span className="text-muted-foreground text-[10px]">{field.type}</span>
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Workflow Section */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <ArrowLeftRight className="h-4 w-4 text-emerald-500" />
              Approval Workflow
            </h3>
            <div className="flex items-center gap-1">
              {mockWorkflowSteps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-1">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className={`rounded-full p-2.5 ${stepTypeColors[step.type]}`}>
                      {stepTypeIcons[step.type]}
                    </div>
                    <p className="text-[10px] font-medium mt-1 text-center max-w-[70px] truncate">{step.label}</p>
                    <p className="text-[9px] text-muted-foreground">{step.assignee}</p>
                  </motion.div>
                  {i < mockWorkflowSteps.length - 1 && (
                    <div className="flex-shrink-0 px-0.5 mb-6">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Uses Section */}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-emerald-500" />
              Recent Uses
            </h3>
            <div className="space-y-2">
              {mockRecentUses.map((use, i) => (
                <motion.div
                  key={use.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-emerald-500/10 p-1.5 shrink-0">
                    <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{use.title}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(use.date), { addSuffix: true })}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={onUse}
            >
              <Zap className="mr-2 h-4 w-4" />
              Use This Template
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { toast.info('Template editor would open here'); }}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => { toast.success('Template duplicated!'); }}>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Duplicate
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Create from template dialog
function CreateFromTemplateDialog({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template: Template | null;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');

  if (!template) return null;

  const handleCreate = () => {
    toast.success(`Document created from "${template.name}" template`);
    setTitle('');
    setDescription('');
    setRecipient('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            Create from Template
          </DialogTitle>
          <DialogDescription>Create a new document using this template</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Template info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{template.category} · Used {template.usageCount} times</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-2">
            <Label>Document Title</Label>
            <Input
              placeholder="Enter document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description of this document"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>First Recipient</Label>
            <Input
              placeholder="Recipient email address"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          {/* Template variables */}
          {template.fields.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Template Variables
                <Badge variant="outline" className="text-[10px]">{template.fields.length}</Badge>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {template.fields.slice(0, 6).map((field) => (
                  <div key={field.id} className="flex items-center gap-2 p-2 rounded border border-border bg-background text-xs">
                    <span className="font-medium capitalize">{field.label}</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">{field.type}</Badge>
                  </div>
                ))}
                {template.fields.length > 6 && (
                  <div className="flex items-center justify-center p-2 rounded border border-dashed border-border text-xs text-muted-foreground">
                    +{template.fields.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCreate}
              disabled={!title.trim()}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Skeleton loading for template cards
function TemplateCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-1 w-full">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="p-4 pt-3 space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>
    </div>
  );
}

export function TemplatesPage() {
  const { navigate } = useAppStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'updated'>('usage');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Fetch templates from API
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates', category, search],
    queryFn: async () => {
      const res = await api.getTemplates(
        category !== 'all' ? category : undefined,
        search || undefined
      );
      if (res.success && res.data && res.data.length > 0) return res.data;
      return mockTemplates;
    },
    staleTime: 60 * 1000,
  });

  const templates: Template[] = templatesData || mockTemplates;

  const filteredTemplates = useMemo(() => {
    let tpls = [...templates];

    // Client-side search fallback
    if (search) {
      const q = search.toLowerCase();
      tpls = tpls.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    // Client-side category filter fallback
    if (category !== 'all') {
      tpls = tpls.filter((t) => t.category === category);
    }

    // Sort
    if (sortBy === 'usage') {
      tpls.sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortBy === 'name') {
      tpls.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'updated') {
      tpls.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return tpls;
  }, [templates, search, category, sortBy]);

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setCreateDialogOpen(true);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    templates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [templates]);

  const activeCategoryData = categories.find(c => c.value === category);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Start with a pre-built template
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-36">
              <BarChart3 className="mr-2 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usage">Most Popular</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => setSearch('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Category filter pills - horizontal scrollable with gradient highlighting */}
      <div className="relative -mx-6 px-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {categories.map((cat) => {
              const isActive = category === cat.value;
              const count = categoryCounts[cat.value] || 0;
              return (
                <Button
                  key={cat.value}
                  variant={isActive ? 'secondary' : 'outline'}
                  size="sm"
                  className={`shrink-0 transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r text-white shadow-md border-0 ' + cat.gradient
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.icon}
                  <span className="ml-1.5">{cat.label}</span>
                  <Badge
                    className={`ml-1.5 h-4 px-1 text-[9px] ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : ''
                    }`}
                    variant={isActive ? 'outline' : 'outline'}
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Template Stats Bar */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}</span>
          <span className="text-border">|</span>
          <span>Most popular: <strong className="text-foreground">{[...filteredTemplates].sort((a, b) => b.usageCount - a.usageCount)[0]?.name}</strong></span>
          <span className="text-border">|</span>
          <span>Total uses: <strong className="text-foreground">{filteredTemplates.reduce((acc, t) => acc + t.usageCount, 0).toLocaleString()}</strong></span>
        </div>
      )}

      {/* Recently Used section */}
      {filteredTemplates.length > 0 && sortBy === 'usage' && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            Most Popular
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {filteredTemplates.slice(0, 4).map((template, i) => {
              const catIcon = categoryIconMap[template.category] || categoryIconMap.other;
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                  onClick={() => handlePreviewTemplate(template)}
                >
                  <div className={`rounded-lg p-2 shrink-0 ${catIcon.bg}`}>
                    {catIcon.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{template.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{template.category} · {template.usageCount >= 1000 ? `${(template.usageCount / 1000).toFixed(1)}k` : template.usageCount} uses</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </motion.div>
              );
            })}
          </div>
          <Separator className="mb-6" />
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <TemplateCardSkeleton />
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        /* Empty state */
        <EmptyState
          variant="templates"
          title="No templates found"
          description="Try adjusting your search or category filter, or create a new template."
          action={{
            label: 'Create Template',
            onClick: () => {},
          }}
        />
      ) : (
        /* Template grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template) => (
              <EnhancedTemplateCard
                key={template.id}
                template={template}
                onPreview={() => handlePreviewTemplate(template)}
                onQuickUse={() => handleUseTemplate(template)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        template={selectedTemplate}
        onUse={() => {
          setPreviewDialogOpen(false);
          if (selectedTemplate) handleUseTemplate(selectedTemplate);
        }}
      />

      {/* Create from template dialog */}
      <CreateFromTemplateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        template={selectedTemplate}
      />
    </div>
  );
}
