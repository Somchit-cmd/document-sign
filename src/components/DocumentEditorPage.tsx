'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { api, mockDocuments } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Send,
  Type,
  PenLine,
  Calendar,
  SquareCheck,
  MousePointer2,
  Undo2,
  Redo2,
  Maximize2,
  Save,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  GripVertical,
  Move,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlacedField {
  id: string;
  type: 'signature' | 'initial' | 'date' | 'text' | 'checkbox';
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  assignedTo?: string;
  required: boolean;
}

interface HistoryEntry {
  fields: PlacedField[];
}

export function DocumentEditorPage() {
  const { navigate, pageParams } = useAppStore();
  const queryClient = useQueryClient();
  const docId = pageParams?.id as string;

  // Fetch document
  const { data: documentData } = useQuery({
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

  const document = documentData || mockDocuments.find((d) => d.id === docId) || mockDocuments[0];

  const [zoom, setZoom] = useState(100);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(document.pageCount || 3, 3);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const [resizingField, setResizingField] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize fields from document data
  const [fields, setFields] = useState<PlacedField[]>(
    document.fields.map((f) => ({
      id: f.id,
      type: f.type as PlacedField['type'],
      label: f.label,
      page: f.page,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      assignedTo: f.assignedTo,
      required: f.required,
    }))
  );

  // Undo/Redo history
  const [history, setHistory] = useState<HistoryEntry[]>([{ fields: fields }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback((newFields: PlacedField[]) => {
    setHistoryIndex((prev) => {
      const newHistory = history.slice(0, prev + 1);
      newHistory.push({ fields: newFields });
      setHistory(newHistory);
      return prev + 1;
    });
  }, [history]);

  const undo = useCallback(() => {
    setHistoryIndex((prev) => {
      if (prev <= 0) return prev;
      const newIndex = prev - 1;
      setFields(history[newIndex].fields);
      return newIndex;
    });
  }, [history]);

  const redo = useCallback(() => {
    setHistoryIndex((prev) => {
      if (prev >= history.length - 1) return prev;
      const newIndex = prev + 1;
      setFields(history[newIndex].fields);
      return newIndex;
    });
  }, [history]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === 'Delete' && selectedField) {
        const newFields = fields.filter((f) => f.id !== selectedField);
        setFields(newFields);
        pushHistory(newFields);
        setSelectedField(null);
      }
      if (e.key === 'Escape') {
        setSelectedField(null);
        setActiveTool('select');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedField, fields, pushHistory]);

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)', shortcut: 'V' },
    { id: 'signature', icon: PenLine, label: 'Signature', color: 'emerald' },
    { id: 'initial', icon: Type, label: 'Initial', color: 'blue' },
    { id: 'date', icon: Calendar, label: 'Date', color: 'purple' },
    { id: 'text', icon: Type, label: 'Text', color: 'cyan' },
    { id: 'checkbox', icon: SquareCheck, label: 'Checkbox', color: 'amber' },
  ];

  const fieldColorMap: Record<string, { border: string; bg: string; text: string }> = {
    signature: { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400' },
    initial: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400' },
    date: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400' },
    text: { border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400' },
    checkbox: { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400' },
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool === 'select') return;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const defaultSizes: Record<string, { w: number; h: number }> = {
      signature: { w: 18, h: 6 },
      initial: { w: 8, h: 5 },
      date: { w: 14, h: 4 },
      text: { w: 18, h: 5 },
      checkbox: { w: 5, h: 4 },
    };
    const size = defaultSizes[activeTool] || { w: 15, h: 5 };

    const newField: PlacedField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: activeTool as PlacedField['type'],
      label: `${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Field`,
      page: currentPage,
      x: Math.max(0, Math.min(100 - size.w, x - size.w / 2)),
      y: Math.max(0, Math.min(100 - size.h, y - size.h / 2)),
      width: size.w,
      height: size.h,
      required: false,
    };

    const newFields = [...fields, newField];
    setFields(newFields);
    pushHistory(newFields);
    setSelectedField(newField.id);
    setActiveTool('select');
  };

  const handleFieldMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    if (activeTool !== 'select') return;

    setSelectedField(fieldId);
    const field = fields.find((f) => f.id === fieldId);
    if (!field || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingField(fieldId);
    setDragOffset({
      x: e.clientX - (field.x / 100) * rect.width - rect.left,
      y: e.clientY - (field.y / 100) * rect.height - rect.top,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    setResizingField(fieldId);
    setResizeStart({ x: e.clientX, y: e.clientY, width: field.width, height: field.height });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    if (draggingField) {
      const rect = canvasRef.current.getBoundingClientRect();
      const field = fields.find((f) => f.id === draggingField);
      if (!field) return;

      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

      setFields((prev) =>
        prev.map((f) =>
          f.id === draggingField
            ? { ...f, x: Math.max(0, Math.min(100 - f.width, x)), y: Math.max(0, Math.min(100 - f.height, y)) }
            : f
        )
      );
    }

    if (resizingField) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((e.clientX - resizeStart.x) / rect.width) * 100;
      const dy = ((e.clientY - resizeStart.y) / rect.height) * 100;

      setFields((prev) =>
        prev.map((f) =>
          f.id === resizingField
            ? {
                ...f,
                width: Math.max(5, Math.min(90, resizeStart.width + dx)),
                height: Math.max(3, Math.min(50, resizeStart.height + dy)),
              }
            : f
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingField || resizingField) {
      pushHistory(fields);
    }
    setDraggingField(null);
    setResizingField(null);
  };

  const removeField = (fieldId: string) => {
    const newFields = fields.filter((f) => f.id !== fieldId);
    setFields(newFields);
    pushHistory(newFields);
    if (selectedField === fieldId) setSelectedField(null);
  };

  const updateField = (fieldId: string, updates: Partial<PlacedField>) => {
    const newFields = fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f));
    setFields(newFields);
    pushHistory(newFields);
  };

  const selectedFieldData = fields.find((f) => f.id === selectedField);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!docId) return;
      return api.saveDocumentFields(docId, fields.map(f => ({
        type: f.type,
        label: f.label,
        page: f.page,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        required: f.required,
        assigneeId: f.assignedTo,
      })));
    },
    onSuccess: () => {
      toast.success('Fields saved successfully');
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
    },
    onError: () => {
      toast.error('Failed to save fields');
    },
  });

  // AI Suggest fields
  const suggestMutation = useMutation({
    mutationFn: async () => {
      if (!docId) return { success: false };
      return api.suggestFields(docId);
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        const suggested = result.data.fields.map((f, i) => ({
          id: `suggested-${Date.now()}-${i}`,
          type: f.type as PlacedField['type'],
          label: f.label,
          page: f.page || 1,
          x: f.x,
          y: f.y,
          width: f.type === 'checkbox' ? 5 : f.type === 'initial' ? 8 : 18,
          height: f.type === 'checkbox' ? 4 : 5,
          required: false,
        }));
        const newFields = [...fields, ...suggested];
        setFields(newFields);
        pushHistory(newFields);
        toast.success(`Added ${suggested.length} AI-suggested fields`);
      } else {
        toast.error('Failed to suggest fields');
      }
    },
    onError: () => {
      toast.error('AI field suggestion failed');
    },
  });

  // Generate page content placeholder
  const renderPagePlaceholder = (page: number) => {
    const lines = [];
    const lineHeight = 2.5;
    const startY = 12;

    // Header line
    lines.push(
      <div key={`header-${page}`} className="absolute left-[8%] right-[8%] top-[4%] h-[3%] bg-gray-200/60 rounded" />
    );

    // Body text lines
    for (let i = 0; i < 20; i++) {
      const width = 60 + Math.random() * 25;
      lines.push(
        <div
          key={`line-${page}-${i}`}
          className="absolute left-[8%] bg-gray-100/50 rounded-sm"
          style={{
            top: `${startY + i * lineHeight}%`,
            width: `${width}%`,
            height: '1.5%',
          }}
        />
      );
    }

    // Signature lines on specific pages
    if (page === totalPages || page === totalPages - 1) {
      lines.push(
        <div key={`sig-line-1-${page}`} className="absolute left-[8%] bottom-[18%] w-[35%] h-[0.5%] bg-gray-300 rounded" />,
        <div key={`sig-label-1-${page}`} className="absolute left-[8%] bottom-[15%] text-gray-300" style={{ fontSize: `${8 * (zoom / 100)}px` }}>Signature</div>,
        <div key={`sig-line-2-${page}`} className="absolute right-[8%] bottom-[18%] w-[35%] h-[0.5%] bg-gray-300 rounded" />,
        <div key={`sig-label-2-${page}`} className="absolute right-[8%] bottom-[15%] text-gray-300" style={{ fontSize: `${8 * (zoom / 100)}px` }}>Date</div>,
      );
    }

    // Page number
    lines.push(
      <div key={`page-num-${page}`} className="absolute bottom-[3%] left-1/2 -translate-x-1/2 text-gray-300" style={{ fontSize: `${8 * (zoom / 100)}px` }}>
        Page {page} of {totalPages}
      </div>
    );

    return lines;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('document-detail', { id: docId })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate max-w-[200px]">{document.title}</h1>
            <p className="text-[10px] text-muted-foreground">Document Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={historyIndex <= 0}>
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={historyIndex >= history.length - 1}>
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Zoom controls */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(50, zoom - 10))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(200, zoom + 10))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(100)}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* AI Suggest */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950"
            onClick={() => suggestMutation.mutate()}
            disabled={suggestMutation.isPending}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {suggestMutation.isPending ? 'Analyzing...' : 'AI Suggest Fields'}
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button variant="outline" size="sm" className="h-8" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" className="h-8 bg-primary hover:bg-primary/90">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Send for Signature
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Field Tools */}
        <div className="w-14 shrink-0 border-r bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-2 gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <TooltipProvider key={tool.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="icon"
                      className={`h-10 w-10 ${isActive && tool.id !== 'select' ? 'bg-primary text-primary-foreground' : ''}`}
                      onClick={() => setActiveTool(tool.id)}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{tool.label}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Pages Panel */}
        <div className="w-28 shrink-0 border-r bg-gray-50/80 dark:bg-gray-900/80 overflow-y-auto p-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Pages</p>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`w-full mb-2 rounded-md border-2 transition-all overflow-hidden ${
                currentPage === page ? 'border-primary ring-1 ring-primary/30' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setCurrentPage(page)}
            >
              <div className="aspect-[8.5/11] bg-white dark:bg-gray-800 relative p-1">
                {/* Mini page preview */}
                <div className="absolute inset-1 flex flex-col gap-[1px]">
                  <div className="h-[1px] bg-gray-200 dark:bg-gray-700 w-3/4" />
                  {Array.from({ length: 6 }, (_, li) => (
                    <div key={li} className="h-[0.5px] bg-gray-100 dark:bg-gray-700" style={{ width: `${50 + Math.random() * 40}%` }} />
                  ))}
                </div>
                {/* Field indicators */}
                {fields.filter(f => f.page === page).map(f => (
                  <div
                    key={f.id}
                    className={`absolute rounded-[1px] ${fieldColorMap[f.type]?.bg || 'bg-gray-200'} opacity-80`}
                    style={{
                      left: `${f.x}%`,
                      top: `${f.y}%`,
                      width: `${f.width}%`,
                      height: `${f.height}%`,
                    }}
                  />
                ))}
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[5px] text-gray-400">
                  {page}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-950">
          {/* Page navigation bar */}
          <div className="flex items-center justify-center gap-3 py-2 bg-background border-b shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium">Page {currentPage} of {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-[10px] text-muted-foreground">
              {fields.filter(f => f.page === currentPage).length} field(s) on this page
            </span>
          </div>

          {/* PDF Canvas */}
          <ScrollArea className="flex-1">
            <div className="flex justify-center p-6">
              <div
                ref={canvasRef}
                className="relative bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700"
                style={{
                  width: `${612 * (zoom / 100)}px`,
                  height: `${792 * (zoom / 100)}px`,
                  cursor: activeTool !== 'select' ? 'crosshair' : 'default',
                }}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                {/* Page content placeholder */}
                {renderPagePlaceholder(currentPage)}

                {/* Placed fields */}
                {fields
                  .filter((f) => f.page === currentPage)
                  .map((field) => {
                    const colors = fieldColorMap[field.type] || fieldColorMap.text;
                    const isSelected = selectedField === field.id;

                    return (
                      <div
                        key={field.id}
                        className={`absolute border-2 rounded flex items-center justify-center text-xs font-medium transition-shadow ${
                          colors.border
                        } ${colors.bg} ${
                          isSelected ? 'ring-2 ring-primary ring-offset-1 shadow-lg' : 'shadow-sm'
                        } ${draggingField === field.id ? 'opacity-80' : ''}`}
                        style={{
                          left: `${field.x}%`,
                          top: `${field.y}%`,
                          width: `${field.width}%`,
                          height: `${field.height}%`,
                          cursor: activeTool === 'select' ? 'move' : 'crosshair',
                        }}
                        onMouseDown={(e) => handleFieldMouseDown(e, field.id)}
                        onClick={(e) => { e.stopPropagation(); setSelectedField(field.id); }}
                      >
                        {/* Drag handle */}
                        {isSelected && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-primary text-primary-foreground rounded-t px-1.5 py-0.5">
                            <Move className="h-2.5 w-2.5" />
                            <span className="text-[8px] font-medium capitalize">{field.type}</span>
                          </div>
                        )}

                        {/* Field label */}
                        <span className={`truncate px-1.5 ${colors.text}`} style={{ fontSize: `${Math.max(9, 11 * (zoom / 100))}px` }}>
                          {field.label}
                        </span>

                        {/* Required indicator */}
                        {field.required && (
                          <span className="absolute -top-0.5 -left-0.5 text-red-500 text-xs font-bold">*</span>
                        )}

                        {/* Delete button */}
                        {isSelected && (
                          <button
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] shadow-md hover:bg-destructive/90 transition-colors"
                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                          >
                            ×
                          </button>
                        )}

                        {/* Resize handle */}
                        {isSelected && (
                          <div
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-primary rounded-sm cursor-se-resize flex items-center justify-center shadow-md"
                            onMouseDown={(e) => handleResizeMouseDown(e, field.id)}
                          >
                            <svg width="6" height="6" viewBox="0 0 6 6" fill="none" className="text-primary-foreground">
                              <path d="M5 1L1 5M5 3L3 5M5 5L5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Crosshair indicator for tool mode */}
                {activeTool !== 'select' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="text-gray-300 dark:text-gray-600 text-center">
                      <MousePointer2 className="h-8 w-8 mx-auto mb-2 rotate-90" />
                      <p className="text-sm">Click to place {activeTool} field</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Field Properties */}
        <div className="w-64 shrink-0 border-l bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
          {/* Properties header */}
          <div className="p-3 border-b bg-background">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Properties</h3>
              <Badge variant="secondary" className="text-[10px]">{fields.length} fields</Badge>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {selectedFieldData ? (
              <div className="p-3 space-y-4">
                {/* Selected field type badge */}
                <div className="flex items-center gap-2">
                  <Badge className={`${fieldColorMap[selectedFieldData.type]?.bg} ${fieldColorMap[selectedFieldData.type]?.text} ${fieldColorMap[selectedFieldData.type]?.border} border capitalize`}>
                    {selectedFieldData.type}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive" onClick={() => removeField(selectedFieldData.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Separator />

                {/* Label */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={selectedFieldData.label}
                    onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Field Type</Label>
                  <Select
                    value={selectedFieldData.type}
                    onValueChange={(v) => updateField(selectedFieldData.id, { type: v as PlacedField['type'] })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signature">Signature</SelectItem>
                      <SelectItem value="initial">Initial</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Required */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Required</Label>
                  <Switch
                    checked={selectedFieldData.required}
                    onCheckedChange={(v) => updateField(selectedFieldData.id, { required: v })}
                  />
                </div>

                {/* Page */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Page</Label>
                  <Select
                    value={String(selectedFieldData.page)}
                    onValueChange={(v) => updateField(selectedFieldData.id, { page: Number(v) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <SelectItem key={p} value={String(p)}>Page {p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Position */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Position</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">X (%)</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedFieldData.x)}
                        onChange={(e) => updateField(selectedFieldData.id, { x: Number(e.target.value) })}
                        className="h-7 text-xs"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Y (%)</Label>
                      <Input
                        type="number"
                        value={Math.round(selectedFieldData.y)}
                        onChange={(e) => updateField(selectedFieldData.id, { y: Number(e.target.value) })}
                        className="h-7 text-xs"
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Size</p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px]">Width</Label>
                        <span className="text-[10px] text-muted-foreground">{Math.round(selectedFieldData.width)}%</span>
                      </div>
                      <Slider
                        value={[selectedFieldData.width]}
                        onValueChange={([v]) => updateField(selectedFieldData.id, { width: v })}
                        min={3}
                        max={90}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px]">Height</Label>
                        <span className="text-[10px] text-muted-foreground">{Math.round(selectedFieldData.height)}%</span>
                      </div>
                      <Slider
                        value={[selectedFieldData.height]}
                        onValueChange={([v]) => updateField(selectedFieldData.id, { height: v })}
                        min={2}
                        max={50}
                        step={1}
                      />
                    </div>
                  </div>
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Assign To</Label>
                  <Input
                    placeholder="Enter name or email"
                    value={selectedFieldData.assignedTo || ''}
                    onChange={(e) => updateField(selectedFieldData.id, { assignedTo: e.target.value || undefined })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <p className="text-xs text-muted-foreground text-center py-8">
                  Select a field to edit its properties, or use the toolbar to add new fields.
                </p>

                <Separator />

                {/* Fields list */}
                <p className="text-xs font-medium text-muted-foreground">All Fields</p>
                <div className="space-y-1">
                  {fields.map((field) => {
                    const colors = fieldColorMap[field.type] || fieldColorMap.text;
                    return (
                      <button
                        key={field.id}
                        className={`w-full text-left p-2 rounded-md text-xs transition-colors border ${
                          selectedField === field.id
                            ? 'bg-primary/10 border-primary/30'
                            : 'hover:bg-accent border-transparent'
                        }`}
                        onClick={() => {
                          setSelectedField(field.id);
                          if (field.page !== currentPage) setCurrentPage(field.page);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium capitalize ${colors.text}`}>{field.type}</span>
                          {field.required && <Badge className="h-3.5 text-[7px] px-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Req</Badge>}
                        </div>
                        <p className="text-muted-foreground mt-0.5 truncate">{field.label}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Page {field.page} · ({Math.round(field.x)}%, {Math.round(field.y)}%)</p>
                      </button>
                    );
                  })}
                  {fields.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No fields yet. Click a tool and then click on the document to add fields.
                    </p>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
