'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import {
  ArrowLeft,
  FileText,
  Send,
  Download,
  Trash2,
  User,
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
  Type,
  SquareCheck,
  RotateCcw,
  Highlighter,
  ListChecks,
  FileSearch,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

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
      {/* AI Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="gap-1.5"
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

      {/* Summary */}
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
                        <span className="text-primary mt-1 shrink-0">•</span>
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

      {/* Clauses */}
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
              <FileSearch className="h-4 w-4 text-blue-500" />
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
      {/* Quick prompts */}
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

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
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
          className="h-8 w-8 shrink-0"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ====== Activity Timeline ======
function ActivityTimeline({ document }: { document: Document }) {
  const timelineEvents = [
    { id: '1', action: 'Document created', user: document.owner, time: document.createdAt, icon: <FileText className="h-4 w-4 text-blue-500" />, color: 'bg-blue-500' },
    ...(document.status !== 'draft' ? [{ id: '2', action: 'Document sent for signature', user: document.sender || document.owner, time: document.createdAt, icon: <Send className="h-4 w-4 text-cyan-500" />, color: 'bg-cyan-500' }] : []),
    ...document.recipients
      .filter((r) => r.status === 'viewed' || r.status === 'signed')
      .map((r, i) => ({
        id: `view-${i}`,
        action: `${r.user.name} ${r.status === 'signed' ? 'signed' : 'viewed'} the document`,
        user: r.user,
        time: r.signedAt || document.updatedAt,
        icon: r.status === 'signed' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Eye className="h-4 w-4 text-slate-500" />,
        color: r.status === 'signed' ? 'bg-emerald-500' : 'bg-slate-400',
      })),
    ...(document.status === 'completed' ? [{ id: '3', action: 'Document completed', user: document.owner, time: document.completedAt || document.updatedAt, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, color: 'bg-emerald-500' }] : []),
    ...(document.status === 'rejected' ? [{ id: '4', action: 'Document rejected', user: document.recipients[0]?.user || document.owner, time: document.updatedAt, icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'bg-red-500' }] : []),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <ScrollArea className="h-96">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

        <div className="space-y-4">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="flex gap-3 relative">
              {/* Dot */}
              <div className={`shrink-0 w-6 h-6 rounded-full ${event.color} flex items-center justify-center ring-4 ring-background z-10`}>
                <div className="scale-75">{event.icon}</div>
              </div>

              <div className="flex-1 min-w-0 pb-2">
                <p className="text-sm font-medium">{event.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[6px] bg-primary/10 text-primary">
                      {event.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{event.user.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {timelineEvents.length === 0 && (
            <div className="text-center py-8">
              <Clock className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

// ====== Signing Panel ======
function SigningPanel({ document, docId }: { document: Document; docId: string }) {
  const queryClient = useQueryClient();
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const signMutation = useMutation({
    mutationFn: async (signatureData: string) => {
      return api.signDocument(docId, { signatureData, type: signMode === 'draw' ? 'drawn' : 'typed' });
    },
    onSuccess: () => {
      toast.success('Document signed successfully');
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
    },
    onError: () => {
      toast.error('Failed to sign document');
    },
  });

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  };

  const handleSign = () => {
    if (signMode === 'draw') {
      if (!hasDrawn) {
        toast.error('Please draw your signature');
        return;
      }
      const dataUrl = canvasRef.current?.toDataURL('image/png') || '';
      signMutation.mutate(dataUrl);
    } else {
      if (!typedSignature.trim()) {
        toast.error('Please type your signature');
        return;
      }
      signMutation.mutate(typedSignature);
    }
  };

  const canSign = document.status === 'sent' || document.status === 'viewed';

  if (!canSign) {
    return (
      <div className="text-center py-8">
        {document.status === 'completed' || document.status === 'signed' ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
            <p className="text-sm font-medium">Document Signed</p>
            <p className="text-xs text-muted-foreground mt-1">This document has been fully signed</p>
          </>
        ) : document.status === 'rejected' ? (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
            <p className="text-sm font-medium">Document Rejected</p>
            <p className="text-xs text-muted-foreground mt-1">This document has been rejected</p>
          </>
        ) : (
          <>
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Not Ready for Signing</p>
            <p className="text-xs text-muted-foreground mt-1">This document is still in draft</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-md">
        <Button
          variant={signMode === 'draw' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => setSignMode('draw')}
        >
          <PenLine className="mr-1.5 h-3 w-3" />
          Draw
        </Button>
        <Button
          variant={signMode === 'type' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => setSignMode('type')}
        >
          <Type className="mr-1.5 h-3 w-3" />
          Type
        </Button>
      </div>

      {signMode === 'draw' ? (
        <div className="space-y-2">
          <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            <canvas
              ref={canvasRef}
              width={320}
              height={120}
              className="w-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Draw your signature above</p>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={clearSignature}>
              <RotateCcw className="h-2.5 w-2.5" />
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="Type your full name"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            className="text-center"
          />
          {typedSignature && (
            <div className="border-2 border-dashed rounded-lg p-4 bg-white dark:bg-gray-800 text-center">
              <p className="text-2xl font-cursive italic text-gray-800 dark:text-gray-200">
                {typedSignature}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          className="flex-1 gap-1.5"
          onClick={handleSign}
          disabled={signMutation.isPending}
        >
          {signMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenLine className="h-3.5 w-3.5" />}
          {signMutation.isPending ? 'Signing...' : 'Sign Document'}
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 text-destructive hover:text-destructive"
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
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </Button>
      </div>
    </div>
  );
}

// ====== Comment Thread ======
function CommentThread({ docId, comments: initialComments }: { docId: string; comments: Comment[] }) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(initialComments);
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.addComment(docId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-comments', docId] });
      api.getComments(docId).then((res) => {
        if (res.success && res.data) setComments(res.data);
      });
    },
  });

  const handleSubmit = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
    setCommentText('');
  };

  // Group comments into threads (top-level + replies)
  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-4">
      <ScrollArea className="max-h-80">
        <div className="space-y-4 pr-2">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {/* Main comment */}
              <div className="flex gap-3">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {comment.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{comment.author.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm mt-0.5">{comment.content}</p>
                </div>
              </div>

              {/* Replies */}
              {getReplies(comment.id).map((reply) => (
                <div key={reply.id} className="flex gap-3 ml-8">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                      {reply.author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium">{reply.author.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-xs mt-0.5">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-6">
              <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No comments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start the discussion</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Add comment */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a comment... (use @mention to tag someone)"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="min-h-[50px] text-xs"
        />
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 self-end shrink-0"
          disabled={!commentText.trim() || addCommentMutation.isPending}
          onClick={handleSubmit}
        >
          {addCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ====== Main Document Detail Page ======
export function DocumentDetailPage() {
  const { navigate, pageParams } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('documents')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{document.title}</h1>
          <p className="text-sm text-muted-foreground">{document.fileName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={document.status} />
          <PriorityBadge priority={document.priority} />
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('document-editor', { id: document.id })}>
          <Edit3 className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Void
        </Button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* PDF placeholder */}
              <div className="bg-muted/30 rounded-lg border-2 border-dashed border-border h-[600px] flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm font-medium">PDF Preview</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {document.pageCount} page{document.pageCount !== 1 ? 's' : ''} · {formatFileSize(document.fileSize)}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Open Full Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('document-editor', { id: document.id })}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Open Editor
                  </Button>
                </div>

                {/* Field indicators on preview */}
                {document.fields.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {document.fields.map((field) => (
                      <Badge key={field.id} variant="outline" className="text-[10px] capitalize">
                        {field.type === 'signature' && <PenLine className="mr-1 h-3 w-3" />}
                        {field.type === 'date' && <Clock className="mr-1 h-3 w-3" />}
                        {field.type === 'text' && <Type className="mr-1 h-3 w-3" />}
                        {field.type === 'checkbox' && <SquareCheck className="mr-1 h-3 w-3" />}
                        {field.label}
                        {field.isCompleted && <CheckCircle2 className="ml-1 h-3 w-3 text-emerald-500" />}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="overview" className="text-[10px] px-1">Info</TabsTrigger>
              <TabsTrigger value="ai-summary" className="text-[10px] px-1">AI</TabsTrigger>
              <TabsTrigger value="activity" className="text-[10px] px-1">Activity</TabsTrigger>
              <TabsTrigger value="sign" className="text-[10px] px-1">Sign</TabsTrigger>
              <TabsTrigger value="comments" className="text-[10px] px-1">Chat</TabsTrigger>
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
                        <AvatarFallback className="text-[6px] bg-primary/10 text-primary">
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
                    <span>{document.folder || '—'}</span>
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
                      <div key={recipient.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {recipient.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{recipient.user.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{recipient.role}</p>
                        </div>
                        <StatusBadge status={recipient.status} />
                      </div>
                    ))}
                    {document.recipients.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">No recipients yet</p>
                    )}
                  </div>
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

            <TabsContent value="activity" className="mt-3">
              <ActivityTimeline document={document} />
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
                  <SigningPanel document={document} docId={docId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Comments & AI Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CommentThread docId={docId} comments={comments} />
                  <Separator className="my-3" />
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">AI Chat</span>
                  </div>
                  <AIChatPanel docId={docId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
