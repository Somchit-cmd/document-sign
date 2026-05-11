'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { api, mockDocuments, formatFileSize } from '@/lib/api';
import type { Document, DocumentStatus, DocumentPriority } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import {
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Filter,
  Upload,
  FileText,
  Clock,
  User,
  MoreHorizontal,
  Eye,
  Send,
  Trash2,
  Archive,
  CheckSquare,
  XSquare,
  ChevronDown,
  FileSignature,
  FolderOpen,
  Calendar,
  Tag,
  X,
  Inbox,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

const statusOptions: { value: DocumentStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'sent', label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'viewed', label: 'Viewed', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { value: 'signed', label: 'Signed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'expired', label: 'Expired', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'voided', label: 'Voided', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
];

const priorityOptions: { value: DocumentPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const categoryOptions = [
  'Contract', 'Agreement', 'NDA', 'Proposal', 'Invoice', 'HR', 'Legal', 'Finance',
];

// Signature progress bar component
function SignatureProgressBar({ doc }: { doc: Document }) {
  const total = doc.recipients.length || doc.signatures.length || 1;
  const completed = doc.signatures.filter(s => s.signedAt).length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <Progress value={percentage} className="h-1.5 flex-1" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {completed}/{total}
      </span>
    </div>
  );
}

// Enhanced Document Card with thumbnail, category badge, signature progress
function EnhancedDocumentCard({
  document,
  onClick,
  selected,
  onToggleSelect,
}: {
  document: Document;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const signedCount = document.signatures.filter(s => s.signedAt).length;
  const totalSigners = document.recipients.length || document.signatures.length;
  const category = document.tags?.[0] || document.folder || 'Document';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group relative ${
          selected ? 'ring-2 ring-primary shadow-md' : ''
        }`}
        onClick={onClick}
      >
        {/* Selection checkbox */}
        <div
          className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        >
          <div className={`rounded-md border-2 ${selected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background'} p-0.5`}>
            {selected && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Thumbnail preview area */}
          <div className="bg-muted/30 rounded-lg border border-border h-28 flex items-center justify-center mb-3 relative overflow-hidden">
            <FileText className="h-10 w-10 text-muted-foreground/20" />
            {/* Category badge */}
            <Badge
              className="absolute top-2 right-2 text-[9px] capitalize bg-primary/10 text-primary border-0"
              variant="outline"
            >
              {category}
            </Badge>
            {/* File type indicator */}
            <div className="absolute bottom-1 right-2 text-[9px] text-muted-foreground font-mono">
              {document.fileType?.split('/').pop()?.toUpperCase() || 'PDF'}
            </div>
          </div>

          {/* Title & Info */}
          <div className="min-w-0 mb-2">
            <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {document.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {document.fileName} · {formatFileSize(document.fileSize)}
            </p>
          </div>

          {/* Status & Priority */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <StatusBadge status={document.status} />
            <PriorityBadge priority={document.priority} />
          </div>

          {/* Signature progress */}
          {totalSigners > 0 && (
            <SignatureProgressBar doc={document} />
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[6px] bg-primary/10 text-primary">
                  {document.owner.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[80px]">{document.owner.name}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Enhanced Document Table Row
function EnhancedDocumentTableRow({
  document,
  onClick,
  selected,
  onToggleSelect,
}: {
  document: Document;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const category = document.tags?.[0] || document.folder || 'Document';
  const signedCount = document.signatures.filter(s => s.signedAt).length;
  const totalSigners = document.recipients.length || document.signatures.length;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`cursor-pointer hover:bg-accent/50 border-b border-border ${
        selected ? 'bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-1.5 shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[280px]">{document.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{document.fileName}</span>
              <Badge variant="outline" className="text-[9px] h-4 capitalize px-1.5 py-0">
                {category}
              </Badge>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={document.status} />
      </TableCell>
      <TableCell>
        <PriorityBadge priority={document.priority} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {document.owner.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{document.owner.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {totalSigners > 0 ? (
          <div className="flex items-center gap-2 min-w-[100px]">
            <Progress value={(signedCount / totalSigners) * 100} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{signedCount}/{totalSigners}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
      </TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
              <Eye className="mr-2 h-4 w-4" />View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Send className="mr-2 h-4 w-4" />Send
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Archive className="mr-2 h-4 w-4" />Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  );
}

export function DocumentsPage() {
  const { navigate } = useAppStore();
  const queryClient = useQueryClient();

  const [view, setView] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<DocumentPriority[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Fetch documents from API
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', search, statusFilter, sortBy],
    queryFn: async () => {
      const res = await api.getDocuments({
        status: statusFilter.length > 0 ? statusFilter : undefined,
        search: search || undefined,
        pageSize: 50,
      }, {
        field: sortBy as 'title' | 'status' | 'priority' | 'createdAt' | 'updatedAt' | 'expiresAt',
        direction: 'desc',
      });
      if (res.success && res.data && res.data.items.length > 0) return res.data.items;
      return mockDocuments;
    },
    staleTime: 30 * 1000,
  });

  const documents = documentsData || mockDocuments;

  const filteredDocuments = useMemo(() => {
    let docs = [...documents];

    // Client-side search fallback
    if (search) {
      const q = search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          d.owner.name.toLowerCase().includes(q)
      );
    }

    // Client-side status filter
    if (statusFilter.length > 0) {
      docs = docs.filter((d) => statusFilter.includes(d.status));
    }

    // Priority filter
    if (priorityFilter.length > 0) {
      docs = docs.filter((d) => priorityFilter.includes(d.priority));
    }

    // Category filter
    if (categoryFilter) {
      docs = docs.filter(
        (d) =>
          d.tags?.some((t) => t.toLowerCase() === categoryFilter.toLowerCase()) ||
          d.folder?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Sort
    docs.sort((a, b) => {
      if (sortBy === 'updatedAt') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'priority') {
        const order = { urgent: 0, high: 1, normal: 2, low: 3 };
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      }
      return 0;
    });

    return docs;
  }, [documents, search, statusFilter, priorityFilter, categoryFilter, sortBy]);

  const toggleStatusFilter = (status: DocumentStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: DocumentPriority) => {
    setPriorityFilter((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const toggleSelectDoc = useCallback((id: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map((d) => d.id)));
    }
  }, [filteredDocuments, selectedDocs]);

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter([]);
    setPriorityFilter([]);
    setCategoryFilter('');
  };

  const hasActiveFilters = statusFilter.length > 0 || priorityFilter.length > 0 || categoryFilter !== '';

  // Bulk actions
  const handleBulkArchive = () => {
    toast.success(`${selectedDocs.size} document(s) archived`);
    setSelectedDocs(new Set());
  };

  const handleBulkDelete = () => {
    toast.success(`${selectedDocs.size} document(s) deleted`);
    setSelectedDocs(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <DocumentUploadDialog />
      </div>

      {/* Search bar & quick filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Last Updated</SelectItem>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter panel toggle */}
          <Button
            variant={hasActiveFilters ? 'secondary' : 'outline'}
            size="default"
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                {statusFilter.length + priorityFilter.length + (categoryFilter ? 1 : 0)}
              </Badge>
            )}
          </Button>

          {/* View toggle */}
          <div className="flex border border-border rounded-md">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsible advanced filter panel */}
      <Collapsible open={filterPanelOpen} onOpenChange={setFilterPanelOpen}>
        <AnimatePresence>
          {filterPanelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Status filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5" /> Status
                    </Label>
                    <div className="space-y-2">
                      {statusOptions.map((option) => (
                        <div key={option.value} className="flex items-center gap-2">
                          <Checkbox
                            id={`status-${option.value}`}
                            checked={statusFilter.includes(option.value)}
                            onCheckedChange={() => toggleStatusFilter(option.value)}
                          />
                          <Label
                            htmlFor={`status-${option.value}`}
                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                          >
                            <span className={`h-2 w-2 rounded-full ${option.color.split(' ')[0]}`} />
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5" /> Priority
                    </Label>
                    <div className="space-y-2">
                      {priorityOptions.map((option) => (
                        <div key={option.value} className="flex items-center gap-2">
                          <Checkbox
                            id={`priority-${option.value}`}
                            checked={priorityFilter.includes(option.value)}
                            onCheckedChange={() => togglePriorityFilter(option.value)}
                          />
                          <Label
                            htmlFor={`priority-${option.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FolderOpen className="h-3.5 w-3.5" /> Category
                    </Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categoryOptions.map((cat) => (
                          <SelectItem key={cat} value={cat.toLowerCase()}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear filters */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Actions</Label>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={clearAllFilters}
                        disabled={!hasActiveFilters}
                      >
                        <X className="mr-2 h-3.5 w-3.5" />
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Collapsible>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          {statusFilter.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors capitalize"
              onClick={() => toggleStatusFilter(status)}
            >
              {status} ×
            </Badge>
          ))}
          {priorityFilter.map((priority) => (
            <Badge
              key={priority}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors capitalize"
              onClick={() => togglePriorityFilter(priority)}
            >
              {priority} ×
            </Badge>
          ))}
          {categoryFilter && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors capitalize"
              onClick={() => setCategoryFilter('')}
            >
              {categoryFilter} ×
            </Badge>
          )}
        </div>
      )}

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedDocs.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedDocs.size} selected</span>
              <Separator orientation="vertical" className="h-5" />
              <Button size="sm" variant="outline" onClick={handleBulkArchive}>
                <Archive className="mr-1.5 h-3.5 w-3.5" />Archive
              </Button>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedDocs(new Set())}>
                <XSquare className="mr-1.5 h-3.5 w-3.5" />Deselect All
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-28 w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-1">No documents found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            {hasActiveFilters
              ? "No documents match your current filters. Try adjusting or clearing them."
              : "Get started by uploading your first document or creating one from a template."}
          </p>
          <div className="flex gap-3 justify-center">
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            ) : (
              <>
                <DocumentUploadDialog />
                <Button variant="outline" onClick={() => navigate('templates')}>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Use Template
                </Button>
              </>
            )}
          </div>
        </motion.div>
      ) : view === 'grid' ? (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredDocuments.map((doc) => (
              <EnhancedDocumentCard
                key={doc.id}
                document={doc}
                onClick={() => navigate('document-detail', { id: doc.id })}
                selected={selectedDocs.has(doc.id)}
                onToggleSelect={() => toggleSelectDoc(doc.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List view */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Signatures</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredDocuments.map((doc) => (
                  <EnhancedDocumentTableRow
                    key={doc.id}
                    document={doc}
                    onClick={() => navigate('document-detail', { id: doc.id })}
                    selected={selectedDocs.has(doc.id)}
                    onToggleSelect={() => toggleSelectDoc(doc.id)}
                  />
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
