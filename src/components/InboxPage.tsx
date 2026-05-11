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
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { EmptyState } from './EmptyState';

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
      status: rec.status === 'signed' ? 'completed' : rec.status === 'declined' ? 'rejected' : 'pending' as const,
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

// Enhanced Approval Card
function ApprovalCard({
  document,
  onAction,
  selected,
  onToggleSelect,
}: {
  document: Document;
  onAction?: (action: string, docId: string) => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const pendingForUser = document.recipients.filter((r) => r.status === 'pending');
  const isUrgent = document.priority === 'urgent' || document.priority === 'high';
  const signedCount = document.signatures.filter(s => s.signedAt).length;
  const totalSigners = document.recipients.length || document.signatures.length;
  const progressPct = totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`card-hover-lift group ${isUrgent ? 'border-amber-200 dark:border-amber-900/50' : ''} ${selected ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Selection checkbox */}
            <div className="pt-1" onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
            </div>

            {/* Icon */}
            <div className={`rounded-lg p-2.5 shrink-0 ${isUrgent ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'}`}>
              {isUrgent ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
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

              {/* Status badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={document.status} />
                {pendingForUser.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {pendingForUser.length} pending action{pendingForUser.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* Signature progress */}
              {totalSigners > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={progressPct} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground">{signedCount}/{totalSigners} signed</span>
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

export function InboxPage() {
  const { navigate } = useAppStore();
  const queryClient = useQueryClient();
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string>('');
  const [rejectDocTitle, setRejectDocTitle] = useState('');

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

  // Tab-based categorization
  const needsSignature = pendingDocuments.filter((d) =>
    d.recipients.some(r => r.role === 'signer' && r.status === 'pending')
  );
  const needsApproval = pendingDocuments.filter((d) =>
    d.recipients.some(r => r.role === 'viewer' && r.status === 'pending') ||
    d.status === 'sent'
  );
  const completedDocs: Document[] = [];
  const urgentItems = pendingDocuments.filter((d) => d.priority === 'urgent' || d.priority === 'high');

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
          {/* Urgent section */}
          {urgentItems.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Urgent & High Priority</h2>
                <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800">
                  {urgentItems.length}
                </Badge>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {urgentItems.map((doc) => (
                    <ApprovalCard
                      key={doc.id}
                      document={doc}
                      onAction={handleAction}
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
              {pendingDocuments.map((doc) => (
                <ApprovalCard
                  key={doc.id}
                  document={doc}
                  onAction={handleAction}
                  selected={selectedDocs.has(doc.id)}
                  onToggleSelect={() => toggleSelectDoc(doc.id)}
                />
              ))}
            </AnimatePresence>
            {pendingDocuments.length === 0 && (
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
    </div>
  );
}
