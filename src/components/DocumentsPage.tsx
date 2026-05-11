'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  ChevronRight,
  FileSignature,
  FolderOpen,
  Folder,
  Calendar,
  Tag,
  X,
  Inbox,
  Handshake,
  Receipt,
  ClipboardList,
  Scale,
  Sparkles,
  Plus,
  FolderPlus,
  ChevronLeft,
  Users,
  FileArchive,
  LayoutTemplate,
  FolderClosed,
  Menu,
  CloudUpload,
  Table2,
  AlertCircle,
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

// Category icons map
const categoryIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  'contract': { icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  'agreement': { icon: <Handshake className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'nda': { icon: <Scale className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  'invoice': { icon: <Receipt className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'hr': { icon: <User className="h-3.5 w-3.5" />, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  'legal': { icon: <ClipboardList className="h-3.5 w-3.5" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  'proposal': { icon: <Sparkles className="h-3.5 w-3.5" />, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  'finance': { icon: <Receipt className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

function getCategoryIcon(category: string) {
  const lower = (category || 'document').toLowerCase();
  return categoryIcons[lower] || { icon: <FileText className="h-3.5 w-3.5" />, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
}

// Mini circular progress indicator for signature progress
function CircularProgress({ value, size = 28 }: { value: number; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-500"
      />
    </svg>
  );
}

// "New" badge for recently created documents
function NewBadge({ createdAt }: { createdAt: string }) {
  const isNew = Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
  if (!isNew) return null;
  return (
    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] px-1.5 py-0 border-0 animate-pulse">
      NEW
    </Badge>
  );
}

// Signature progress bar component
function SignatureProgressBar({ doc }: { doc: Document }) {
  const total = doc.recipients.length || doc.signatures.length || 1;
  const completed = doc.signatures.filter(s => s.signedAt).length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <CircularProgress value={percentage} size={24} />
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
  const totalSigners = document.recipients.length || document.signatures.length;
  const category = document.tags?.[0] || document.folder || 'Document';
  const catIcon = getCategoryIcon(category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.15 }}
      >
      <Card
        className={`cursor-pointer group relative overflow-hidden rounded-xl transition-shadow duration-200 ${
          selected ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-border hover:shadow-lg hover:shadow-emerald-500/5'
        }`}
        onClick={onClick}
      >
        {/* Gradient border effect on selected */}
        {selected && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 pointer-events-none" />
        )}
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
          {/* Thumbnail preview area with gradient overlay */}
          <div className="bg-muted/30 rounded-lg border border-border h-28 flex items-center justify-center mb-3 relative overflow-hidden">
            <FileText className="h-10 w-10 text-muted-foreground/20" />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card/80 to-transparent" />
            {/* Category badge with icon */}
            <Badge
              className={`absolute top-2 right-2 text-[9px] capitalize border-0 flex items-center gap-1 ${catIcon.color}`}
            >
              {catIcon.icon}
              {category}
            </Badge>
            {/* New badge */}
            <div className="absolute top-2 left-2">
              <NewBadge createdAt={document.createdAt} />
            </div>
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
    </motion.div>
  );
}

// Enhanced Document Table Row
function EnhancedDocumentTableRow({
  document,
  onClick,
  selected,
  onToggleSelect,
  index,
}: {
  document: Document;
  onClick: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  index: number;
}) {
  const category = document.tags?.[0] || document.folder || 'Document';
  const signedCount = document.signatures.filter(s => s.signedAt).length;
  const totalSigners = document.recipients.length || document.signatures.length;
  const catIcon = getCategoryIcon(category);
  const isEven = index % 2 === 0;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={`cursor-pointer hover:bg-accent/50 border-b border-border transition-colors ${
        isEven ? 'bg-muted/20' : ''
      } ${selected ? 'bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/20' : ''}`}
      onClick={onClick}
      whileHover={{ backgroundColor: 'var(--accent)' }}
    >
      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-1.5 shrink-0 flex items-center justify-center ${catIcon.color}`}>
            {catIcon.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate max-w-[280px]">{document.title}</p>
              <NewBadge createdAt={document.createdAt} />
            </div>
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
            <CircularProgress value={(signedCount / totalSigners) * 100} size={22} />
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
            <Button variant="ghost" size="icon" className="h-8 w-8 btn-click-scale">
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

// ============================================================
// Folder Types & Data
// ============================================================

interface FolderItem {
  id: string;
  name: string;
  icon: React.ElementType;
  count?: number;
  children?: FolderItem[];
  isRoot?: boolean;
}

const folderTree: FolderItem[] = [
  {
    id: 'all',
    name: 'All Documents',
    icon: FolderOpen,
    count: 47,
    isRoot: true,
  },
  {
    id: 'my',
    name: 'My Documents',
    icon: FileText,
    count: 23,
    isRoot: true,
  },
  {
    id: 'shared',
    name: 'Shared With Me',
    icon: Users,
    count: 12,
    isRoot: true,
  },
  {
    id: 'templates',
    name: 'Templates',
    icon: LayoutTemplate,
    count: 8,
    isRoot: true,
  },
  {
    id: 'archive',
    name: 'Archive',
    icon: FileArchive,
    count: 5,
    isRoot: true,
  },
  {
    id: 'categories',
    name: 'Categories',
    icon: Folder,
    isRoot: false,
    children: [
      { id: 'cat-contracts', name: 'Contracts', icon: FileText, count: 14 },
      { id: 'cat-agreements', name: 'Agreements', icon: Handshake, count: 9 },
      { id: 'cat-ndas', name: 'NDAs', icon: Scale, count: 7 },
      { id: 'cat-proposals', name: 'Proposals', icon: Sparkles, count: 5 },
      { id: 'cat-invoices', name: 'Invoices', icon: Receipt, count: 8 },
      { id: 'cat-hr', name: 'HR', icon: User, count: 6 },
      { id: 'cat-legal', name: 'Legal', icon: ClipboardList, count: 4 },
    ],
  },
];

// Custom folders that users create (stored in state)
const initialCustomFolders: FolderItem[] = [];

// ============================================================
// Folder Sidebar Component
// ============================================================

function FolderSidebar({
  activeFolder,
  onFolderSelect,
  customFolders,
  onCreateFolder,
}: {
  activeFolder: string;
  onFolderSelect: (id: string) => void;
  customFolders: FolderItem[];
  onCreateFolder: (name: string) => void;
}) {
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [customOpen, setCustomOpen] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setCreateDialogOpen(false);
      toast.success(`Folder "${newFolderName.trim()}" created`);
    }
  };

  const allFolders = [...folderTree];
  if (customFolders.length > 0) {
    allFolders.push({
      id: 'custom',
      name: 'Custom Folders',
      icon: FolderPlus,
      isRoot: false,
      children: customFolders,
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Create Folder Button */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full mb-3 btn-click-scale gap-2">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new document folder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="bg-primary hover:bg-primary/90">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Separator className="mb-2" />

      {/* Folder Tree */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-0.5">
          {allFolders.map((folder) => {
            // Root folders (no children)
            if (!folder.children) {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.id;
              return (
                <motion.button
                  key={folder.id}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onFolderSelect(folder.id)}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-all text-sm group ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium shadow-sm'
                      : 'hover:bg-accent/50 text-foreground/80 hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                  <span className="flex-1 truncate">{folder.name}</span>
                  {folder.count !== undefined && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] h-5 min-w-[20px] justify-center px-1.5 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {folder.count}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="w-1 h-4 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
                  )}
                </motion.button>
              );
            }

            // Parent folders with children (collapsible)
            const Icon = folder.icon;
            const isOpen = folder.id === 'categories' ? categoriesOpen : customOpen;
            const setOpen = folder.id === 'categories' ? setCategoriesOpen : setCustomOpen;
            const hasActiveChild = folder.children?.some(c => c.id === activeFolder);

            return (
              <Collapsible key={folder.id} open={isOpen} onOpenChange={setOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent/30 transition-all">
                    <motion.div
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </motion.div>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1">{folder.name}</span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-3 pl-2 border-l border-border space-y-0.5 mt-0.5">
                    {folder.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = activeFolder === child.id;
                      return (
                        <motion.button
                          key={child.id}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onFolderSelect(child.id)}
                          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left transition-all text-xs group ${
                            isChildActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium'
                              : 'hover:bg-accent/50 text-foreground/70 hover:text-foreground'
                          }`}
                        >
                          <ChildIcon className={`h-3.5 w-3.5 shrink-0 ${isChildActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                          <span className="flex-1 truncate">{child.name}</span>
                          {child.count !== undefined && (
                            <Badge
                              variant="secondary"
                              className={`text-[9px] h-4 min-w-[18px] justify-center px-1 ${
                                isChildActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {child.count}
                            </Badge>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================
// Get folder name from ID
// ============================================================

function getFolderName(folderId: string, customFolders: FolderItem[]): string {
  for (const f of folderTree) {
    if (f.id === folderId) return f.name;
    if (f.children) {
      for (const c of f.children) {
        if (c.id === folderId) return c.name;
      }
    }
  }
  for (const f of customFolders) {
    if (f.id === folderId) return f.name;
  }
  return 'Documents';
}

// Get folder breadcrumb path
function getFolderBreadcrumb(folderId: string, customFolders: FolderItem[]): string[] {
  if (folderId === 'all') return ['All Documents'];
  for (const f of folderTree) {
    if (f.id === folderId) return [f.name];
    if (f.children) {
      for (const c of f.children) {
        if (c.id === folderId) return ['Categories', c.name];
      }
    }
  }
  for (const f of customFolders) {
    if (f.id === folderId) return ['Custom Folders', f.name];
  }
  return ['Documents'];
}

// ============================================================
// Main Documents Page
// ============================================================

export function DocumentsPage() {
  const { navigate } = useAppStore();
  const queryClient = useQueryClient();

  const [view, setView] = useState<'grid' | 'list' | 'table'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<DocumentPriority[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState<Document | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Folder state
  const [activeFolder, setActiveFolder] = useState('all');
  const [customFolders, setCustomFolders] = useState<FolderItem[]>(initialCustomFolders);
  const [mobileFolderOpen, setMobileFolderOpen] = useState(false);

  // Drag & drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Drag & drop handlers
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragOver(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragOver(false);
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      // Files could be handled here with e.dataTransfer.files
    };
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

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

  // Handle folder selection - map folder to category filter
  const handleFolderSelect = useCallback((folderId: string) => {
    setActiveFolder(folderId);
    setMobileFolderOpen(false);

    // Map folder IDs to category filter
    const folderCategoryMap: Record<string, string> = {
      'cat-contracts': 'contract',
      'cat-agreements': 'agreement',
      'cat-ndas': 'nda',
      'cat-proposals': 'proposal',
      'cat-invoices': 'invoice',
      'cat-hr': 'hr',
      'cat-legal': 'legal',
    };

    if (folderId in folderCategoryMap) {
      setCategoryFilter(folderCategoryMap[folderId]);
    } else if (folderId === 'all' || folderId === 'my' || folderId === 'shared' || folderId === 'templates' || folderId === 'archive') {
      setCategoryFilter('');
    }
  }, []);

  // Create custom folder
  const handleCreateFolder = useCallback((name: string) => {
    const id = `custom-${Date.now()}`;
    setCustomFolders(prev => [...prev, { id, name, icon: FolderClosed, count: 0 }]);
  }, []);

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

    // Folder-specific filters
    if (activeFolder === 'my') {
      docs = docs.filter(d => d.owner.name === 'John Doe'); // Mock: current user
    } else if (activeFolder === 'shared') {
      docs = docs.filter(d => d.owner.name !== 'John Doe'); // Mock: shared by others
    } else if (activeFolder === 'archive') {
      docs = docs.filter(d => d.status === 'voided' || d.status === 'expired');
    } else if (activeFolder === 'templates') {
      docs = docs.filter(d => d.tags?.includes('template'));
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const nowMs = Date.now();
      const cutoff = new Date(
        dateRangeFilter === 'today' ? nowMs - 24 * 60 * 60 * 1000 :
        dateRangeFilter === 'week' ? nowMs - 7 * 24 * 60 * 60 * 1000 :
        dateRangeFilter === 'month' ? nowMs - 30 * 24 * 60 * 60 * 1000 :
        nowMs - 90 * 24 * 60 * 60 * 1000
      );
      docs = docs.filter(d => new Date(d.createdAt).getTime() >= cutoff.getTime());
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
  }, [documents, search, statusFilter, priorityFilter, categoryFilter, dateRangeFilter, sortBy, activeFolder]);

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
    setDateRangeFilter('all');
    setActiveFolder('all');
  };

  const hasActiveFilters = statusFilter.length > 0 || priorityFilter.length > 0 || categoryFilter !== '' || dateRangeFilter !== 'all' || activeFolder !== 'all';

  // Bulk actions
  const handleBulkArchive = () => {
    toast.success(`${selectedDocs.size} document(s) archived`);
    setSelectedDocs(new Set());
  };

  const handleBulkDelete = () => {
    toast.success(`${selectedDocs.size} document(s) deleted`);
    setSelectedDocs(new Set());
  };

  const noDocsAtAll = !isLoading && filteredDocuments.length === 0 && !hasActiveFilters;

  // Folder breadcrumb
  const breadcrumb = getFolderBreadcrumb(activeFolder, customFolders);

  return (
    <div className="space-y-6 relative">
      {/* Drag & drop overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <div className="drop-zone active rounded-2xl p-16 flex flex-col items-center gap-4 max-w-lg mx-auto">
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4">
                <CloudUpload className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">Drag & drop files here to upload</h3>
                <p className="text-sm text-muted-foreground mt-1">Supports PDF, DOCX, XLSX, and image files</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Upload className="h-3.5 w-3.5" />
                <span>Release to upload your documents</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <div className={noDocsAtAll ? 'animate-pulse' : ''}>
          <motion.div
            animate={noDocsAtAll ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative group"
          >
            {/* Gradient background with shimmer effect for upload button */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-lg opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300 animate-pulse" />
            <div className="relative">
              <DocumentUploadDialog />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Folder Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1.5 text-sm"
      >
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <span className={i === breadcrumb.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
              {crumb}
            </span>
          </span>
        ))}
      </motion.div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Desktop Folder Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="hidden lg:block w-[200px] shrink-0"
        >
          <Card className="p-3 sticky top-6">
            <FolderSidebar
              activeFolder={activeFolder}
              onFolderSelect={handleFolderSelect}
              customFolders={customFolders}
              onCreateFolder={handleCreateFolder}
            />
          </Card>
        </motion.aside>

        {/* Mobile Folder Sheet */}
        <div className="lg:hidden">
          <Sheet open={mobileFolderOpen} onOpenChange={setMobileFolderOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 mb-3">
                <Menu className="h-4 w-4" />
                Folders
                {activeFolder !== 'all' && (
                  <Badge className="ml-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] px-1.5 border-0">
                    {getFolderName(activeFolder, customFolders)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  Document Folders
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FolderSidebar
                  activeFolder={activeFolder}
                  onFolderSelect={handleFolderSelect}
                  customFolders={customFolders}
                  onCreateFolder={handleCreateFolder}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Search bar & quick filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 transition-shadow duration-200 focus-visible:shadow-[0_0_0_2px_rgba(16,185,129,0.2),0_0_15px_rgba(16,185,129,0.1)]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick dropdown filters */}
              <Select value={statusFilter.length > 0 ? statusFilter[0] : 'all'} onValueChange={(v) => { if (v === 'all') setStatusFilter([]); else setStatusFilter([v as DocumentStatus]); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter.length > 0 ? priorityFilter[0] : 'all'} onValueChange={(v) => { if (v === 'all') setPriorityFilter([]); else setPriorityFilter([v as DocumentPriority]); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-36">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
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
                className="btn-click-scale"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                    {statusFilter.length + priorityFilter.length + (categoryFilter ? 1 : 0) + (dateRangeFilter !== 'all' ? 1 : 0)}
                  </Badge>
                )}
              </Button>

              {/* View toggle - Grid/List/Table with smooth transition */}
              <div className="flex border border-border rounded-md">
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className={`h-9 w-9 rounded-r-none btn-click-scale ${view === 'grid' ? 'toolbar-btn-active' : ''}`}
                  onClick={() => setView('grid')}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className={`h-9 w-9 rounded-none border-x border-border btn-click-scale ${view === 'list' ? 'toolbar-btn-active' : ''}`}
                  onClick={() => setView('list')}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  className={`h-9 w-9 rounded-l-none btn-click-scale ${view === 'table' ? 'toolbar-btn-active' : ''}`}
                  onClick={() => setView('table')}
                  title="Table view"
                >
                  <Table2 className="h-4 w-4" />
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
                            className="w-full btn-click-scale"
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
              {activeFolder !== 'all' && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors btn-click-scale bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  onClick={() => { setActiveFolder('all'); setCategoryFilter(''); }}
                >
                  <FolderOpen className="mr-1 h-3 w-3" />
                  {getFolderName(activeFolder, customFolders)} ×
                </Badge>
              )}
              {statusFilter.map((status) => (
                <Badge
                  key={status}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors capitalize btn-click-scale"
                  onClick={() => toggleStatusFilter(status)}
                >
                  {status} ×
                </Badge>
              ))}
              {priorityFilter.map((priority) => (
                <Badge
                  key={priority}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors capitalize btn-click-scale"
                  onClick={() => togglePriorityFilter(priority)}
                >
                  {priority} ×
                </Badge>
              ))}
              {categoryFilter && activeFolder === 'all' && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors capitalize btn-click-scale"
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
                  <Button size="sm" variant="outline" onClick={handleBulkArchive} className="btn-click-scale">
                    <Archive className="mr-1.5 h-3.5 w-3.5" />Archive
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive btn-click-scale" onClick={handleBulkDelete}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedDocs(new Set())} className="btn-click-scale">
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
            /* Empty state with illustration */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <motion.div
                className="mx-auto w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Inbox className="h-10 w-10 text-muted-foreground/30" />
              </motion.div>
              <h3 className="text-lg font-medium mb-1">No documents found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                {hasActiveFilters
                  ? "No documents match your current filters. Try adjusting or clearing them."
                  : "Get started by uploading your first document or creating one from a template."}
              </p>
              <div className="flex gap-3 justify-center">
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearAllFilters} className="btn-click-scale">
                    Clear Filters
                  </Button>
                ) : (
                  <>
                    <DocumentUploadDialog />
                    <Button variant="outline" onClick={() => navigate('templates')} className="btn-click-scale">
                      <FileSignature className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          ) : view === 'grid' ? (
            /* Grid view */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredDocuments.map((doc, i) => (
                  <div
                    key={doc.id}
                    onMouseEnter={(e) => { setHoveredDoc(doc); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                    onMouseLeave={() => { setHoveredDoc(null); setTooltipPos(null); }}
                  >
                    <EnhancedDocumentCard
                      document={doc}
                      onClick={() => navigate('document-detail', { id: doc.id })}
                      selected={selectedDocs.has(doc.id)}
                      onToggleSelect={() => toggleSelectDoc(doc.id)}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          ) : view === 'table' ? (
            /* Compact table view (no expandable rows, just key info) */
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredDocuments.map((doc, i) => {
                      const cat = doc.tags?.[0] || doc.folder || 'Document';
                      const catIcon = getCategoryIcon(cat);
                      const isEven = i % 2 === 0;
                      return (
                        <motion.tr
                          key={doc.id}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                          className={`cursor-pointer hover:bg-accent/50 border-b border-border transition-colors ${isEven ? 'bg-muted/20' : ''} ${selectedDocs.has(doc.id) ? 'bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/20' : ''}`}
                          onClick={() => navigate('document-detail', { id: doc.id })}
                          onMouseEnter={(e) => { setHoveredDoc(doc); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                          onMouseLeave={() => { setHoveredDoc(null); setTooltipPos(null); }}
                        >
                          <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selectedDocs.has(doc.id)} onCheckedChange={() => toggleSelectDoc(doc.id)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`rounded-md p-1 shrink-0 flex items-center justify-center ${catIcon.color}`}>
                                {catIcon.icon}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[200px]">{doc.title}</p>
                                <p className="text-[10px] text-muted-foreground">{doc.fileName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                  {doc.owner.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{doc.owner.name}</span>
                            </div>
                          </TableCell>
                          <TableCell><StatusBadge status={doc.status} /></TableCell>
                          <TableCell><PriorityBadge priority={doc.priority} /></TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] h-4 capitalize px-1.5 py-0">
                              {cat}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 btn-click-scale">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate('document-detail', { id: doc.id }); }}>
                                  <Eye className="mr-2 h-4 w-4" />View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <Send className="mr-2 h-4 w-4" />Send
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
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </Card>
          ) : (
            /* List view */
            <Card className="overflow-hidden">
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
                    {filteredDocuments.map((doc, i) => (
                      <div
                        key={doc.id}
                        onMouseEnter={(e) => { setHoveredDoc(doc); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
                        onMouseLeave={() => { setHoveredDoc(null); setTooltipPos(null); }}
                      >
                        <EnhancedDocumentTableRow
                          document={doc}
                          onClick={() => navigate('document-detail', { id: doc.id })}
                          selected={selectedDocs.has(doc.id)}
                          onToggleSelect={() => toggleSelectDoc(doc.id)}
                          index={i}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Document Preview Tooltip */}
          <AnimatePresence>
            {hoveredDoc && tooltipPos && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="tooltip-rich fixed z-[100] rounded-xl p-4 w-72 pointer-events-none"
                style={{
                  left: Math.min(tooltipPos.x + 12, window.innerWidth - 300),
                  top: Math.min(tooltipPos.y + 12, window.innerHeight - 280),
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-md bg-primary/10 p-1.5 shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{hoveredDoc.title}</p>
                    <p className="text-[10px] text-muted-foreground">{hoveredDoc.fileName}</p>
                  </div>
                </div>
                <div className="divider-gradient my-2" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Status</span>
                    <StatusBadge status={hoveredDoc.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Priority</span>
                    <PriorityBadge priority={hoveredDoc.priority} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Owner</span>
                    <span className="text-xs font-medium">{hoveredDoc.owner.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Size</span>
                    <span className="text-xs">{formatFileSize(hoveredDoc.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Updated</span>
                    <span className="text-xs">{formatDistanceToNow(new Date(hoveredDoc.updatedAt), { addSuffix: true })}</span>
                  </div>
                  {hoveredDoc.recipients.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">Recipients</span>
                      <div className="flex -space-x-1">
                        {hoveredDoc.recipients.slice(0, 3).map((r, ri) => (
                          <Avatar key={ri} className="h-5 w-5 border border-background">
                            <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                              {r.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {hoveredDoc.recipients.length > 3 && (
                          <span className="text-[9px] text-muted-foreground ml-2">+{hoveredDoc.recipients.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground text-center">Click to view full details</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
