'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { api, mockDocuments, formatFileSize } from '@/lib/api';
import type { Document, Comment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SignatureCanvas } from './SignatureCanvas';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import {
  ArrowLeft,
  FileText,
  Send,
  Download,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Sparkles,
  Bot,
  Loader2,
  Clock,
  PenLine,
  RotateCcw,
  ListChecks,
  FileSearch,
  Printer,
  Share2,
  History,
  Mail,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Award,
  GitCompare,
  PanelRightOpen,
  PanelRightClose,
  FileDown,
  FileSignature,
  File,
  Ban,
  LayoutTemplate,
  Reply,
  SmilePlus,
  AtSign,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const PDFViewer = dynamic(
  () => import('./PDFViewer').then((mod) => ({ default: mod.PDFViewer })),
  { ssr: false }
);

// ====== Mock data for enhanced comments ======
interface RichComment extends Comment {
  reactions?: { emoji: string; users: string[] }[];
}

const mockRichComments: RichComment[] = [
  {
    id: 'mc1',
    documentId: '1',
    author: { id: 'u1', email: 'sarah@acme.com', name: 'Sarah Chen', role: 'manager', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    content: 'I reviewed the contract terms on page 3. @Michael Park the liability clause needs your approval before we proceed.',
    mentions: [{ id: 'u2', email: 'michael@acme.com', name: 'Michael Park', role: 'admin', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' }],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reactions: [
      { emoji: '👍', users: ['Michael Park', 'Lisa Wang'] },
      { emoji: '✅', users: ['David Kim'] },
    ],
  },
  {
    id: 'mc2',
    documentId: '1',
    author: { id: 'u2', email: 'michael@acme.com', name: 'Michael Park', role: 'admin', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    content: '@Sarah Chen I agree. The indemnification section should be revised to cap at 2x the contract value.',
    parentId: 'mc1',
    mentions: [{ id: 'u1', email: 'sarah@acme.com', name: 'Sarah Chen', role: 'manager', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' }],
    createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    reactions: [{ emoji: '❤️', users: ['Sarah Chen'] }],
  },
  {
    id: 'mc3',
    documentId: '1',
    author: { id: 'u3', email: 'lisa@acme.com', name: 'Lisa Wang', role: 'signer', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    content: 'The payment schedule looks correct. Ready to sign from our end. @David Kim can you confirm the bank details?',
    mentions: [{ id: 'u4', email: 'david@acme.com', name: 'David Kim', role: 'signer', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' }],
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    reactions: [{ emoji: '👍', users: ['David Kim'] }],
  },
  {
    id: 'mc4',
    documentId: '1',
    author: { id: 'u4', email: 'david@acme.com', name: 'David Kim', role: 'signer', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    content: 'Bank details are confirmed in Appendix A. Everything looks good on my end.',
    parentId: 'mc3',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reactions: [],
  },
  {
    id: 'mc5',
    documentId: '1',
    author: { id: 'u1', email: 'sarah@acme.com', name: 'Sarah Chen', role: 'manager', isActive: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
    content: 'All revisions have been incorporated. This version is ready for final signature. 🎉',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    reactions: [
      { emoji: '❤️', users: ['Michael Park', 'Lisa Wang'] },
      { emoji: '✅', users: ['David Kim', 'Sarah Chen'] },
    ],
  },
];

// ====== Mock version history with more detail ======
interface VersionEntry {
  id: string;
  version: number;
  label: string;
  user: { id: string; name: string };
  time: string;
  changes: string;
  diff: string;
  diffType: 'add' | 'remove' | 'modify' | 'new';
  isCurrent: boolean;
}

const mockVersionHistory: VersionEntry[] = [
  { id: 'v5', version: 5, label: 'Final version', user: { id: 'u1', name: 'Sarah Chen' }, time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), changes: 'Incorporated all revision requests, updated payment terms', diff: '+3 pages', diffType: 'add', isCurrent: true },
  { id: 'v4', version: 4, label: 'Revised contract', user: { id: 'u2', name: 'Michael Park' }, time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), changes: 'Updated indemnification clause, added cap at 2x contract value', diff: '±2 clauses', diffType: 'modify', isCurrent: false },
  { id: 'v3', version: 3, label: 'Added signature fields', user: { id: 'u1', name: 'Sarah Chen' }, time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), changes: 'Placed signature and initial fields for all signers', diff: '+5 fields', diffType: 'add', isCurrent: false },
  { id: 'v2', version: 2, label: 'Sent for signature', user: { id: 'u1', name: 'Sarah Chen' }, time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), changes: 'Added 3 recipients, set signing order', diff: '+3 recipients', diffType: 'add', isCurrent: false },
  { id: 'v1', version: 1, label: 'Initial upload', user: { id: 'u1', name: 'Sarah Chen' }, time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), changes: 'Contract document uploaded', diff: 'New', diffType: 'new', isCurrent: false },
];

// ====== AI Summary Tab ======
function AISummaryTab({ docId }: { docId: string }) {
  const [summary, setSummary] = useState<string>('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [clauses, setClauses] = useState<{ type: string; text: string; page?: number }[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingClauses, setIsLoadingClauses] = useState(false);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [clausesExtracted, setClausesExtracted] = useState(false);

  const generateSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const res = await api.summarizeDocument({ documentId: docId });
      if (res.success && res.data) {
        setSummary(res.data.summary);
        setKeyPoints(res.data.keyPoints);
        setSummaryGenerated(true);
      } else {
        toast.error('Failed to generate summary');
      }
    } catch {
      toast.error('AI summary failed');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [docId]);

  const extractClauses = useCallback(async () => {
    setIsLoadingClauses(true);
    try {
      const res = await api.extractClauses({ documentId: docId });
      if (res.success && res.data) {
        setClauses(res.data.clauses);
        setClausesExtracted(true);
      } else {
        toast.error('Failed to extract clauses');
      }
    } catch {
      toast.error('Clause extraction failed');
    } finally {
      setIsLoadingClauses(false);
    }
  }, [docId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          onClick={generateSummary}
          disabled={isLoadingSummary}
        >
          {isLoadingSummary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isLoadingSummary ? 'Analyzing...' : 'Generate Summary'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={extractClauses}
          disabled={isLoadingClauses}
        >
          {isLoadingClauses ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSearch className="h-3.5 w-3.5" />}
          {isLoadingClauses ? 'Extracting...' : 'Extract Clauses'}
        </Button>
      </div>

      {isLoadingSummary && !summaryGenerated && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {summaryGenerated && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">{summary}</p>
            {keyPoints.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold mb-2">Key Points</p>
                  <ul className="space-y-1.5">
                    {keyPoints.map((point, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-emerald-600 mt-1 shrink-0">&#8226;</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {isLoadingClauses && !clausesExtracted && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      )}

      {clausesExtracted && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-teal-500" />
              Extracted Clauses
              <Badge variant="secondary" className="text-[10px]">{clauses.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {clauses.map((clause, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize">{clause.type}</Badge>
                      {clause.page && (
                        <span className="text-[10px] text-muted-foreground">Page {clause.page}</span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{clause.text}</p>
                  </div>
                ))}
                {clauses.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No clauses found</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {!summaryGenerated && !clausesExtracted && !isLoadingSummary && !isLoadingClauses && (
        <div className="text-center py-8">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">AI Analysis</p>
          <p className="text-xs text-muted-foreground mt-1">Generate a summary or extract legal clauses from this document</p>
        </div>
      )}
    </div>
  );
}

// ====== AI Chat Panel ======
function AIChatPanel({ docId }: { docId: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: 'Summarize this document', icon: Sparkles },
    { label: 'Extract key clauses', icon: ListChecks },
    { label: 'What are the important dates?', icon: Clock },
    { label: 'What are the payment terms?', icon: FileText },
  ];

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, content: message.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10);
      const res = await api.aiChat({
        message: message.trim(),
        documentId: docId,
        history,
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data!.response }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'I apologize, but I was unable to process your request. Please try again.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [docId, isLoading, messages]);

  return (
    <div className="flex flex-col h-[400px]">
      {messages.length === 0 && (
        <div className="p-3 border-b">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Prompts</p>
          <div className="grid grid-cols-2 gap-1.5">
            {quickPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <Button
                  key={prompt.label}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] justify-start gap-1.5"
                  onClick={() => sendMessage(prompt.label)}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{prompt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="shrink-0 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="shrink-0 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t flex gap-2">
        <Input
          placeholder="Ask about this document..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-8 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          disabled={isLoading}
        />
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ====== Document Lifecycle Visualization ======
function DocumentLifecycle({ document }: { document: Document }) {
  const stages = [
    { key: 'draft', label: 'Draft', icon: FileText },
    { key: 'sent', label: 'Sent', icon: Send },
    { key: 'viewed', label: 'Viewed', icon: Eye },
    { key: 'signed', label: 'Signed', icon: PenLine },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  const statusOrder: Record<string, number> = {
    draft: 0, sent: 1, viewed: 2, signed: 3, completed: 4,
    rejected: 3, expired: 1, voided: 0,
  };
  const currentIndex = statusOrder[document.status] ?? 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {stages.map((stage, i) => {
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="flex items-center shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isCurrent
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-muted text-muted-foreground border border-border'
                    }`}
                    animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                    transition={isCurrent ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </motion.div>
                  <span className={`text-[9px] font-medium whitespace-nowrap ${
                    isCompleted ? 'text-emerald-600 dark:text-emerald-400'
                      : isCurrent ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`}>{stage.label}</span>
                </div>
                {i < stages.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 mb-4 rounded transition-all duration-500 ${
                    isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-emerald-500/50' : 'bg-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        {document.status === 'rejected' && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            <span className="font-medium">Document was rejected</span>
          </div>
        )}
        {document.status === 'expired' && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="font-medium">Document has expired</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ====== Document Timeline ======
function DocumentTimeline({ document }: { document: Document }) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const eventColors: Record<string, { bg: string; text: string }> = {
    created: { bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400' },
    sent: { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' },
    viewed: { bg: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400' },
    signed: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    approved: { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
    rejected: { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
    completed: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    expired: { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    shared: { bg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400' },
  };

  const timelineEvents = [
    { id: '1', type: 'created', action: 'Document created', user: document.owner, time: document.createdAt, icon: FileText, detail: `Created by ${document.owner.name} with ${document.pageCount} page(s)` },
    ...(document.status !== 'draft' ? [{ id: '2', type: 'sent', action: 'Document sent for signature', user: document.sender || document.owner, time: document.createdAt, icon: Send, detail: `Sent to ${document.recipients.length} recipient(s) for review and signature` }] : []),
    ...document.recipients
      .filter((r) => r.status === 'viewed' || r.status === 'signed')
      .map((r, i) => ({
        id: `view-${i}`,
        type: r.status === 'signed' ? 'signed' : 'viewed',
        action: `${r.user.name} ${r.status === 'signed' ? 'signed' : 'viewed'} the document`,
        user: r.user,
        time: r.signedAt || document.updatedAt,
        icon: r.status === 'signed' ? CheckCircle2 : Eye,
        detail: r.status === 'signed' ? `Signature captured electronically and verified` : `Document opened and reviewed by ${r.user.name}`,
      })),
    ...(document.status === 'completed' ? [{ id: '3', type: 'completed', action: 'Document completed', user: document.owner, time: document.completedAt || document.updatedAt, icon: CheckCircle2, detail: 'All required signatures collected. Document is now legally binding.' }] : []),
    ...(document.status === 'rejected' ? [{ id: '4', type: 'rejected', action: 'Document rejected', user: document.recipients[0]?.user || document.owner, time: document.updatedAt, icon: XCircle, detail: 'Document was rejected and requires revision before resending.' }] : []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const statusOrder: Record<string, number> = { draft: 0, sent: 1, viewed: 2, signed: 3, completed: 4 };
  const currentStageIndex = statusOrder[document.status] ?? 0;
  const lifecycleProgress = Math.round((currentStageIndex / 4) * 100);

  const getEstimatedTime = () => {
    if (document.status === 'completed') return 'Completed';
    if (document.status === 'rejected' || document.status === 'expired' || document.status === 'voided') return '\u2014';
    const created = new Date(document.createdAt).getTime();
    const now = Date.now();
    const elapsed = now - created;
    const remainingStages = 4 - currentStageIndex;
    if (remainingStages <= 0 || currentStageIndex === 0) return '~2-3 days';
    const avgPerStage = elapsed / currentStageIndex;
    const estMs = avgPerStage * remainingStages;
    const estDays = Math.ceil(estMs / (1000 * 60 * 60 * 24));
    if (estDays <= 0) return '< 1 day';
    if (estDays === 1) return '~1 day';
    return `~${estDays} days`;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Document Progress</span>
          <span className="font-medium">{lifecycleProgress}%</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${lifecycleProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          {document.status !== 'completed' && document.status !== 'rejected' && document.status !== 'expired' && document.status !== 'voided' && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-background shadow-md"
              style={{ left: `calc(${lifecycleProgress}% - 6px)` }}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Est. time remaining: <span className="font-medium text-foreground">{getEstimatedTime()}</span></span>
          <span>{formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      <Separator />

      <ScrollArea className="h-80">
        <div className="relative">
          <div className="space-y-0">
            <AnimatePresence>
              {timelineEvents.map((event, index) => {
                const colors = eventColors[event.type] || eventColors.created;
                const Icon = event.icon;
                const isExpanded = expandedEvent === event.id;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className="flex gap-3 relative"
                  >
                    {index < timelineEvents.length - 1 && (
                      <motion.div
                        className="absolute left-[13px] top-8 bottom-0 w-0.5"
                        style={{ background: 'linear-gradient(to bottom, var(--border), transparent)' }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                      />
                    )}

                    <div className={`shrink-0 w-7 h-7 rounded-full ${colors.bg} flex items-center justify-center ring-4 ring-background z-10 shadow-sm`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 pb-4">
                      <div
                        className="p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{event.action}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[7px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              {event.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{event.user.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
                          </span>
                        </div>

                        <AnimatePresence>
                          {isExpanded && event.detail && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-xs text-muted-foreground leading-relaxed">{event.detail}</p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground">{format(new Date(event.time), 'MMM d, yyyy h:mm a')}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {timelineEvents.length === 0 && (
              <div className="text-center py-8">
                <Clock className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ====== Enhanced Version History ======
function VersionHistory({ document, onCompare }: { document: Document; onCompare: () => void }) {
  const [viewingVersion, setViewingVersion] = useState<string | null>(null);

  const versions: VersionEntry[] = mockVersionHistory;

  const diffColors: Record<string, string> = {
    add: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    remove: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    modify: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    new: 'text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
  };

  return (
    <div className="space-y-0 relative">
      {versions.map((v, i) => (
        <motion.div
          key={v.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.2 }}
          className="flex items-start gap-3 group relative pb-3"
        >
          {i < versions.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-emerald-300 dark:from-emerald-700 to-transparent" />
          )}

          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ring-3 ring-background ${
            v.isCurrent
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
              : 'bg-muted text-muted-foreground'
          }`}>
            v{v.version}
          </div>

          <div className="flex-1 min-w-0">
            <div className={`p-2.5 rounded-lg border transition-colors ${
              viewingVersion === v.id ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' : 'bg-card hover:bg-accent/20'
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">{v.label}</p>
                {v.isCurrent && (
                  <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                    Current
                  </Badge>
                )}
                <Badge variant="outline" className={`text-[8px] ml-auto ${diffColors[v.diffType]}`}>
                  {v.diff}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{v.changes}</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[6px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    {v.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground">
                  {v.user.name} · {formatDistanceToNow(new Date(v.time), { addSuffix: true })}
                </span>
              </div>
              {/* Version action buttons */}
              {!v.isCurrent && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 px-2"
                    onClick={() => {
                      setViewingVersion(viewingVersion === v.id ? null : v.id);
                      toast.info(`Viewing version ${v.version}`);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 px-2 text-amber-600 hover:text-amber-700"
                    onClick={() => {
                      toast.success(`Version ${v.version} restored`);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Compare with previous version button */}
      {versions.length > 1 && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={onCompare}
          >
            <GitCompare className="h-3.5 w-3.5" />
            Compare with Previous Version
          </Button>
        </div>
      )}
    </div>
  );
}

// ====== Document Comparison Dialog ======
function CompareDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-emerald-600" />
            Version Comparison
          </DialogTitle>
          <DialogDescription>
            Compare the current version with the previous version
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 min-h-[400px]">
          {/* Previous Version */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <History className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Previous Version (v4)</span>
            </div>
            <div className="flex-1 rounded-lg border bg-muted/30 p-6 flex items-center justify-center min-h-[350px]">
              <div className="text-center space-y-3">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Previous version preview</p>
                <p className="text-xs text-muted-foreground">PDF content would render here</p>
                <div className="space-y-1.5 text-left max-w-[250px] mx-auto">
                  <div className="p-2 rounded border bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-300">
                    <span className="line-through">Indemnification: Unlimited liability</span>
                  </div>
                  <div className="p-2 rounded border bg-red-50 dark:bg-red-950/20 text-xs text-red-700 dark:text-red-300">
                    <span className="line-through">Payment: Net 30 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Version */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Current Version (v5)</span>
              <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 ml-auto">Latest</Badge>
            </div>
            <div className="flex-1 rounded-lg border bg-muted/30 p-6 flex items-center justify-center min-h-[350px]">
              <div className="text-center space-y-3">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Current version preview</p>
                <p className="text-xs text-muted-foreground">PDF content would render here</p>
                <div className="space-y-1.5 text-left max-w-[250px] mx-auto">
                  <div className="p-2 rounded border bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-300">
                    <span>Indemnification: Capped at 2x contract value ✓</span>
                  </div>
                  <div className="p-2 rounded border bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-300">
                    <span>Payment: Net 45 days ✓</span>
                  </div>
                  <div className="p-2 rounded border bg-cyan-50 dark:bg-cyan-950/20 text-xs text-cyan-700 dark:text-cyan-300">
                    <span>+ Added: Force majeure clause</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800" /> Removed</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800" /> Added</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-100 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800" /> Modified</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close Comparison
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ====== Share Dialog ======
function ShareDialog({ open, onOpenChange, document }: { open: boolean; onOpenChange: (open: boolean) => void; document: Document }) {
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareRole, setShareRole] = useState('viewer');
  const [copied, setCopied] = useState(false);
  const [shareLink] = useState(`https://docsign.app/d/${document.id}?share=token`);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }, [shareLink]);

  const handleShareByEmail = useCallback(() => {
    if (!shareEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    toast.success(`Shared with ${shareEmail}`);
    setShareEmail('');
    setShareMessage('');
  }, [shareEmail]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-emerald-600" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Share &quot;{document.title}&quot; with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Share Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="text-xs h-8"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 gap-1.5"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium">Share by Email</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="text-xs h-8"
                type="email"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                onClick={() => setShareRole(shareRole === 'viewer' ? 'signer' : 'viewer')}
              >
                {shareRole === 'viewer' ? 'Viewer' : 'Signer'}
              </Button>
            </div>
            <Textarea
              placeholder="Add a message (optional)"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="text-xs min-h-[60px]"
            />
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              onClick={handleShareByEmail}
              disabled={!shareEmail.trim()}
            >
              <Mail className="h-3.5 w-3.5" />
              Send Invitation
            </Button>
          </div>

          <Separator />

          {document.recipients.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Current Recipients</Label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {document.recipients.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[7px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        {r.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs flex-1 truncate">{r.user.name}</span>
                    <Badge variant="outline" className="text-[9px] capitalize">{r.role}</Badge>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ====== Signing Progress Indicator ======
function SigningProgress({ document }: { document: Document }) {
  const total = document.recipients.filter(r => r.role === 'signer').length;
  const signed = document.recipients.filter(r => r.role === 'signer' && r.status === 'signed').length;
  const percentage = total > 0 ? Math.round((signed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Signing Progress</span>
        <span className="font-medium">{signed}/{total} completed</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="flex items-center gap-1 flex-wrap">
        {document.recipients.filter(r => r.role === 'signer').map((r, i) => (
          <div key={r.id} className="flex items-center gap-1">
            {i > 0 && <div className="w-4 h-px bg-border" />}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] ${
              r.status === 'signed'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : r.status === 'declined'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}>
              {r.status === 'signed' ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : r.status === 'declined' ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">{r.user.name.split(' ')[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====== Enhanced Comment with Reactions ======
function CommentItem({ comment, allComments, onReply, depth = 0 }: {
  comment: RichComment;
  allComments: RichComment[];
  onReply: (parentId: string, content: string) => void;
  depth?: number;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const replies = allComments.filter((c) => c.parentId === comment.id);

  // Highlight @mentions in content
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+\s\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <AtSign className="h-2.5 w-2.5" />
            {part.slice(1)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const reactionEmojis = ['👍', '❤️', '✅'];

  return (
    <div className={depth > 0 ? 'ml-8' : ''}>
      <div className="flex gap-2.5">
        <Avatar className={`shrink-0 ${depth > 0 ? 'h-6 w-6' : 'h-7 w-7'}`}>
          <AvatarFallback className={`bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ${depth > 0 ? 'text-[8px]' : 'text-[10px]'}`}>
            {comment.author.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${depth > 0 ? 'text-xs' : 'text-sm'}`}>{comment.author.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className={`mt-0.5 ${depth > 0 ? 'text-xs' : 'text-sm'} leading-relaxed`}>
            {renderContent(comment.content)}
          </div>

          {/* Reactions */}
          {comment.reactions && comment.reactions.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {comment.reactions.map((reaction, i) => (
                <button
                  key={i}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border bg-muted/50 hover:bg-muted transition-colors text-[10px]"
                  onClick={() => toast.info(`You reacted with ${reaction.emoji}`)}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-muted-foreground">{reaction.users.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-1.5 relative">
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
            <div className="relative">
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                onClick={() => setShowReactions(!showReactions)}
              >
                <SmilePlus className="h-3 w-3" />
                React
              </button>
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    className="absolute bottom-full left-0 mb-1 flex items-center gap-1 p-1.5 bg-popover border rounded-lg shadow-lg z-20"
                  >
                    {reactionEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-sm"
                        onClick={() => {
                          toast.success(`Reacted with ${emoji}`);
                          setShowReactions(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-2">
                  <Textarea
                    placeholder={`Reply to ${comment.author.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[40px] text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        onReply(comment.id, replyText);
                        setReplyText('');
                        setShowReplyInput(false);
                      }
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 h-7 text-[10px]"
                      disabled={!replyText.trim()}
                      onClick={() => {
                        onReply(comment.id, replyText);
                        setReplyText('');
                        setShowReplyInput(false);
                      }}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[10px]"
                      onClick={() => setShowReplyInput(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              allComments={allComments}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ====== Enhanced Comments Panel ======
function CommentsPanel({ docId, comments: initialComments }: { docId: string; comments: Comment[] }) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<RichComment[]>(mockRichComments);
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.addComment(docId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-comments', docId] });
      api.getComments(docId).then((res) => {
        if (res.success && res.data) {
          // Merge with mock reactions for display
          setComments(prev => [...prev]);
        }
      });
    },
  });

  const handleSubmit = () => {
    if (!commentText.trim()) return;

    // Add locally for instant feedback
    const newComment: RichComment = {
      id: `new-${Date.now()}`,
      documentId: docId,
      author: { id: 'current-user', email: 'you@acme.com', name: 'You', role: 'signer', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    };
    setComments(prev => [...prev, newComment]);
    setCommentText('');

    addCommentMutation.mutate(commentText.trim());
  };

  const handleReply = (parentId: string, content: string) => {
    if (!content.trim()) return;
    const parentComment = comments.find(c => c.id === parentId);
    const newReply: RichComment = {
      id: `reply-${Date.now()}`,
      documentId: docId,
      parentId,
      author: { id: 'current-user', email: 'you@acme.com', name: 'You', role: 'signer', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
      mentions: parentComment ? [{ id: parentComment.author.id, email: parentComment.author.email, name: parentComment.author.name, role: parentComment.author.role, isActive: true, createdAt: '', updatedAt: '' }] : undefined,
    };
    setComments(prev => [...prev, newReply]);
    toast.success('Reply posted');
  };

  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-2 p-1">
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              allComments={comments}
              onReply={handleReply}
            />
          ))}
          {comments.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">No comments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start the discussion</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="pt-3 mt-auto border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment... (use @name to mention)"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[44px] text-xs resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 self-end shrink-0"
            disabled={!commentText.trim() || addCommentMutation.isPending}
            onClick={handleSubmit}
          >
            {addCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Press ⌘+Enter to post</p>
      </div>
    </div>
  );
}

// ====== Activity Panel for Right Sidebar ======
function ActivityPanel({ document }: { document: Document }) {
  const activityTypes: Record<string, { bg: string; icon: typeof FileText; label: string }> = {
    created: { bg: 'bg-teal-500', icon: FileText, label: 'Created' },
    sent: { bg: 'bg-cyan-500', icon: Send, label: 'Sent' },
    viewed: { bg: 'bg-slate-400', icon: Eye, label: 'Viewed' },
    signed: { bg: 'bg-emerald-500', icon: PenLine, label: 'Signed' },
    approved: { bg: 'bg-green-500', icon: CheckCircle2, label: 'Approved' },
    rejected: { bg: 'bg-red-500', icon: XCircle, label: 'Rejected' },
    shared: { bg: 'bg-violet-500', icon: Share2, label: 'Shared' },
    completed: { bg: 'bg-emerald-500', icon: Award, label: 'Completed' },
  };

  // Build activity items from document data + mock extras
  const activities = [
    { id: 'a1', type: 'created', user: document.owner, time: document.createdAt, detail: `Created document with ${document.pageCount} pages` },
    ...(document.status !== 'draft' ? [{ id: 'a2', type: 'sent', user: document.sender || document.owner, time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), detail: `Sent to ${document.recipients.length} recipients` }] : []),
    { id: 'a3', type: 'viewed', user: document.recipients[0]?.user || document.owner, time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), detail: 'Opened and reviewed the document' },
    ...(document.status === 'signed' || document.status === 'completed' ? [{ id: 'a4', type: 'signed', user: document.recipients[0]?.user || document.owner, time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), detail: 'Applied electronic signature' }] : []),
    { id: 'a5', type: 'shared', user: document.owner, time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), detail: 'Shared with legal team for review' },
    ...(document.status === 'completed' ? [{ id: 'a6', type: 'completed', user: document.owner, time: document.completedAt || document.updatedAt, detail: 'All signatures collected' }] : []),
  ];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1">
        {activities.map((activity, i) => {
          const config = activityTypes[activity.type] || activityTypes.created;
          const Icon = config.icon;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/30 transition-colors"
            >
              <div className={`shrink-0 w-6 h-6 rounded-full ${config.bg} flex items-center justify-center mt-0.5`}>
                <Icon className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[5px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate">{activity.user.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{activity.detail}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ====== Void Document Dialog ======
function VoidDocumentDialog({ open, onOpenChange, document }: { open: boolean; onOpenChange: (open: boolean) => void; document: Document }) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="h-4 w-4" />
            Void Document
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The document &quot;{document.title}&quot; will be permanently voided.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Reason for voiding</Label>
            <Textarea
              placeholder="Enter reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs min-h-[80px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              className="gap-1.5"
              disabled={!reason.trim()}
              onClick={() => {
                toast.success('Document voided successfully');
                onOpenChange(false);
                setReason('');
              }}
            >
              <Ban className="h-4 w-4" />
              Void Document
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ====== Main Document Detail Page ======
export function DocumentDetailPage() {
  const { navigate, pageParams, user } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState('activity');
  const [mobileViewTab, setMobileViewTab] = useState('viewer');

  const docId = pageParams?.id as string;

  // Fetch document from API
  const { data: documentData, isLoading } = useQuery({
    queryKey: ['document', docId],
    queryFn: async () => {
      if (!docId) return null;
      const res = await api.getDocument(docId);
      if (res.success && res.data) return res.data;
      return null;
    },
    enabled: !!docId,
    staleTime: 30 * 1000,
  });

  // Fetch comments
  const { data: commentsData } = useQuery({
    queryKey: ['document-comments', docId],
    queryFn: async () => {
      if (!docId) return [];
      const res = await api.getComments(docId);
      if (res.success && res.data) return res.data;
      return [];
    },
    enabled: !!docId,
  });

  const document: Document = documentData || mockDocuments.find((d) => d.id === docId) || mockDocuments[0];
  const comments: Comment[] = commentsData || [];

  // Sign mutation
  const signMutation = useMutation({
    mutationFn: async ({ signatureData, type }: { signatureData: string; type: 'drawn' | 'typed' | 'uploaded' }) => {
      return api.signDocument(docId, { signatureData, type });
    },
    onSuccess: () => {
      toast.success('Document signed successfully');
      setSignDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
    },
    onError: () => {
      toast.error('Failed to sign document');
    },
  });

  const queryClient = useQueryClient();

  const handleSign = useCallback((signatureData: string, type: 'drawn' | 'typed' | 'uploaded') => {
    signMutation.mutate({ signatureData, type });
  }, [signMutation]);

  const handlePrint = useCallback(() => {
    window.print();
    toast.success('Print dialog opened');
  }, []);

  const handleDownload = useCallback((format: string) => {
    if (format === 'pdf') {
      toast.success('Downloading PDF...');
    } else if (format === 'original') {
      toast.success('Downloading original file...');
    } else if (format === 'signed') {
      toast.success('Downloading signed copy...');
    }
    const anchor = window.document.createElement('a');
    anchor.href = document.fileUrl || '#';
    anchor.download = document.fileName || 'document.pdf';
    anchor.click();
  }, [document]);

  const canSign = document.status === 'sent' || document.status === 'viewed';
  const canVoid = document.status === 'sent' || document.status === 'viewed' || document.status === 'draft';

  // Signature areas for PDF viewer
  const signatureAreas = document.fields
    .filter(f => f.type === 'signature')
    .map(f => ({ x: f.x, y: f.y, width: f.width, height: f.height, label: f.label }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <div className="flex-1">
            <Skeleton className="h-6 w-64 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96" />
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  // ====== STICKY HEADER ======
  const stickyHeader = (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b pb-3 pt-1 -mx-1 px-1">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('documents')} className="shrink-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{document.title}</h1>
          <p className="text-xs text-muted-foreground truncate">{document.fileName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <StatusBadge status={document.status} />
          <PriorityBadge priority={document.priority} />
        </div>
      </div>

      {/* Enhanced Actions Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {canSign && (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
            onClick={() => setSignDialogOpen(true)}
          >
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">Sign</span>
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('document-editor', { id: document.id })}>
          <Edit3 className="h-4 w-4" />
          <span className="hidden sm:inline">Edit</span>
        </Button>

        {/* Download with format options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-[10px]">Download Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDownload('pdf')} className="gap-2">
              <FileDown className="h-4 w-4 text-red-500" />
              PDF Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('original')} className="gap-2">
              <File className="h-4 w-4 text-slate-500" />
              Original Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('signed')} className="gap-2">
              <FileSignature className="h-4 w-4 text-emerald-500" />
              Signed Copy
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print document</TooltipContent>
        </Tooltip>

        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShareDialogOpen(true)}>
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        {/* Create Template from Document */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => toast.success('Template created from document')}
            >
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden md:inline">Template</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create template from document</TooltipContent>
        </Tooltip>

        {/* Void Document */}
        {canVoid && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => setVoidDialogOpen(true)}
          >
            <Ban className="h-4 w-4" />
            <span className="hidden md:inline">Void</span>
          </Button>
        )}

        {/* Toggle right panel */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 ml-auto"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
            >
              {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{rightPanelOpen ? 'Hide panel' : 'Show panel'}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  // ====== LEFT SIDEBAR: Document Info ======
  const leftSidebar = (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview" className="text-[10px] px-1">Info</TabsTrigger>
          <TabsTrigger value="ai-summary" className="text-[10px] px-1">AI</TabsTrigger>
          <TabsTrigger value="sign" className="text-[10px] px-1">Sign</TabsTrigger>
          <TabsTrigger value="chat" className="text-[10px] px-1">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3 space-y-3">
          {/* Document info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Document Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner</span>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[6px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      {document.owner.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{document.owner.name}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</span>
              </div>
              {document.expiresAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="text-amber-600">{format(new Date(document.expiresAt), 'MMM d, yyyy')}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Folder</span>
                <span>{document.folder || '\u2014'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span>{formatFileSize(document.fileSize)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pages</span>
                <span>{document.pageCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs">Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {document.recipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        {recipient.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{recipient.user.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{recipient.role}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {recipient.status === 'signed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                      {recipient.status === 'pending' && <Clock className="h-3.5 w-3.5 text-amber-500" />}
                      {recipient.status === 'declined' && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                      {recipient.status === 'viewed' && <Eye className="h-3.5 w-3.5 text-slate-500" />}
                      <span className="text-[10px] capitalize text-muted-foreground">{recipient.status}</span>
                    </div>
                  </div>
                ))}
                {document.recipients.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No recipients yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Version History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VersionHistory document={document} onCompare={() => setCompareDialogOpen(true)} />
            </CardContent>
          </Card>

          {/* Tags */}
          {document.tags.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {document.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-summary" className="mt-3">
          <AISummaryTab docId={docId} />
        </TabsContent>

        <TabsContent value="sign" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <PenLine className="h-3.5 w-3.5" />
                Sign Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canSign ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Review the document and add your signature when ready.
                  </p>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                    onClick={() => setSignDialogOpen(true)}
                  >
                    <PenLine className="h-4 w-4" />
                    Open Signature Pad
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) {
                        api.rejectDocument(docId, reason).then(() => {
                          toast.success('Document rejected');
                          queryClient.invalidateQueries({ queryKey: ['document', docId] });
                        });
                      }
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Document
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {document.status === 'completed'
                      ? 'This document has been fully signed'
                      : document.status === 'draft'
                        ? 'This document needs to be sent before signing'
                        : 'Signing is not available for this document'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                AI Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AIChatPanel docId={docId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // ====== RIGHT PANEL: Activity / Comments ======
  const rightPanel = (
    <div className="flex flex-col h-full">
      <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex flex-col h-full">
        <TabsList className="w-full grid grid-cols-2 shrink-0">
          <TabsTrigger value="activity" className="text-[10px] gap-1">
            <Activity className="h-3 w-3" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-[10px] gap-1">
            <MessageSquare className="h-3 w-3" />
            Comments
            {mockRichComments.length > 0 && (
              <Badge variant="secondary" className="text-[8px] ml-1 h-4 px-1">
                {mockRichComments.filter(c => !c.parentId).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-2 flex-1 overflow-hidden">
          <ActivityPanel document={document} />
        </TabsContent>

        <TabsContent value="comments" className="mt-2 flex-1 overflow-hidden flex flex-col">
          <CommentsPanel docId={docId} comments={comments} />
        </TabsContent>
      </Tabs>
    </div>
  );

  // ====== MOBILE VIEW ======
  const mobileView = (
    <div className="space-y-4 lg:hidden">
      {/* Mobile tab bar */}
      <Tabs value={mobileViewTab} onValueChange={setMobileViewTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="info" className="text-[10px]">Info</TabsTrigger>
          <TabsTrigger value="viewer" className="text-[10px]">Viewer</TabsTrigger>
          <TabsTrigger value="comments" className="text-[10px] gap-1">
            Comments
            <Badge variant="secondary" className="text-[8px] h-4 px-1">
              {mockRichComments.filter(c => !c.parentId).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-3">
          {leftSidebar}
        </TabsContent>

        <TabsContent value="viewer" className="mt-3">
          <PDFViewer
            fileUrl={document.fileUrl}
            fileName={document.fileName}
            title={document.title}
            pageCount={document.pageCount}
            fileSize={document.fileSize}
            isPlaceholder={!document.fileUrl || document.fileUrl === '#' || document.fileUrl.startsWith('/uploads/')}
            signatureAreas={signatureAreas}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-3">
          <Card className="h-[500px]">
            <CardContent className="p-4 h-full">
              {rightPanel}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // ====== DESKTOP VIEW: 3-column resizable layout ======
  const desktopView = (
    <div className="hidden lg:block">
      <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
        {/* Left sidebar - Document Info */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <ScrollArea className="h-[calc(100vh-260px)]">
            <div className="p-4">
              {leftSidebar}
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center - PDF Viewer */}
        <ResizablePanel defaultSize={rightPanelOpen ? 45 : 65} minSize={35}>
          <div className="p-4 h-full">
            <PDFViewer
              fileUrl={document.fileUrl}
              fileName={document.fileName}
              title={document.title}
              pageCount={document.pageCount}
              fileSize={document.fileSize}
              isPlaceholder={!document.fileUrl || document.fileUrl === '#' || document.fileUrl.startsWith('/uploads/')}
              signatureAreas={signatureAreas}
            />
          </div>
        </ResizablePanel>

        {/* Right panel - Activity / Comments (collapsible) */}
        {rightPanelOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
              <div className="p-4 h-full">
                {rightPanel}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );

  return (
    <div className="space-y-4">
      {stickyHeader}

      {/* Document Lifecycle visualization */}
      <DocumentLifecycle document={document} />

      {/* Signing progress */}
      {document.recipients.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <SigningProgress document={document} />
          </CardContent>
        </Card>
      )}

      {/* Main content - Responsive */}
      {mobileView}
      {desktopView}

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-emerald-600" />
              Sign Document
            </DialogTitle>
            <DialogDescription>
              Add your signature to &quot;{document.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <SignatureCanvas
            onApply={handleSign}
            onCancel={() => setSignDialogOpen(false)}
            signerName={user?.name || ''}
            isSubmitting={signMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        document={document}
      />

      {/* Compare Dialog */}
      <CompareDialog
        open={compareDialogOpen}
        onOpenChange={setCompareDialogOpen}
      />

      {/* Void Document Dialog */}
      <VoidDocumentDialog
        open={voidDialogOpen}
        onOpenChange={setVoidDialogOpen}
        document={document}
      />
    </div>
  );
}
