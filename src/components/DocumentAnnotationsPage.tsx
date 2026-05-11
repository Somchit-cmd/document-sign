'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Pen,
  Highlighter,
  Type,
  StickyNote,
  Square,
  Circle,
  ArrowRight,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  CheckCircle2,
  CircleDot,
  Minus,
  Plus,
  Hand,
  MousePointer2,
  Reply,
  X,
  Clock,
  User,
  Palette,
  Eye,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type AnnotationType = 'pen' | 'highlight' | 'text' | 'sticky-note' | 'rectangle' | 'oval' | 'arrow' | 'eraser';
type AnnotationStatus = 'open' | 'resolved';

interface AnnotationAuthor {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface AnnotationReply {
  id: string;
  authorId: string;
  text: string;
  createdAt: Date;
}

interface Annotation {
  id: string;
  type: AnnotationType;
  authorId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  strokeWidth: number;
  text: string;
  status: AnnotationStatus;
  createdAt: Date;
  replies: AnnotationReply[];
  points?: { x: number; y: number }[];
}

// ============================================================
// Mock Data
// ============================================================

const AUTHORS: AnnotationAuthor[] = [
  { id: 'a1', name: 'Sarah Chen', avatar: 'SC', color: '#10b981' },
  { id: 'a2', name: 'Michael Torres', avatar: 'MT', color: '#f59e0b' },
  { id: 'a3', name: 'Elena Kowalski', avatar: 'EK', color: '#8b5cf6' },
  { id: 'a4', name: 'James Park', avatar: 'JP', color: '#06b6d4' },
];

const INITIAL_ANNOTATIONS: Annotation[] = [
  {
    id: 'ann-1',
    type: 'pen',
    authorId: 'a1',
    x: 80,
    y: 120,
    width: 120,
    height: 40,
    color: '#ef4444',
    opacity: 1,
    strokeWidth: 2,
    text: '',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 2),
    replies: [
      { id: 'r1', authorId: 'a2', text: 'Please check this clause carefully', createdAt: new Date(Date.now() - 3600000) },
    ],
    points: [
      { x: 80, y: 120 }, { x: 100, y: 115 }, { x: 130, y: 125 },
      { x: 160, y: 118 }, { x: 190, y: 130 }, { x: 200, y: 125 },
    ],
  },
  {
    id: 'ann-2',
    type: 'highlight',
    authorId: 'a2',
    x: 60,
    y: 200,
    width: 280,
    height: 24,
    color: '#fbbf24',
    opacity: 0.35,
    strokeWidth: 0,
    text: 'Important liability clause',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 5),
    replies: [],
  },
  {
    id: 'ann-3',
    type: 'text',
    authorId: 'a1',
    x: 60,
    y: 300,
    width: 200,
    height: 20,
    color: '#10b981',
    opacity: 1,
    strokeWidth: 0,
    text: 'Needs legal review before signing',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 8),
    replies: [
      { id: 'r2', authorId: 'a3', text: 'I\'ll review by EOD', createdAt: new Date(Date.now() - 3600000 * 6) },
      { id: 'r3', authorId: 'a1', text: 'Thanks Elena!', createdAt: new Date(Date.now() - 3600000 * 5) },
    ],
  },
  {
    id: 'ann-4',
    type: 'sticky-note',
    authorId: 'a3',
    x: 340,
    y: 160,
    width: 140,
    height: 100,
    color: '#fbbf24',
    opacity: 0.9,
    strokeWidth: 0,
    text: 'Check termination clause - seems one-sided. Need to negotiate better terms.',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3600000 * 24),
    replies: [
      { id: 'r4', authorId: 'a2', text: 'Agreed, let\'s push back on this', createdAt: new Date(Date.now() - 3600000 * 20) },
    ],
  },
  {
    id: 'ann-5',
    type: 'rectangle',
    authorId: 'a4',
    x: 55,
    y: 380,
    width: 240,
    height: 60,
    color: '#06b6d4',
    opacity: 0.8,
    strokeWidth: 2,
    text: '',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 12),
    replies: [],
  },
  {
    id: 'ann-6',
    type: 'highlight',
    authorId: 'a1',
    x: 60,
    y: 480,
    width: 320,
    height: 24,
    color: '#a78bfa',
    opacity: 0.35,
    strokeWidth: 0,
    text: 'Payment terms section',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 3),
    replies: [],
  },
  {
    id: 'ann-7',
    type: 'oval',
    authorId: 'a2',
    x: 300,
    y: 350,
    width: 100,
    height: 60,
    color: '#f59e0b',
    opacity: 0.7,
    strokeWidth: 2,
    text: '',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 15),
    replies: [
      { id: 'r5', authorId: 'a4', text: 'This section needs updating', createdAt: new Date(Date.now() - 3600000 * 10) },
    ],
  },
  {
    id: 'ann-8',
    type: 'arrow',
    authorId: 'a4',
    x: 340,
    y: 280,
    width: 80,
    height: 40,
    color: '#ef4444',
    opacity: 1,
    strokeWidth: 2,
    text: '',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 1),
    replies: [],
  },
  {
    id: 'ann-9',
    type: 'sticky-note',
    authorId: 'a2',
    x: 60,
    y: 560,
    width: 140,
    height: 90,
    color: '#86efac',
    opacity: 0.9,
    strokeWidth: 0,
    text: 'Confidentiality period looks good. No changes needed here.',
    status: 'resolved',
    createdAt: new Date(Date.now() - 3600000 * 48),
    replies: [],
  },
  {
    id: 'ann-10',
    type: 'pen',
    authorId: 'a3',
    x: 200,
    y: 500,
    width: 100,
    height: 30,
    color: '#8b5cf6',
    opacity: 1,
    strokeWidth: 2,
    text: '',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 4),
    replies: [],
    points: [
      { x: 200, y: 500 }, { x: 220, y: 495 }, { x: 250, y: 510 },
      { x: 280, y: 498 }, { x: 300, y: 505 },
    ],
  },
];

