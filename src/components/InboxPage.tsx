'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { api, mockDocuments } from '@/lib/api';
import type { Document } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import {
  Inbox,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCheck,
  User,
  ChevronRight,
  CircleDot,
  CircleCheck,
  CircleX,
  Circle,
  PenTool,
  Forward,
  Volume2,
  VolumeX,
  ArrowUpDown,
  Sparkles,
  Send,
  Users,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { EmptyState } from './EmptyState';

// Priority left border colors
const priorityBorderColors: Record<string, string> = {
  urgent: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-amber-500',
  normal: 'border-l-4 border-l-emerald-500',
  low: 'border-l-4 border-l-gray-400 dark:border-l-gray-600',
};

// Document type icons with colored backgrounds
const docTypeIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
  contract: { icon: <FileText className="h-5 w-5" />, bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  nda: { icon: <FileText className="h-5 w-5" />, bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  employment: { icon: <Users className="h-5 w-5" />, bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  default: { icon: <FileText className="h-5 w-5" />, bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
};

// Estimated time to complete based on document properties
function getEstimatedTime(doc: Document): string {
  const pendingCount = doc.recipients.filter(r => r.status === 'pending').length;
  const hasSignatures = doc.fields.some(f => f.type === 'signature');
  if (hasSignatures && pendingCount > 1) return '~3 min to sign';
  if (hasSignatures) return '~2 min to sign';
  if (pendingCount > 1) return '~1 min to review';
  return '~1 min to review';
}

// Check if document was received in the last hour
function isReceivedInLastHour(createdAt: string): boolean {
  const created = new Date(createdAt);
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  return created > oneHourAgo;
}

// Mock delegate users
const delegateUsers = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@docsign.com', department: 'Engineering' },
  { id: '2', name: 'John Martinez', email: 'john@docsign.com', department: 'Legal' },
  { id: '3', name: 'Emily Watson', email: 'emily@docsign.com', department: 'Sales' },
  { id: '4', name: 'David Kim', email: 'david@docsign.com', department: 'Finance' },
  { id: '5', name: 'Lisa Park', email: 'lisa@docsign.com', department: 'HR' },
];

// Approval timeline for a document
function ApprovalTimeline({ doc }: { doc: Document }) {
  const steps = [
    ...(doc.signatures || []).map((sig) => ({
      id: sig.id,
      label: `${sig.signer?.name || 'Signer'} - ${sig.type === 'drawn' ? 'Signature' : 'Initial'}`,
      status: sig.signedAt ? 'completed' : 'pending' as const,
      date: sig.signedAt,
    })),
    ...(doc.recipients || []).map((rec) => ({
      id: rec.id,
      label: `${rec.user.name} - ${rec.role === 'signer' ? 'Sign' : rec.role === 'cc' ? 'CC' : 'Review'}`,
      status: rec.status === 'signed' ? 'completed' : rec.status === 'declined' ? 'rejected' as const : 'pending' as const,
      date: rec.signedAt,
    })),
  ];

  if (steps.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">Approval Chain</p>
      <div className="space-y-1">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            <div className="shrink-0">
              {step.status === 'completed' ? (
                <CircleCheck className="h-4 w-4 text-emerald-500" />
              ) : step.status === 'rejected' ? (
                <CircleX className="h-4 w-4 text-red-500" />
              ) : (
                <CircleDot className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <span className={`text-xs flex-1 ${
              step.status === 'completed' ? 'text-emerald-700 dark:text-emerald-400' :
              step.status === 'rejected' ? 'text-red-700 dark:text-red-400' :
              'text-muted-foreground'
            }`}>
              {step.label}
            </span>
            {step.date && (
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(step.date), { addSuffix: true })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick Sign Dialog
function QuickSignDialog({
  open,
  onClose,
  document,
  onSign,
}: {
  open: boolean;
  onClose: () => void;
  document: Document | null;
  onSign: (docId: string) => void;
}) {
  const [signType, setSignType] = useState<'draw' | 'type'>('type');
  const [typedName, setTypedName] = useState('');

  if (!document) return null;

  const handleSign = () => {
    onSign(document.id);
    setTypedName('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-emerald-500" />
            Quick Sign
          </DialogTitle>
          <DialogDescription>Sign this document directly from your inbox</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Document info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium">{document.title}</p>
            <p className="text-xs text-muted-foreground mt-1">From {document.owner.name}</p>
          </div>

          {/* Sign type toggle */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={signType === 'type' ? 'secondary' : 'outline'}
              className={signType === 'type' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
              onClick={() => setSignType('type')}
            >
              Type Signature
            </Button>
            <Button
              size="sm"
              variant={signType === 'draw' ? 'secondary' : 'outline'}
              className={signType === 'draw' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
              onClick={() => setSignType('draw')}
            >
              Draw Signature
            </Button>
          </div>

          {signType === 'type' ? (
            <div className="space-y-2">
              <Label>Type your name to sign</Label>
              <Input
                placeholder="Type your full name"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
              />
              {typedName && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border text-center">
                  <p className="text-xl font-cursive italic text-emerald-600 dark:text-emerald-400">{typedName}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Draw your signature</Label>
              <div className="border-2 border-dashed border-border rounded-lg h-32 flex items-center justify-center bg-muted/20">
                <p className="text-xs text-muted-foreground">Draw your signature here</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSign}
              disabled={signType === 'type' && !typedName.trim()}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Sign Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Delegate Dialog
function DelegateDialog({
  open,
  onClose,
  document,
  onDelegate,
}: {
  open: boolean;
  onClose: () => void;
  document: Document | null;
  onDelegate: (docId: string, userId: string, reason: string) => void;
}) {
  const [selectedUser, setSelectedUser] = useState('');
  const [reason, setReason] = useState('');

  if (!document) return null;

  const handleDelegate = () => {
    onDelegate(document.id, selectedUser, reason);
    setSelectedUser('');
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5 text-amber-500" />
            Delegate Approval
          </DialogTitle>
          <DialogDescription>Delegate this approval to another team member</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium">{document?.title}</p>
            <p className="text-xs text-muted-foreground mt-1">From {document?.owner.name}</p>
          </div>

          <div className="space-y-2">
            <Label>Delegate to</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {delegateUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[8px]">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">({user.department})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason for delegation</Label>
            <Textarea
              placeholder="Explain why you are delegating this approval..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleDelegate}
              disabled={!selectedUser || !reason.trim()}
            >
              <Forward className="mr-1.5 h-4 w-4" />
              Delegate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Enhanced Approval Card
function ApprovalCard({
  document,
  onAction,
  onQuickSign,
  onDelegate,
  selected,
  onToggleSelect,
}: {
  document: Document;
  onAction?: (action: string, docId: string) => void;
  onQuickSign: (doc: Document) => void;
  onDelegate: (doc: Document) => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const pendingForUser = document.recipients.filter((r) => r.status === 'pending');
  const isUrgent = document.priority === 'urgent' || document.priority === 'high';
  const signedCount = document.signatures.filter(s => s.signedAt).length;
  const totalSigners = document.recipients.length || document.signatures.length;
  const progressPct = totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0;
  const currentStep = signedCount + 1;
  const estimatedTime = getEstimatedTime(document);
  const isNew = isReceivedInLastHour(document.createdAt);
  const borderClass = priorityBorderColors[document.priority] || priorityBorderColors.normal;

  // Determine doc type icon
  const titleLower = document.title.toLowerCase();
  let docType = 'default';
  if (titleLower.includes('nda') || titleLower.includes('non-disclosure')) docType = 'nda';
  else if (titleLower.includes('contract') || titleLower.includes('agreement')) docType = 'contract';
  else if (titleLower.includes('employment') || titleLower.includes('hr')) docType = 'employment';
  const typeIcon = docTypeIcons[docType] || docTypeIcons.default;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.005] ${borderClass} ${selected ? 'ring-2 ring-emerald-500/50' : ''}`}>
        <CardContent className="p-4 relative">
          {/* Urgency indicator - pulsing dot */}
          {document.priority === 'urgent' && (
            <motion.div
              className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* New badge */}
          {isNew && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] border-0 animate-pulse">
                <Sparkles className="mr-1 h-2.5 w-2.5" />
                New
              </Badge>
            </div>
          )}

          {/* Swipe hint for mobile */}
          <div className="sm:hidden absolute top-1/2 -translate-y-1/2 -right-1 opacity-30">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-start gap-3">
            {/* Selection checkbox */}
            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
            </div>

            {/* Icon with colored background based on type */}
            <div className={`rounded-lg p-2.5 shrink-0 ${typeIcon.bg}`}>
              {typeIcon.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium truncate">{document.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    From <span className="font-medium">{document.owner.name}</span>
                    {document.expiresAt && (
                      <> · <Clock className="inline h-3 w-3 mr-0.5" />Expires {formatDistanceToNow(new Date(document.expiresAt), { addSuffix: true })}</>
                    )}
                  </p>
                </div>
                <PriorityBadge priority={document.priority} />
              </div>

              {/* Status badges + estimated time */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={document.status} />
                {pendingForUser.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {pendingForUser.length} pending action{pendingForUser.length > 1 ? 's' : ''}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                  <Clock className="mr-1 h-2.5 w-2.5" />
                  {estimatedTime}
                </Badge>
              </div>

              {/* Signature progress with step indicator */}
              {totalSigners > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={progressPct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Step {currentStep} of {totalSigners} · {signedCount}/{totalSigners} signed
                  </span>
                </div>
              )}

              {/* Approval timeline */}
              <ApprovalTimeline doc={document} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white btn-click-scale"
              onClick={() => onAction?.('approve', document.id)}
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive btn-click-scale"
              onClick={() => onAction?.('reject', document.id)}
            >
              <XCircle className="mr-1 h-3 w-3" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="btn-click-scale text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              onClick={() => onQuickSign(document)}
            >
              <PenTool className="mr-1 h-3 w-3" />
              <span className="hidden sm:inline">Quick Sign</span>
              <span className="sm:hidden">Sign</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="btn-click-scale text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={() => onDelegate(document)}
            >
              <Forward className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="btn-click-scale"
              onClick={() => onAction?.('view', document.id)}
            >
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Reject dialog
function RejectDialog({
  open,
  onClose,
  onConfirm,
  docTitle,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  docTitle: string;
}) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Reject Document</DialogTitle>
          <DialogDescription>Provide a reason for rejecting this document</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            You are rejecting: <strong>{docTitle}</strong>
          </p>
          <div className="space-y-2">
            <Label>Reason for rejection</Label>
            <Textarea
              placeholder="Please provide a reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="btn-click-scale">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { onConfirm(reason); setReason(''); onClose(); }}
              disabled={!reason.trim()}
              className="btn-click-scale"
            >
              Reject Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sort options type
type SortOption = 'priority' | 'date-received' | 'deadline' | 'sender';

function sortDocuments(docs: Document[], sortBy: SortOption): Document[] {
  const sorted = [...docs];
  switch (sortBy) {
    case 'priority':
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      sorted.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));
      break;
    case 'date-received':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'deadline':
      sorted.sort((a, b) => {
        if (!a.expiresAt && !b.expiresAt) return 0;
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      });
      break;
    case 'sender':
      sorted.sort((a, b) => a.owner.name.localeCompare(b.owner.name));
      break;
  }
  return sorted;
}

export function InboxPage() {
  const { navigate } = useAppStore();
  const queryClient = useQueryClient();
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string>('');
  const [rejectDocTitle, setRejectDocTitle] = useState('');
  const [quickSignDoc, setQuickSignDoc] = useState<Document | null>(null);
  const [delegateDoc, setDelegateDoc] = useState<Document | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch pending documents
  const { data: pendingDocs, isLoading } = useQuery({
    queryKey: ['inbox-documents'],
    queryFn: async () => {
      const res = await api.getDocuments({ status: ['sent'], pageSize: 50 });
      if (res.success && res.data && res.data.items.length > 0) return res.data.items;
      return mockDocuments.filter((d) => d.status === 'sent' || d.status === 'viewed');
    },
    staleTime: 30 * 1000,
  });

  const pendingDocuments = pendingDocs || mockDocuments.filter(
    (d) => d.status === 'sent' || d.status === 'viewed'
  );

  // Apply sorting
  const sortedPendingDocs = useMemo(() => sortDocuments(pendingDocuments, sortBy), [pendingDocuments, sortBy]);

  // Tab-based categorization
  const needsSignature = useMemo(() =>
    sortDocuments(pendingDocuments.filter((d) =>
      d.recipients.some(r => r.role === 'signer' && r.status === 'pending')
    ), sortBy),
    [pendingDocuments, sortBy]
  );
  const needsApproval = useMemo(() =>
    sortDocuments(pendingDocuments.filter((d) =>
      d.recipients.some(r => r.role === 'viewer' && r.status === 'pending') ||
      d.status === 'sent'
    ), sortBy),
    [pendingDocuments, sortBy]
  );
  const completedDocs: Document[] = [];
  const urgentItems = useMemo(() =>
    sortDocuments(pendingDocuments.filter((d) => d.priority === 'urgent' || d.priority === 'high'), sortBy),
    [pendingDocuments, sortBy]
  );

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ docId, workflowId, stepId }: { docId: string; workflowId: string; stepId: string }) => {
      return api.approveWorkflowStep(workflowId, stepId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-documents'] });
      toast.success('Document approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve document');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ docId, reason }: { docId: string; reason: string }) => {
      return api.rejectDocument(docId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-documents'] });
      toast.success('Document rejected');
    },
    onError: () => {
      toast.error('Failed to reject document');
    },
  });

  const handleAction = (action: string, docId: string) => {
    if (action === 'view') {
      navigate('document-detail', { id: docId });
    } else if (action === 'approve') {
      approveMutation.mutate({ docId, workflowId: docId, stepId: docId });
    } else if (action === 'reject') {
      const doc = pendingDocuments.find(d => d.id === docId);
      setRejectDocId(docId);
      setRejectDocTitle(doc?.title || 'Document');
      setRejectDialogOpen(true);
    }
  };

  const handleRejectConfirm = (reason: string) => {
    rejectMutation.mutate({ docId: rejectDocId, reason });
  };

  const handleQuickSign = (doc: Document) => {
    setQuickSignDoc(doc);
  };

  const handleQuickSignConfirm = (docId: string) => {
    approveMutation.mutate({ docId, workflowId: docId, stepId: docId });
    toast.success('Document signed successfully!');
  };

  const handleDelegate = (doc: Document) => {
    setDelegateDoc(doc);
  };

  const handleDelegateConfirm = (docId: string, userId: string, reason: string) => {
    toast.success(`Approval delegated to ${delegateUsers.find(u => u.id === userId)?.name || 'team member'}`);
  };

  const toggleSelectDoc = (id: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchApprove = () => {
    selectedDocs.forEach(docId => {
      approveMutation.mutate({ docId, workflowId: docId, stepId: docId });
    });
    toast.success(`${selectedDocs.size} document(s) approved`);
    setSelectedDocs(new Set());
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    toast.info(soundEnabled ? 'Notification sounds disabled' : 'Notification sounds enabled');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground text-sm mt-1">Documents requiring your attention</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Documents requiring your attention
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort by */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="date-received">Date Received</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="sender">Sender</SelectItem>
            </SelectContent>
          </Select>

          {/* Sound toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSound}
            className="h-9 w-9"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {/* Batch approve */}
          {selectedDocs.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <Badge variant="secondary">{selectedDocs.size} selected</Badge>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white btn-click-scale"
                onClick={handleBatchApprove}
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Batch Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedDocs(new Set())}
                className="btn-click-scale"
              >
                Clear
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="btn-click-scale">
            All ({pendingDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="signature" className="btn-click-scale">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Needs Signature ({needsSignature.length})
          </TabsTrigger>
          <TabsTrigger value="approval" className="btn-click-scale">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Needs Approval ({needsApproval.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="btn-click-scale">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {/* Urgent section with animated warning icon */}
          {urgentItems.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </motion.div>
                <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Urgent & High Priority</h2>
                <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800">
                  {urgentItems.length}
                </Badge>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent dark:from-amber-800" />
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {urgentItems.map((doc) => (
                    <ApprovalCard
                      key={doc.id}
                      document={doc}
                      onAction={handleAction}
                      onQuickSign={handleQuickSign}
                      onDelegate={handleDelegate}
                      selected={selectedDocs.has(doc.id)}
                      onToggleSelect={() => toggleSelectDoc(doc.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
              <Separator className="my-4" />
            </div>
          )}

          {/* All items */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sortedPendingDocs.map((doc) => (
                <ApprovalCard
                  key={doc.id}
                  document={doc}
                  onAction={handleAction}
                  onQuickSign={handleQuickSign}
                  onDelegate={handleDelegate}
                  selected={selectedDocs.has(doc.id)}
                  onToggleSelect={() => toggleSelectDoc(doc.id)}
                />
              ))}
            </AnimatePresence>
            {sortedPendingDocs.length === 0 && (
              <EmptyState
                variant="inbox"
                title="You're all caught up!"
                description="No documents require your attention right now. Great job staying on top of things!"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="signature" className="mt-4">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {needsSignature.map((doc) => (
                <ApprovalCard
                  key={doc.id}
                  document={doc}
                  onAction={handleAction}
                  onQuickSign={handleQuickSign}
                  onDelegate={handleDelegate}
                  selected={selectedDocs.has(doc.id)}
                  onToggleSelect={() => toggleSelectDoc(doc.id)}
                />
              ))}
            </AnimatePresence>
            {needsSignature.length === 0 && (
              <EmptyState
                variant="documents"
                title="No signatures needed"
                description="There are no documents waiting for your signature."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="approval" className="mt-4">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {needsApproval.map((doc) => (
                <ApprovalCard
                  key={doc.id}
                  document={doc}
                  onAction={handleAction}
                  onQuickSign={handleQuickSign}
                  onDelegate={handleDelegate}
                  selected={selectedDocs.has(doc.id)}
                  onToggleSelect={() => toggleSelectDoc(doc.id)}
                />
              ))}
            </AnimatePresence>
            {needsApproval.length === 0 && (
              <EmptyState
                variant="inbox"
                title="No approvals needed"
                description="There are no documents waiting for your approval."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <EmptyState
            variant="inbox"
            title="Completed items"
            description="Documents you have already actioned will appear here."
          />
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
        docTitle={rejectDocTitle}
      />

      {/* Quick Sign dialog */}
      <QuickSignDialog
        open={!!quickSignDoc}
        onClose={() => setQuickSignDoc(null)}
        document={quickSignDoc}
        onSign={handleQuickSignConfirm}
      />

      {/* Delegate dialog */}
      <DelegateDialog
        open={!!delegateDoc}
        onClose={() => setDelegateDoc(null)}
        document={delegateDoc}
        onDelegate={handleDelegateConfirm}
      />
    </div>
  );
}