const MOCK_DOCUMENT_LINES = [
  { text: 'MASTER SERVICES AGREEMENT', style: 'title' },
  { text: '', style: 'spacer' },
  { text: 'This Master Services Agreement ("Agreement") is entered into as of March 1, 2025,', style: 'body' },
  { text: 'by and between Acme Corporation ("Company") and TechVentures Inc. ("Provider").', style: 'body' },
  { text: '', style: 'spacer' },
  { text: '1. SCOPE OF SERVICES', style: 'heading' },
  { text: '', style: 'spacer' },
  { text: 'The Provider shall deliver the consulting services described in Exhibit A attached', style: 'body' },
  { text: 'hereto. The Company may request changes to the scope through written amendments.', style: 'body' },
  { text: '', style: 'spacer' },
  { text: '2. TERM AND TERMINATION', style: 'heading' },
  { text: '', style: 'spacer' },
  { text: 'This Agreement shall commence on the Effective Date and continue for a period of', style: 'body' },
  { text: 'twenty-four (24) months. Either party may terminate this Agreement with thirty (30)', style: 'body' },
  { text: 'days written notice for material breach that remains uncured.', style: 'body' },
  { text: '', style: 'spacer' },
  { text: '3. COMPENSATION', style: 'heading' },
  { text: '', style: 'spacer' },
  { text: 'The Company shall pay the Provider a monthly retainer of $15,000 USD, payable', style: 'body' },
  { text: 'within thirty (30) days of invoice receipt. Late payments shall accrue interest at', style: 'body' },
  { text: 'the rate of 1.5% per month or the maximum rate permitted by law, whichever is less.', style: 'body' },
  { text: '', style: 'spacer' },
  { text: '4. CONFIDENTIALITY', style: 'heading' },
  { text: '', style: 'spacer' },
  { text: 'Each party agrees to maintain the confidentiality of all proprietary information', style: 'body' },
  { text: 'disclosed by the other party. This obligation shall survive termination for a period', style: 'body' },
  { text: 'of five (5) years from the date of disclosure.', style: 'body' },
  { text: '', style: 'spacer' },
  { text: '5. LIMITATION OF LIABILITY', style: 'heading' },
  { text: '', style: 'spacer' },
  { text: 'IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL,', style: 'body' },
  { text: 'CONSEQUENTIAL, OR PUNITIVE DAMAGES, REGARDLESS OF THE FORM OF ACTION.', style: 'body' },
  { text: 'The total aggregate liability shall not exceed the total fees paid under this Agreement.', style: 'body' },
  { text: '', style: 'spacer' },
  { text: '6. GOVERNING LAW', style: 'heading' },
  { text: '', style: 'spacer' },
  { text: 'This Agreement shall be governed by and construed in accordance with the laws of', style: 'body' },
  { text: 'the State of California, without regard to its conflict of laws provisions.', style: 'body' },
];

// ============================================================
// Tool definitions
// ============================================================

const TOOLS: { id: AnnotationType | 'select' | 'pan'; label: string; icon: typeof Pen; color?: string }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'pan', label: 'Pan', icon: Hand },
  { id: 'pen', label: 'Pen', icon: Pen },
  { id: 'highlight', label: 'Highlight', icon: Highlighter },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'sticky-note', label: 'Sticky Note', icon: StickyNote },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'oval', label: 'Oval', icon: Circle },
  { id: 'arrow', label: 'Arrow', icon: ArrowRight },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fbbf24' },
  { label: 'Green', value: '#86efac' },
  { label: 'Pink', value: '#f9a8d4' },
];

const PEN_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#000000',
];

const STICKY_COLORS = [
  { label: 'Yellow', value: '#fbbf24' },
  { label: 'Green', value: '#86efac' },
  { label: 'Pink', value: '#f9a8d4' },
  { label: 'Blue', value: '#93c5fd' },
];

// ============================================================
// Helper functions
// ============================================================

function getAuthor(id: string): AnnotationAuthor {
  return AUTHORS.find(a => a.id === id) || AUTHORS[0];
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getAnnotationIcon(type: AnnotationType) {
  switch (type) {
    case 'pen': return Pen;
    case 'highlight': return Highlighter;
    case 'text': return Type;
    case 'sticky-note': return StickyNote;
    case 'rectangle': return Square;
    case 'oval': return Circle;
    case 'arrow': return ArrowRight;
    case 'eraser': return Eraser;
  }
}

function getAnnotationTypeLabel(type: AnnotationType): string {
  switch (type) {
    case 'pen': return 'Pen Stroke';
    case 'highlight': return 'Highlight';
    case 'text': return 'Text';
    case 'sticky-note': return 'Sticky Note';
    case 'rectangle': return 'Rectangle';
    case 'oval': return 'Oval';
    case 'arrow': return 'Arrow';
    case 'eraser': return 'Eraser';
  }
}

function getAnnotationTypeColor(type: AnnotationType): string {
  switch (type) {
    case 'pen': return '#ef4444';
    case 'highlight': return '#fbbf24';
    case 'text': return '#10b981';
    case 'sticky-note': return '#f59e0b';
    case 'rectangle': return '#06b6d4';
    case 'oval': return '#8b5cf6';
    case 'arrow': return '#f97316';
    case 'eraser': return '#6b7280';
  }
}

// ============================================================
// Main Component
// ============================================================

export function DocumentAnnotationsPage() {
  // State
  const [activeTool, setActiveTool] = useState<AnnotationType | 'select' | 'pan'>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>(INITIAL_ANNOTATIONS);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(3);
  const [penColor, setPenColor] = useState('#ef4444');
  const [penSize, setPenSize] = useState(2);
  const [highlightColor, setHighlightColor] = useState('#fbbf24');
  const [stickyColor, setStickyColor] = useState('#fbbf24');
  const [filterType, setFilterType] = useState<AnnotationType | 'all'>('all');
  const [showProperties, setShowProperties] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('annotations');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [newTextContent, setNewTextContent] = useState('');
  const [newStickyContent, setNewStickyContent] = useState('');

  const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId) || null;
  const filteredAnnotations = filterType === 'all'
    ? annotations
    : annotations.filter(a => a.type === filterType);

  // Undo/Redo
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), [...annotations]]);
    setRedoStack([]);
  }, [annotations]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, [...annotations]]);
    setAnnotations(prev);
    setUndoStack(s => s.slice(0, -1));
  }, [undoStack, annotations]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, [...annotations]]);
    setAnnotations(next);
    setRedoStack(r => r.slice(0, -1));
  }, [redoStack, annotations]);

  // Delete annotation
  const handleDeleteAnnotation = useCallback((id: string) => {
    pushUndo();
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
      setShowProperties(false);
    }
  }, [pushUndo, selectedAnnotationId]);

  // Clear all
  const handleClearAll = useCallback(() => {
    pushUndo();
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setShowProperties(false);
  }, [pushUndo]);

  // Update annotation
  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    pushUndo();
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, [pushUndo]);

  // Toggle annotation status
  const toggleAnnotationStatus = useCallback((id: string) => {
    const ann = annotations.find(a => a.id === id);
    if (ann) {
      updateAnnotation(id, { status: ann.status === 'open' ? 'resolved' : 'open' });
    }
  }, [annotations, updateAnnotation]);

  // Add reply
  const addReply = useCallback((annotationId: string, text: string) => {
    if (!text.trim()) return;
    const newReply: AnnotationReply = {
      id: `reply-${Date.now()}`,
      authorId: 'a1',
      text: text.trim(),
      createdAt: new Date(),
    };
    const ann = annotations.find(a => a.id === annotationId);
    if (ann) {
      updateAnnotation(annotationId, { replies: [...ann.replies, newReply] });
      setReplyTexts(prev => ({ ...prev, [annotationId]: '' }));
    }
  }, [annotations, updateAnnotation]);

  // Canvas click to add annotation
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || activeTool === 'pan' || activeTool === 'eraser') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'pen' || activeTool === 'highlight') {
      // These need drawing; we'll just add a mock shape for now
      return;
    }

    if (activeTool === 'text') {
      if (!newTextContent.trim()) return;
      pushUndo();
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: 'text',
        authorId: 'a1',
        x,
        y,
        width: 200,
        height: 20,
        color: penColor,
        opacity: 1,
        strokeWidth: 0,
        text: newTextContent,
        status: 'open',
        createdAt: new Date(),
        replies: [],
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      setNewTextContent('');
      return;
    }

    if (activeTool === 'sticky-note') {
      pushUndo();
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: 'sticky-note',
        authorId: 'a1',
        x,
        y,
        width: 140,
        height: 100,
        color: stickyColor,
        opacity: 0.9,
        strokeWidth: 0,
        text: newStickyContent || 'New note',
        status: 'open',
        createdAt: new Date(),
        replies: [],
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      setNewStickyContent('');
      return;
    }

    if (activeTool === 'rectangle' || activeTool === 'oval' || activeTool === 'arrow') {
      setIsDrawing(true);
      setDrawStart({ x, y });
      return;
    }
  }, [activeTool, penColor, stickyColor, newTextContent, newStickyContent, pushUndo]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart) return;
    if (activeTool !== 'rectangle' && activeTool !== 'oval' && activeTool !== 'arrow') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x2 = e.clientX - rect.left;
    const y2 = e.clientY - rect.top;

    const x = Math.min(drawStart.x, x2);
    const y = Math.min(drawStart.y, y2);
    const width = Math.abs(x2 - drawStart.x);
    const height = Math.abs(y2 - drawStart.y);

    if (width < 5 && height < 5) {
      setIsDrawing(false);
      setDrawStart(null);
      return;
    }

    pushUndo();
    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: activeTool as AnnotationType,
      authorId: 'a1',
      x,
      y,
      width: Math.max(width, 20),
      height: Math.max(height, 20),
      color: penColor,
      opacity: 0.8,
      strokeWidth: 2,
      text: '',
      status: 'open',
      createdAt: new Date(),
      replies: [],
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    setIsDrawing(false);
    setDrawStart(null);
  }, [isDrawing, drawStart, activeTool, penColor, pushUndo]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleZoomFit = () => setZoom(100);

  // Page navigation
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = 480;
    const displayHeight = 680;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw annotations
    const pageAnnotations = annotations; // all annotations for current page mock
    for (const ann of pageAnnotations) {
      ctx.save();
      ctx.globalAlpha = ann.opacity;

      if (ann.type === 'pen' && ann.points && ann.points.length > 1) {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      }

      if (ann.type === 'highlight') {
        ctx.fillStyle = ann.color;
        ctx.fillRect(ann.x, ann.y, ann.width, ann.height);
      }

      if (ann.type === 'rectangle') {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.strokeWidth;
        ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
      }

      if (ann.type === 'oval') {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.strokeWidth;
        ctx.beginPath();
        ctx.ellipse(
          ann.x + ann.width / 2,
          ann.y + ann.height / 2,
          ann.width / 2,
          ann.height / 2,
          0, 0, Math.PI * 2
        );
        ctx.stroke();
      }

      if (ann.type === 'arrow') {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.strokeWidth;
        ctx.beginPath();
        ctx.moveTo(ann.x, ann.y + ann.height);
        ctx.lineTo(ann.x + ann.width, ann.y);
        ctx.stroke();
        // Arrowhead
        ctx.fillStyle = ann.color;
        ctx.beginPath();
        ctx.moveTo(ann.x + ann.width, ann.y);
        ctx.lineTo(ann.x + ann.width - 10, ann.y + 5);
        ctx.lineTo(ann.x + ann.width - 5, ann.y + 10);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // Draw selection highlight
    if (selectedAnnotationId) {
      const sel = pageAnnotations.find(a => a.id === selectedAnnotationId);
      if (sel) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        const pad = 4;
        ctx.strokeRect(
          sel.x - pad,
          sel.y - pad,
          sel.width + pad * 2,
          sel.height + pad * 2
        );
        ctx.restore();
      }
    }
  }, [annotations, selectedAnnotationId, zoom]);

  const annotationCounts = annotations.reduce<Record<string, number>>((acc, ann) => {
    acc[ann.type] = (acc[ann.type] || 0) + 1;
    return acc;
  }, {});

  const openCount = annotations.filter(a => a.status === 'open').length;
  const resolvedCount = annotations.filter(a => a.status === 'resolved').length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm px-4 py-2 flex items-center gap-2 flex-wrap">
        {/* Tool buttons */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <TooltipProvider key={tool.id} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => setActiveTool(tool.id)}
                      className={cn(
                        'relative flex items-center justify-center rounded-md p-2 transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="h-4 w-4" />
                      {isActive && (
                        <motion.div
                          layoutId="active-tool-indicator"
                          className="absolute inset-0 rounded-md bg-primary/10 border border-primary/30"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                        />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {tool.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Color/Size options based on active tool */}
        <AnimatePresence mode="wait">
          {(activeTool === 'pen' || activeTool === 'rectangle' || activeTool === 'oval' || activeTool === 'arrow') && (
            <motion.div
              key="pen-options"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-1">
                {PEN_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setPenColor(color)}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-all duration-200 hover:scale-110',
                      penColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2 w-24">
                <Minus className="h-3 w-3 text-muted-foreground" />
                <Slider
                  value={[penSize]}
                  min={1}
                  max={8}
                  step={1}
                  onValueChange={v => setPenSize(v[0])}
                  className="flex-1"
                />
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
            </motion.div>
          )}

          {activeTool === 'highlight' && (
            <motion.div
              key="highlight-options"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2"
            >
              {HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => setHighlightColor(color.value)}
                  className={cn(
                    'w-7 h-7 rounded-md border-2 transition-all duration-200 hover:scale-110',
                    highlightColor === color.value ? 'border-foreground scale-110 shadow-sm' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color.value, opacity: 0.5 }}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">{HIGHLIGHT_COLORS.find(c => c.value === highlightColor)?.label}</span>
            </motion.div>
          )}

          {activeTool === 'text' && (
            <motion.div
              key="text-options"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Type annotation text..."
                value={newTextContent}
                onChange={e => setNewTextContent(e.target.value)}
                className="w-48 h-7 text-xs"
                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
              />
              <div className="flex items-center gap-1">
                {PEN_COLORS.slice(0, 4).map(color => (
                  <button
                    key={color}
                    onClick={() => setPenColor(color)}
                    className={cn(
                      'w-4 h-4 rounded-full border-2 transition-all',
                      penColor === color ? 'border-foreground' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTool === 'sticky-note' && (
            <motion.div
              key="sticky-options"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-center gap-2"
            >
              {STICKY_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => setStickyColor(color.value)}
                  className={cn(
                    'w-6 h-6 rounded-md border-2 transition-all duration-200 hover:scale-110',
                    stickyColor === color.value ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color.value, opacity: 0.7 }}
                />
              ))}
              <Input
                placeholder="Note text..."
                value={newStickyContent}
                onChange={e => setNewStickyContent(e.target.value)}
                className="w-40 h-7 text-xs"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        {/* Undo / Redo / Clear */}
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Undo (⌘Z)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Redo (⌘⇧Z)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleClearAll}
                  disabled={annotations.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Clear All</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas container */}
          <div className="flex-1 overflow-auto bg-muted/30 p-4 flex items-start justify-center">
            <div
              className="relative bg-white shadow-xl rounded-lg overflow-hidden"
              style={{
                width: `${480 * zoom / 100}px`,
                height: `${680 * zoom / 100}px`,
                transform: `scale(1)`,
              }}
            >
              {/* Mock Document Content */}
              <div
                className="absolute inset-0 p-8 overflow-hidden"
                style={{ fontSize: `${12 * zoom / 100}px` }}
              >
                {MOCK_DOCUMENT_LINES.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      'text-gray-800 leading-relaxed',
                      line.style === 'title' && 'text-center font-bold text-lg mb-4',
                      line.style === 'heading' && 'font-semibold text-sm mt-1',
                      line.style === 'spacer' && 'h-2',
                      line.style === 'body' && 'text-xs',
                    )}
                  >
                    {line.text}
                  </div>
                ))}
              </div>

              {/* Canvas overlay for annotations */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{
                  width: `${480 * zoom / 100}px`,
                  height: `${680 * zoom / 100}px`,
                  cursor: activeTool === 'pan' ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair',
                }}
              />

              {/* Text annotations overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {annotations.filter(a => a.type === 'text').map(ann => {
                  const author = getAuthor(ann.authorId);
                  return (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute pointer-events-auto cursor-pointer"
                      style={{
                        left: `${ann.x * zoom / 100}px`,
                        top: `${ann.y * zoom / 100}px`,
                        fontSize: `${10 * zoom / 100}px`,
                        color: ann.color,
                        fontWeight: 600,
                      }}
                      onClick={() => {
                        setSelectedAnnotationId(ann.id);
                        setShowProperties(true);
                      }}
                    >
                      {ann.text}
                      {selectedAnnotationId === ann.id && (
                        <div className="absolute -top-3 -left-3 w-2.5 h-2.5 rounded-full border-2 border-white shadow" style={{ backgroundColor: author.color }} />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Sticky note annotations overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {annotations.filter(a => a.type === 'sticky-note').map(ann => {
                  const author = getAuthor(ann.authorId);
                  return (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: 'spring', bounce: 0.3 }}
                      className={cn(
                        'absolute pointer-events-auto cursor-pointer rounded-sm shadow-md transition-all duration-200',
                        selectedAnnotationId === ann.id && 'ring-2 ring-primary ring-offset-1'
                      )}
                      style={{
                        left: `${ann.x * zoom / 100}px`,
                        top: `${ann.y * zoom / 100}px`,
                        width: `${ann.width * zoom / 100}px`,
                        minHeight: `${ann.height * zoom / 100}px`,
                        backgroundColor: ann.color,
                        opacity: ann.opacity,
                        padding: `${8 * zoom / 100}px`,
                        fontSize: `${9 * zoom / 100}px`,
                      }}
                      onClick={() => {
                        setSelectedAnnotationId(ann.id);
                        setShowProperties(true);
                      }}
                    >
                      {/* Fold corner */}
                      <div
                        className="absolute top-0 right-0"
                        style={{
                          width: `${14 * zoom / 100}px`,
                          height: `${14 * zoom / 100}px`,
                          background: 'linear-gradient(135deg, transparent 50%, rgb(0 0 0 / 0.1) 50%)',
                        }}
                      />
                      <p className="text-gray-800 font-medium leading-snug" style={{ fontSize: `${9 * zoom / 100}px` }}>
                        {ann.text}
                      </p>
                      <div
                        className="absolute -top-2 -left-2 flex items-center justify-center rounded-full text-white font-bold shadow"
                        style={{
                          width: `${18 * zoom / 100}px`,
                          height: `${18 * zoom / 100}px`,
                          backgroundColor: author.color,
                          fontSize: `${7 * zoom / 100}px`,
                        }}
                      >
                        {author.avatar}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Click/draw overlay */}
              <div
                className="absolute inset-0"
                style={{
                  cursor: activeTool === 'pan' ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair',
                }}
                onClick={handleCanvasClick}
                onMouseUp={handleCanvasMouseUp}
              />
            </div>
          </div>

          {/* Bottom controls: zoom + page nav */}
          <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} disabled={zoom <= 50}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} disabled={zoom >= 200}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomFit}>
                <Maximize className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] h-5">
                  <Pen className="h-3 w-3 mr-1" />
                  {annotations.length} annotations
                </Badge>
                <Badge variant="secondary" className="text-[10px] h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                  {openCount} open
                </Badge>
                <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                  {resolvedCount} resolved
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevPage} disabled={currentPage <= 1}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextPage} disabled={currentPage >= totalPages}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel: Annotations + Properties */}
        <div className="w-80 border-l border-border bg-card/60 backdrop-blur-sm flex flex-col overflow-hidden hidden lg:flex">
          <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-10 p-0">
              <TabsTrigger
                value="annotations"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10 text-xs"
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                Annotations ({annotations.length})
              </TabsTrigger>
              <TabsTrigger
                value="properties"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10 text-xs"
                disabled={!selectedAnnotation}
              >
                <Palette className="h-3.5 w-3.5 mr-1.5" />
                Properties
              </TabsTrigger>
            </TabsList>

            {/* Annotations Tab */}
            <TabsContent value="annotations" className="flex-1 overflow-hidden m-0">
              <div className="flex flex-col h-full">
                {/* Filter bar */}
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setFilterType('all')}
                      className={cn(
                        'text-[10px] px-2 py-1 rounded-full transition-all duration-200',
                        filterType === 'all'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      )}
                    >
                      All ({annotations.length})
                    </button>
                    {(['pen', 'highlight', 'text', 'sticky-note', 'rectangle', 'oval', 'arrow'] as AnnotationType[]).map(type => {
                      const count = annotationCounts[type] || 0;
                      if (count === 0) return null;
                      const Icon = getAnnotationIcon(type);
                      return (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={cn(
                            'flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-all duration-200',
                            filterType === type
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-accent'
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {count}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Annotation list */}
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    <AnimatePresence>
                      {filteredAnnotations.map((ann, index) => {
                        const author = getAuthor(ann.authorId);
                        const Icon = getAnnotationIcon(ann.type);
                        const typeColor = getAnnotationTypeColor(ann.type);
                        const isSelected = selectedAnnotationId === ann.id;

                        return (
                          <motion.div
                            key={ann.id}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                              'group relative rounded-lg border p-3 transition-all duration-200 cursor-pointer',
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/30 hover:bg-accent/50'
                            )}
                            onClick={() => {
                              setSelectedAnnotationId(ann.id);
                              setShowProperties(true);
                              setRightPanelTab('properties');
                            }}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Type icon with color indicator */}
                              <div
                                className="flex-shrink-0 rounded-md p-1.5"
                                style={{ backgroundColor: `${typeColor}15` }}
                              >
                                <Icon className="h-3.5 w-3.5" style={{ color: typeColor }} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-xs font-medium truncate">
                                    {ann.text || getAnnotationTypeLabel(ann.type)}
                                  </span>
                                  {ann.status === 'resolved' && (
                                    <Badge className="h-4 px-1 text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                      Resolved
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  {/* Author */}
                                  <div className="flex items-center gap-1">
                                    <div
                                      className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                                      style={{ backgroundColor: author.color, fontSize: '7px' }}
                                    >
                                      {author.avatar}
                                    </div>
                                    <span>{author.name.split(' ')[0]}</span>
                                  </div>

                                  {/* Color dot */}
                                  <div
                                    className="w-2.5 h-2.5 rounded-full border border-white/50"
                                    style={{ backgroundColor: ann.color }}
                                  />

                                  {/* Timestamp */}
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    {formatTimeAgo(ann.createdAt)}
                                  </span>

                                  {/* Reply count */}
                                  {ann.replies.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-primary">
                                      <Reply className="h-2.5 w-2.5" />
                                      {ann.replies.length}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Delete button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteAnnotation(ann.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {filteredAnnotations.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <MessageCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No annotations</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {filterType !== 'all' ? 'Try a different filter' : 'Use the toolbar to add annotations'}
                        </p>
                        {filterType !== 'all' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => setFilterType('all')}
                          >
                            Show all
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Replies section for selected annotation */}
                {selectedAnnotation && (
                  <div className="border-t border-border p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Replies</span>
                      <Badge variant="secondary" className="text-[9px] h-4">
                        {selectedAnnotation.replies.length}
                      </Badge>
                    </div>

                    <ScrollArea className="max-h-32 mb-2">
                      <div className="space-y-2">
                        {selectedAnnotation.replies.map(reply => {
                          const replyAuthor = getAuthor(reply.authorId);
                          return (
                            <motion.div
                              key={reply.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-2"
                            >
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: replyAuthor.color, fontSize: '7px' }}
                              >
                                {replyAuthor.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium">{replyAuthor.name}</span>
                                  <span className="text-[9px] text-muted-foreground">{formatTimeAgo(reply.createdAt)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">{reply.text}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="flex gap-1.5">
                      <Input
                        placeholder="Add a reply..."
                        className="h-7 text-[10px] flex-1"
                        value={replyTexts[selectedAnnotation.id] || ''}
                        onChange={e => setReplyTexts(prev => ({ ...prev, [selectedAnnotation.id]: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            addReply(selectedAnnotation.id, replyTexts[selectedAnnotation.id] || '');
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => addReply(selectedAnnotation.id, replyTexts[selectedAnnotation.id] || '')}
                        disabled={!replyTexts[selectedAnnotation.id]?.trim()}
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Properties Tab */}
            <TabsContent value="properties" className="flex-1 overflow-auto m-0">
              {selectedAnnotation ? (
                <div className="p-4 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    {/* Type & Status Header */}
                    <div className="glass-card rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = getAnnotationIcon(selectedAnnotation.type);
                            const typeColor = getAnnotationTypeColor(selectedAnnotation.type);
                            return (
                              <div className="rounded-md p-1.5" style={{ backgroundColor: `${typeColor}15` }}>
                                <Icon className="h-4 w-4" style={{ color: typeColor }} />
                              </div>
                            );
                          })()}
                          <div>
                            <p className="text-xs font-medium">{getAnnotationTypeLabel(selectedAnnotation.type)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              by {getAuthor(selectedAnnotation.authorId).name} · {formatTimeAgo(selectedAnnotation.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            'cursor-pointer text-[9px] transition-colors',
                            selectedAnnotation.status === 'open'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 hover:bg-emerald-200'
                          )}
                          onClick={() => toggleAnnotationStatus(selectedAnnotation.id)}
                        >
                          {selectedAnnotation.status === 'open' ? (
                            <><CircleDot className="h-2.5 w-2.5 mr-0.5" />Open</>
                          ) : (
                            <><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Resolved</>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Color</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[...PEN_COLORS, '#fbbf24', '#86efac', '#f9a8d4'].map(color => (
                          <button
                            key={color}
                            onClick={() => updateAnnotation(selectedAnnotation.id, { color })}
                            className={cn(
                              'w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110',
                              selectedAnnotation.color === color
                                ? 'border-foreground scale-110 shadow-sm'
                                : 'border-transparent'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <div className="flex items-center gap-1.5 ml-1">
                          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="color"
                            value={selectedAnnotation.color}
                            onChange={e => updateAnnotation(selectedAnnotation.id, { color: e.target.value })}
                            className="w-6 h-6 p-0 border-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Opacity</label>
                        <span className="text-[10px] text-muted-foreground">{Math.round(selectedAnnotation.opacity * 100)}%</span>
                      </div>
                      <Slider
                        value={[selectedAnnotation.opacity * 100]}
                        min={10}
                        max={100}
                        step={5}
                        onValueChange={v => updateAnnotation(selectedAnnotation.id, { opacity: v[0] / 100 })}
                      />
                    </div>

                    {/* Size/Width (for pen, rectangle, oval, arrow) */}
                    {['pen', 'rectangle', 'oval', 'arrow'].includes(selectedAnnotation.type) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-muted-foreground">Stroke Width</label>
                          <span className="text-[10px] text-muted-foreground">{selectedAnnotation.strokeWidth}px</span>
                        </div>
                        <Slider
                          value={[selectedAnnotation.strokeWidth]}
                          min={1}
                          max={8}
                          step={1}
                          onValueChange={v => updateAnnotation(selectedAnnotation.id, { strokeWidth: v[0] })}
                        />
                      </div>
                    )}

                    {/* Comment */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Comment</label>
                      <Textarea
                        placeholder="Add a comment to this annotation..."
                        value={selectedAnnotation.text}
                        onChange={e => updateAnnotation(selectedAnnotation.id, { text: e.target.value })}
                        className="text-xs min-h-[60px] resize-none"
                      />
                    </div>

                    {/* Status Toggle */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedAnnotation.status === 'open' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => updateAnnotation(selectedAnnotation.id, { status: 'open' })}
                        >
                          <CircleDot className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                        <Button
                          variant={selectedAnnotation.status === 'resolved' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => updateAnnotation(selectedAnnotation.id, { status: 'resolved' })}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolved
                        </Button>
                      </div>
                    </div>

                    {/* Position info */}
                    <div className="glass-card rounded-lg p-3 space-y-1.5">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Position</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">X:</span>
                          <span className="font-mono">{Math.round(selectedAnnotation.x)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Y:</span>
                          <span className="font-mono">{Math.round(selectedAnnotation.y)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">W:</span>
                          <span className="font-mono">{Math.round(selectedAnnotation.width)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">H:</span>
                          <span className="font-mono">{Math.round(selectedAnnotation.height)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => handleDeleteAnnotation(selectedAnnotation.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Delete Annotation
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MousePointer2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No annotation selected</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Click an annotation on the document or in the list to view its properties
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile panel toggle */}
        <div className="lg:hidden">
          {/* Mobile annotations would be shown as a sheet/drawer */}
        </div>
      </div>

      {/* Stats bar at very bottom */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {AUTHORS.length} collaborators
          </span>
          <Separator orientation="vertical" className="h-3" />
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {annotations.length} annotations
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>Master Services Agreement</span>
          <span className="text-muted-foreground/50">·</span>
          <span>Page {currentPage}</span>
        </div>
      </div>
    </div>
  );
}
