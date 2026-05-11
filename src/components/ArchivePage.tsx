'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';
import {
  Archive,
  Download,
  FileText,
  Search,
  Filter,
  Grid3X3,
  List,
  Table2,
  MoreVertical,
  Eye,
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  HardDrive,
  Clock,
  TrendingUp,
  FileDown,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Users,
  Building2,
  Hash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// --- Types ---
type DocType = 'Contract' | 'NDA' | 'Agreement' | 'Proposal' | 'Invoice' | 'PO' | 'Amendment' | 'Lease';
type ArchiveStatus = 'Completed' | 'Expired' | 'Voided' | 'Archived';
type ViewMode = 'grid' | 'list' | 'table';
type ExportFormat = 'csv' | 'pdf' | 'json';

interface ArchivedDocument {
  id: string;
  title: string;
  type: DocType;
  status: ArchiveStatus;
  completedDate: Date;
  signersCount: number;
  fileSize: string;
  fileSizeBytes: number;
  retentionExpiry: Date;
  tags: string[];
  department: string;
  signer: string;
  archivedDate: Date;
  description: string;
}

// --- Mock Data ---
const mockArchivedDocs: ArchivedDocument[] = [
  {
    id: 'arch-001',
    title: 'Master Service Agreement - InnovateTech',
    type: 'Agreement',
    status: 'Completed',
    completedDate: new Date('2025-01-15'),
    signersCount: 4,
    fileSize: '3.2 MB',
    fileSizeBytes: 3355443,
    retentionExpiry: new Date('2030-01-15'),
    tags: ['enterprise', 'tech', 'multi-year'],
    department: 'Legal',
    signer: 'Sarah Chen',
    archivedDate: new Date('2025-02-01'),
    description: 'Master service agreement for cloud infrastructure services.',
  },
  {
    id: 'arch-002',
    title: 'Non-Disclosure Agreement - DataFlow Corp',
    type: 'NDA',
    status: 'Completed',
    completedDate: new Date('2024-12-20'),
    signersCount: 2,
    fileSize: '1.1 MB',
    fileSizeBytes: 1153434,
    retentionExpiry: new Date('2029-12-20'),
    tags: ['mutual-nda', 'confidential'],
    department: 'Legal',
    signer: 'David Kim',
    archivedDate: new Date('2025-01-05'),
    description: 'Mutual non-disclosure agreement for data sharing partnership.',
  },
  {
    id: 'arch-003',
    title: 'Vendor Contract Q4 2024 - CloudNet',
    type: 'Contract',
    status: 'Completed',
    completedDate: new Date('2024-11-30'),
    signersCount: 3,
    fileSize: '4.7 MB',
    fileSizeBytes: 4928307,
    retentionExpiry: new Date('2029-11-30'),
    tags: ['vendor', 'cloud', 'q4'],
    department: 'Procurement',
    signer: 'Michael Torres',
    archivedDate: new Date('2024-12-15'),
    description: 'Q4 2024 vendor contract for cloud networking services.',
  },
  {
    id: 'arch-004',
    title: 'Partnership Proposal - GlobalTech',
    type: 'Proposal',
    status: 'Expired',
    completedDate: new Date('2024-09-10'),
    signersCount: 2,
    fileSize: '2.8 MB',
    fileSizeBytes: 2936013,
    retentionExpiry: new Date('2025-09-10'),
    tags: ['partnership', 'expired'],
    department: 'Business Dev',
    signer: 'Rachel Adams',
    archivedDate: new Date('2024-10-01'),
    description: 'Strategic partnership proposal that expired without acceptance.',
  },
  {
    id: 'arch-005',
    title: 'Employment Agreement - Lisa Park',
    type: 'Agreement',
    status: 'Completed',
    completedDate: new Date('2025-01-22'),
    signersCount: 2,
    fileSize: '1.5 MB',
    fileSizeBytes: 1572864,
    retentionExpiry: new Date('2032-01-22'),
    tags: ['hr', 'employment', 'new-hire'],
    department: 'HR',
    signer: 'Lisa Park',
    archivedDate: new Date('2025-02-05'),
    description: 'Employment agreement for senior developer position.',
  },
  {
    id: 'arch-006',
    title: 'Office Lease Amendment - Floor 12',
    type: 'Amendment',
    status: 'Completed',
    completedDate: new Date('2024-10-15'),
    signersCount: 2,
    fileSize: '2.1 MB',
    fileSizeBytes: 2202009,
    retentionExpiry: new Date('2029-10-15'),
    tags: ['lease', 'amendment', 'office'],
    department: 'Facilities',
    signer: 'John Martinez',
    archivedDate: new Date('2024-11-01'),
    description: 'Lease amendment for additional office space on floor 12.',
  },
  {
    id: 'arch-007',
    title: 'Purchase Order #PO-2024-447',
    type: 'PO',
    status: 'Completed',
    completedDate: new Date('2024-08-25'),
    signersCount: 1,
    fileSize: '0.8 MB',
    fileSizeBytes: 838861,
    retentionExpiry: new Date('2027-08-25'),
    tags: ['purchase', 'equipment'],
    department: 'Procurement',
    signer: 'James Wilson',
    archivedDate: new Date('2024-09-10'),
    description: 'Purchase order for IT equipment and networking gear.',
  },
  {
    id: 'arch-008',
    title: 'Service Level Agreement - TechStart',
    type: 'Agreement',
    status: 'Voided',
    completedDate: new Date('2024-07-14'),
    signersCount: 3,
    fileSize: '3.5 MB',
    fileSizeBytes: 3670016,
    retentionExpiry: new Date('2029-07-14'),
    tags: ['sla', 'voided', 'terminated'],
    department: 'Legal',
    signer: 'Sarah Chen',
    archivedDate: new Date('2024-08-01'),
    description: 'SLA voided due to contract renegotiation with vendor.',
  },
  {
    id: 'arch-009',
    title: 'Consulting Agreement - DataFlow Corp',
    type: 'Contract',
    status: 'Expired',
    completedDate: new Date('2024-06-20'),
    signersCount: 2,
    fileSize: '2.4 MB',
    fileSizeBytes: 2516582,
    retentionExpiry: new Date('2025-06-20'),
    tags: ['consulting', 'data', 'expired'],
    department: 'IT',
    signer: 'David Kim',
    archivedDate: new Date('2024-07-05'),
    description: 'Consulting agreement for data migration project.',
  },
  {
    id: 'arch-010',
    title: 'Invoice #INV-2024-1205',
    type: 'Invoice',
    status: 'Completed',
    completedDate: new Date('2025-02-01'),
    signersCount: 1,
    fileSize: '0.5 MB',
    fileSizeBytes: 524288,
    retentionExpiry: new Date('2030-02-01'),
    tags: ['invoice', 'q1-2025', 'paid'],
    department: 'Finance',
    signer: 'Rachel Adams',
    archivedDate: new Date('2025-02-15'),
    description: 'Invoice for Q1 2025 consulting services.',
  },
  {
    id: 'arch-011',
    title: 'NDA - Quantum AI Labs',
    type: 'NDA',
    status: 'Completed',
    completedDate: new Date('2025-01-28'),
    signersCount: 3,
    fileSize: '1.3 MB',
    fileSizeBytes: 1363149,
    retentionExpiry: new Date('2030-01-28'),
    tags: ['nda', 'ai', 'research'],
    department: 'R&D',
    signer: 'Michael Torres',
    archivedDate: new Date('2025-02-10'),
    description: 'Non-disclosure agreement for AI research collaboration.',
  },
  {
    id: 'arch-012',
    title: 'Commercial Lease - 500 Market St',
    type: 'Lease',
    status: 'Archived',
    completedDate: new Date('2023-06-01'),
    signersCount: 2,
    fileSize: '5.1 MB',
    fileSizeBytes: 5347738,
    retentionExpiry: new Date('2028-06-01'),
    tags: ['lease', 'commercial', 'headquarters'],
    department: 'Facilities',
    signer: 'John Martinez',
    archivedDate: new Date('2024-06-01'),
    description: 'Commercial lease for headquarters building.',
  },
  {
    id: 'arch-013',
    title: 'Software License Agreement - CloudOS',
    type: 'Contract',
    status: 'Completed',
    completedDate: new Date('2024-11-05'),
    signersCount: 2,
    fileSize: '2.9 MB',
    fileSizeBytes: 3040870,
    retentionExpiry: new Date('2029-11-05'),
    tags: ['software', 'license', 'annual'],
    department: 'IT',
    signer: 'James Wilson',
    archivedDate: new Date('2024-11-20'),
    description: 'Annual software license agreement for CloudOS platform.',
  },
  {
    id: 'arch-014',
    title: 'Marketing Services Proposal - AdVantage',
    type: 'Proposal',
    status: 'Voided',
    completedDate: new Date('2024-04-18'),
    signersCount: 1,
    fileSize: '1.7 MB',
    fileSizeBytes: 1782579,
    retentionExpiry: new Date('2026-04-18'),
    tags: ['marketing', 'voided', 'cancelled'],
    department: 'Marketing',
    signer: 'Rachel Adams',
    archivedDate: new Date('2024-05-01'),
    description: 'Marketing services proposal voided due to budget constraints.',
  },
  {
    id: 'arch-015',
    title: 'Supplier Agreement - GreenParts Inc',
    type: 'Agreement',
    status: 'Completed',
    completedDate: new Date('2024-12-10'),
    signersCount: 3,
    fileSize: '3.8 MB',
    fileSizeBytes: 3984589,
    retentionExpiry: new Date('2029-12-10'),
    tags: ['supplier', 'sustainability'],
    department: 'Procurement',
    signer: 'Michael Torres',
    archivedDate: new Date('2024-12-28'),
    description: 'Supplier agreement for sustainable parts procurement.',
  },
];

// --- Config ---
const docTypeConfig: Record<DocType, { color: string; gradient: string; icon: typeof FileText }> = {
  Contract: { color: 'text-teal-600 dark:text-teal-400', gradient: 'from-teal-500 to-teal-600', icon: FileText },
  NDA: { color: 'text-purple-600 dark:text-purple-400', gradient: 'from-purple-500 to-purple-600', icon: ShieldCheck },
  Agreement: { color: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500 to-emerald-600', icon: FileText },
  Proposal: { color: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500 to-amber-600', icon: FileText },
  Invoice: { color: 'text-cyan-600 dark:text-cyan-400', gradient: 'from-cyan-500 to-cyan-600', icon: FileText },
  PO: { color: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-500 to-orange-600', icon: FileText },
  Amendment: { color: 'text-pink-600 dark:text-pink-400', gradient: 'from-pink-500 to-pink-600', icon: FileText },
  Lease: { color: 'text-indigo-600 dark:text-indigo-400', gradient: 'from-indigo-500 to-indigo-600', icon: FileText },
};

const statusConfig: Record<ArchiveStatus, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  Completed: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500', icon: CheckCircle2 },
  Expired: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500', icon: Clock },
  Voided: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500', icon: AlertTriangle },
  Archived: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500', icon: Archive },
};

const departments = ['All', 'Legal', 'HR', 'Procurement', 'Finance', 'IT', 'Facilities', 'Business Dev', 'R&D', 'Marketing'];
const docTypes: DocType[] = ['Contract', 'NDA', 'Agreement', 'Proposal', 'Invoice', 'PO', 'Amendment', 'Lease'];
const allStatuses: ArchiveStatus[] = ['Completed', 'Expired', 'Voided', 'Archived'];
const allTags = Array.from(new Set(mockArchivedDocs.flatMap(d => d.tags)));

// --- Helper ---
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// --- Main Component ---
export function ArchivePage() {
  const { toast } = useToast();

  // Core state
  const [documents, setDocuments] = useState<ArchivedDocument[]>(mockArchivedDocs);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<DocType>>(new Set());
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<ArchiveStatus>>(new Set());
  const [signerSearch, setSignerSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Dialog state
  const [restoreDoc, setRestoreDoc] = useState<ArchivedDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<ArchivedDocument | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportOptions, setExportOptions] = useState({
    metadata: true,
    signatures: true,
    auditTrail: false,
    comments: false,
  });
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Table sort
  const [sortField, setSortField] = useState<string>('archivedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filtered documents
  const filteredDocs = useMemo(() => {
    let result = [...documents];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        d =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.signer.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
      );
    }

    // Date range
    if (dateFrom) {
      const from = parseISO(dateFrom);
      result = result.filter(d => isAfter(d.completedDate, from) || d.completedDate.getTime() === from.getTime());
    }
    if (dateTo) {
      const to = parseISO(dateTo);
      result = result.filter(d => isBefore(d.completedDate, to) || d.completedDate.getTime() === to.getTime());
    }

    // Document type
    if (selectedTypes.size > 0) {
      result = result.filter(d => selectedTypes.has(d.type));
    }

    // Department
    if (selectedDepartment !== 'All') {
      result = result.filter(d => d.department === selectedDepartment);
    }

    // Status
    if (selectedStatuses.size > 0) {
      result = result.filter(d => selectedStatuses.has(d.status));
    }

    // Signer search
    if (signerSearch.trim()) {
      const q = signerSearch.toLowerCase();
      result = result.filter(d => d.signer.toLowerCase().includes(q));
    }

    // Tags
    if (selectedTags.size > 0) {
      result = result.filter(d => d.tags.some(t => selectedTags.has(t)));
    }

    // Table sort
    result.sort((a, b) => {
      let cmp = 0;
      const aVal: Record<string, unknown> = a as unknown as Record<string, unknown>;
      const bVal: Record<string, unknown> = b as unknown as Record<string, unknown>;

      if (sortField === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortField === 'type') cmp = a.type.localeCompare(b.type);
      else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortField === 'completedDate') cmp = a.completedDate.getTime() - b.completedDate.getTime();
      else if (sortField === 'archivedDate') cmp = a.archivedDate.getTime() - b.archivedDate.getTime();
      else if (sortField === 'signersCount') cmp = a.signersCount - b.signersCount;
      else if (sortField === 'fileSizeBytes') cmp = a.fileSizeBytes - b.fileSizeBytes;
      else if (sortField === 'department') cmp = a.department.localeCompare(b.department);
      else if (sortField === 'signer') cmp = a.signer.localeCompare(b.signer);
      else if (sortField === 'retentionExpiry') cmp = a.retentionExpiry.getTime() - b.retentionExpiry.getTime();

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [documents, searchQuery, dateFrom, dateTo, selectedTypes, selectedDepartment, selectedStatuses, signerSearch, selectedTags, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const total = documents.length;
    const totalBytes = documents.reduce((sum, d) => sum + d.fileSizeBytes, 0);
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const thisQuarter = documents.filter(d => isAfter(d.archivedDate, quarterStart) || d.archivedDate.getTime() === quarterStart.getTime()).length;
    const avgRetentionDays = documents.reduce((sum, d) => {
      const days = Math.ceil((d.retentionExpiry.getTime() - d.archivedDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0) / total;

    return {
      total,
      totalStorage: formatBytes(totalBytes),
      thisQuarter,
      avgRetention: `${Math.round(avgRetentionDays / 365 * 10) / 10} years`,
    };
  }, [documents]);

  // Handlers
  const toggleType = useCallback((t: DocType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }, []);

  const toggleStatus = useCallback((s: ArchiveStatus) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }, []);

  const toggleTag = useCallback((t: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setSelectedTypes(new Set());
    setSelectedDepartment('All');
    setSelectedStatuses(new Set());
    setSignerSearch('');
    setSelectedTags(new Set());
    setSearchQuery('');
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFrom || dateTo) count++;
    if (selectedTypes.size > 0) count++;
    if (selectedDepartment !== 'All') count++;
    if (selectedStatuses.size > 0) count++;
    if (signerSearch.trim()) count++;
    if (selectedTags.size > 0) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [dateFrom, dateTo, selectedTypes, selectedDepartment, selectedStatuses, signerSearch, selectedTags, searchQuery]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredDocs.length && filteredDocs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map(d => d.id)));
    }
  }, [selectedIds.size, filteredDocs]);

  const handleRestore = useCallback((doc: ArchivedDocument) => {
    setDocuments(prev => prev.filter(d => d.id !== doc.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(doc.id);
      return next;
    });
    setRestoreDoc(null);
    toast({
      title: 'Document restored',
      description: `"${doc.title}" has been restored from the archive.`,
    });
  }, [toast]);

  const handlePermanentDelete = useCallback((doc: ArchivedDocument) => {
    setDocuments(prev => prev.filter(d => d.id !== doc.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(doc.id);
      return next;
    });
    setDeleteDoc(null);
    toast({
      title: 'Document permanently deleted',
      description: `"${doc.title}" has been permanently deleted.`,
      variant: 'destructive',
    });
  }, [toast]);

  const handleBulkRestore = useCallback(() => {
    const count = selectedIds.size;
    setDocuments(prev => prev.filter(d => !selectedIds.has(d.id)));
    setSelectedIds(new Set());
    toast({
      title: `${count} document${count > 1 ? 's' : ''} restored`,
      description: 'Selected documents have been restored from the archive.',
    });
  }, [selectedIds, toast]);

  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.size;
    setDocuments(prev => prev.filter(d => !selectedIds.has(d.id)));
    setSelectedIds(new Set());
    toast({
      title: `${count} document${count > 1 ? 's' : ''} permanently deleted`,
      description: 'Selected documents have been permanently deleted.',
      variant: 'destructive',
    });
  }, [selectedIds, toast]);

  const handleBulkDownload = useCallback(() => {
    const count = selectedIds.size;
    toast({
      title: `Downloading ${count} document${count > 1 ? 's' : ''}`,
      description: 'Your download will begin shortly.',
    });
  }, [selectedIds, toast]);

  const handleBulkExport = useCallback(() => {
    setExportOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    setExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setExporting(false);
          setExportComplete(true);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  }, []);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }, [sortField]);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Export button click from header
  const startExport = useCallback((format: ExportFormat) => {
    setExportFormat(format);
    setExportOpen(true);
  }, []);

  // Count animation
  const [displayTotal, setDisplayTotal] = useState(0);
  useEffect(() => {
    let current = 0;
    const target = stats.total;
    const step = Math.max(1, Math.floor(target / 20));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setDisplayTotal(current);
    }, 40);
    return () => clearInterval(interval);
  }, [stats.total]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <motion.h1
            className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Archive className="h-7 w-7 text-muted-foreground" />
            Document Archive
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-1">Browse, search and export completed documents</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FileDown className="h-4 w-4" />
                Export
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => startExport('csv')}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => startExport('pdf')}>
                <FileText className="h-4 w-4 mr-2 text-red-500" />
                Export as PDF Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => startExport('json')}>
                <FileJson className="h-4 w-4 mr-2 text-amber-500" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-none border-x"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('table')}
            >
              <Table2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Archive Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Archived', value: displayTotal, icon: Archive, color: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/30', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-500', suffix: '' },
          { label: 'Total Storage', value: stats.totalStorage, icon: HardDrive, color: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/30', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-500', suffix: '' },
          { label: 'This Quarter', value: stats.thisQuarter, icon: TrendingUp, color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/30', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-500', suffix: '' },
          { label: 'Avg Retention', value: stats.avgRetention, icon: Clock, color: 'from-purple-500/20 to-pink-500/10', border: 'border-purple-500/30', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-500', suffix: '' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className={cn('glass-card overflow-hidden', stat.border)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-0.5">{stat.value}{stat.suffix}</p>
                  </div>
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', stat.iconBg)}>
                    <stat.icon className={cn('h-4 w-4', stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search archive..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <Button
            variant={filtersOpen ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
            {filtersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearAllFilters}>
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Card className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date Range
                    </Label>
                    <div className="flex gap-2">
                      <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-xs" placeholder="From" />
                      <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-xs" placeholder="To" />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Department
                    </Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Signer Search */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Signer / Approver
                    </Label>
                    <Input
                      placeholder="Search signer..."
                      value={signerSearch}
                      onChange={e => setSignerSearch(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Document Types */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Document Type
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {docTypes.map(t => {
                      const config = docTypeConfig[t];
                      const isActive = selectedTypes.has(t);
                      return (
                        <Button
                          key={t}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={cn('h-7 text-xs gap-1', isActive && `bg-gradient-to-r ${config.gradient} text-white border-0`)}
                          onClick={() => toggleType(t)}
                        >
                          {t}
                          {isActive && <X className="h-3 w-3 ml-0.5" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Status
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {allStatuses.map(s => {
                      const config = statusConfig[s];
                      const isActive = selectedStatuses.has(s);
                      return (
                        <Button
                          key={s}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={cn('h-7 text-xs gap-1', isActive && `${config.bg} ${config.color} border-current`)}
                          onClick={() => toggleStatus(s)}
                        >
                          <config.icon className="h-3 w-3" />
                          {s}
                          {isActive && <X className="h-3 w-3 ml-0.5" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Tags
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map(t => {
                      const isActive = selectedTags.has(t);
                      return (
                        <Button
                          key={t}
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={cn('h-7 text-xs gap-1', isActive && 'bg-primary/10 text-primary border-primary/30')}
                          onClick={() => toggleTag(t)}
                        >
                          <Tag className="h-3 w-3" />
                          {t}
                          {isActive && <X className="h-3 w-3 ml-0.5" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Operations Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="sticky top-14 z-30"
          >
            <Card className="border-primary/30 bg-card/95 backdrop-blur-sm shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.size === filteredDocs.length && filteredDocs.length > 0}
                      onCheckedChange={selectAll}
                    />
                    <span className="text-sm font-medium">
                      {selectedIds.size} selected
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleBulkDownload}>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-emerald-500/50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10" onClick={handleBulkRestore}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-red-500/50 text-red-600 hover:text-red-700 hover:bg-red-500/10" onClick={handleBulkDelete}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleBulkExport}>
                      <FileDown className="h-3.5 w-3.5" />
                      Export
                    </Button>
                  </div>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelectedIds(new Set())}>
                    Deselect All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Content Area */}
      {filteredDocs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Archive className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No archived documents found</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {activeFilterCount > 0
              ? 'No documents match your current filters. Try adjusting your search criteria.'
              : 'Your archive is empty. Completed documents will appear here when archived.'}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          )}
        </motion.div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc, index) => {
            const typeConf = docTypeConfig[doc.type];
            const statusConf = statusConfig[doc.status];
            const isSelected = selectedIds.has(doc.id);
            const isExpiringSoon = isBefore(doc.retentionExpiry, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                layout
              >
                <Card
                  className={cn(
                    'group relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer',
                    isSelected && 'ring-2 ring-primary/50',
                  )}
                >
                  {/* Gradient top border by type */}
                  <div className={cn('h-1 bg-gradient-to-r', typeConf.gradient)} />

                  <CardContent className="p-4">
                    {/* Top row: checkbox + type badge + status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(doc.id)}
                          onClick={e => e.stopPropagation()}
                        />
                        <Badge variant="secondary" className={cn('text-[10px] gap-1', typeConf.color)}>
                          {doc.type}
                        </Badge>
                        <Badge variant="outline" className={cn('text-[10px] gap-1', statusConf.color, statusConf.bg)}>
                          <statusConf.icon className="h-2.5 w-2.5" />
                          {doc.status}
                        </Badge>
                      </div>

                      {/* Quick actions on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: 'Downloading...', description: doc.title })}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: 'Viewing document', description: doc.title })}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500" onClick={() => setRestoreDoc(doc)}>
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteDoc(doc)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {doc.title}
                    </h3>

                    {/* Meta info */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>Completed {format(doc.completedDate, 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {doc.signersCount} signer{doc.signersCount > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {doc.fileSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span className={cn(isExpiringSoon && 'text-amber-500 font-medium')}>
                          Retention until {format(doc.retentionExpiry, 'MMM d, yyyy')}
                          {isExpiringSoon && ' (expiring soon)'}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {doc.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                            +{doc.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="space-y-2">
          {filteredDocs.map((doc, index) => {
            const typeConf = docTypeConfig[doc.type];
            const statusConf = statusConfig[doc.status];
            const isSelected = selectedIds.has(doc.id);

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.25 }}
                layout
              >
                <Card
                  className={cn(
                    'group transition-all duration-200 hover:shadow-md cursor-pointer',
                    isSelected && 'ring-2 ring-primary/50',
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(doc.id)}
                        onClick={e => e.stopPropagation()}
                      />

                      {/* Left gradient bar */}
                      <div className={cn('w-1 self-stretch rounded-full bg-gradient-to-b', typeConf.gradient)} />

                      {/* Type icon */}
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', statusConf.bg)}>
                        <typeConf.icon className={cn('h-4 w-4', typeConf.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                            {doc.title}
                          </h3>
                          <Badge variant="outline" className={cn('text-[10px] shrink-0', statusConf.color, statusConf.bg)}>
                            {doc.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{doc.type}</span>
                          <span>{doc.department}</span>
                          <span>{format(doc.completedDate, 'MMM d, yyyy')}</span>
                          <span>{doc.fileSize}</span>
                          <span>{doc.signersCount} signer{doc.signersCount > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Tags (visible on wider screens) */}
                      <div className="hidden lg:flex items-center gap-1">
                        {doc.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => toast({ title: 'Downloading...', description: doc.title })}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setRestoreDoc(doc)}>
                          <RotateCcw className="h-3.5 w-3.5 text-emerald-500" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast({ title: 'Viewing document', description: doc.title })}>
                              <Eye className="h-4 w-4 mr-2" /> View Document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: 'Downloading...', description: doc.title })}>
                              <Download className="h-4 w-4 mr-2" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRestoreDoc(doc)}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Restore
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDoc(doc)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Permanently Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === filteredDocs.length && filteredDocs.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('title')}>
                    <span className="flex items-center">Title <SortIcon field="title" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('type')}>
                    <span className="flex items-center">Type <SortIcon field="type" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <span className="flex items-center">Status <SortIcon field="status" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('completedDate')}>
                    <span className="flex items-center">Completed <SortIcon field="completedDate" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('signersCount')}>
                    <span className="flex items-center">Signers <SortIcon field="signersCount" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('fileSizeBytes')}>
                    <span className="flex items-center">Size <SortIcon field="fileSizeBytes" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('department')}>
                    <span className="flex items-center">Dept <SortIcon field="department" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('retentionExpiry')}>
                    <span className="flex items-center">Retention <SortIcon field="retentionExpiry" /></span>
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => {
                  const typeConf = docTypeConfig[doc.type];
                  const statusConf = statusConfig[doc.status];
                  const isSelected = selectedIds.has(doc.id);

                  return (
                    <TableRow
                      key={doc.id}
                      className={cn('cursor-pointer group', isSelected && 'bg-primary/5')}
                      onClick={() => toggleSelect(doc.id)}
                    >
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(doc.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-1.5 w-1.5 rounded-full bg-gradient-to-r shrink-0', typeConf.gradient)} />
                          <span className="font-medium text-sm truncate max-w-[200px]">{doc.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[10px]', typeConf.color)}>
                          {doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px] gap-1', statusConf.color, statusConf.bg)}>
                          <statusConf.icon className="h-2.5 w-2.5" />
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(doc.completedDate, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {doc.signersCount}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {doc.fileSize}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {doc.department}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(doc.retentionExpiry, 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast({ title: 'Viewing document', description: doc.title })}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: 'Downloading...', description: doc.title })}>
                              <Download className="h-4 w-4 mr-2" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRestoreDoc(doc)}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Restore
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDoc(doc)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* Document Restore Dialog */}
      <Dialog open={!!restoreDoc} onOpenChange={(open) => { if (!open) setRestoreDoc(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <RotateCcw className="h-4 w-4 text-emerald-500" />
              </div>
              Restore Document
            </DialogTitle>
            <DialogDescription>
              This will restore the document from the archive back to your active documents.
            </DialogDescription>
          </DialogHeader>

          {restoreDoc && (
            <div className="space-y-4 py-2">
              <Card className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{restoreDoc.title}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {restoreDoc.type}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Department: {restoreDoc.department}</span>
                  <span>Signers: {restoreDoc.signersCount}</span>
                  <span>Completed: {format(restoreDoc.completedDate, 'MMM d, yyyy')}</span>
                  <span>Size: {restoreDoc.fileSize}</span>
                </div>
              </Card>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">Warning</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Restoring this document will move it back to your active documents. Any retention policies may need to be re-applied.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDoc(null)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => restoreDoc && handleRestore(restoreDoc)}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Restore Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(open) => { if (!open) setDeleteDoc(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              Permanently Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently deleted from the archive and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteDoc && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm font-medium">{deleteDoc.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {deleteDoc.type} · {deleteDoc.department} · {deleteDoc.fileSize}
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDoc(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteDoc && handlePermanentDelete(deleteDoc)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={(open) => {
        if (!open) {
          setExportOpen(false);
          setExporting(false);
          setExportComplete(false);
          setExportProgress(0);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileDown className="h-4 w-4 text-primary" />
              </div>
              Export Archive Data
            </DialogTitle>
            <DialogDescription>
              Choose your export format and options.
            </DialogDescription>
          </DialogHeader>

          {!exporting && !exportComplete ? (
            <div className="space-y-4 py-2">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Export Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'csv' as ExportFormat, label: 'CSV', icon: FileSpreadsheet, desc: 'Spreadsheet', color: 'text-emerald-500' },
                    { value: 'pdf' as ExportFormat, label: 'PDF', icon: FileText, desc: 'Report', color: 'text-red-500' },
                    { value: 'json' as ExportFormat, label: 'JSON', icon: FileJson, desc: 'Data', color: 'text-amber-500' },
                  ].map(fmt => (
                    <Button
                      key={fmt.value}
                      variant={exportFormat === fmt.value ? 'default' : 'outline'}
                      className={cn(
                        'h-auto py-3 flex-col gap-1',
                        exportFormat === fmt.value && 'ring-2 ring-primary'
                      )}
                      onClick={() => setExportFormat(fmt.value)}
                    >
                      <fmt.icon className={cn('h-5 w-5', exportFormat !== fmt.value && fmt.color)} />
                      <span className="text-xs font-medium">{fmt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{fmt.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Include Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Include</Label>
                <div className="space-y-2">
                  {[
                    { key: 'metadata' as const, label: 'Metadata', desc: 'Document details, dates, and properties' },
                    { key: 'signatures' as const, label: 'Signatures', desc: 'Signer information and completion data' },
                    { key: 'auditTrail' as const, label: 'Audit Trail', desc: 'Full activity log and timestamps' },
                    { key: 'comments' as const, label: 'Comments', desc: 'All comments and annotations' },
                  ].map(opt => (
                    <div key={opt.key} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Checkbox
                        checked={exportOptions[opt.key]}
                        onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, [opt.key]: !!checked }))}
                        className="mt-0.5"
                      />
                      <div>
                        <Label className="text-sm cursor-pointer">{opt.label}</Label>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : exportComplete ? (
            <div className="py-8 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </motion.div>
              <h3 className="text-lg font-semibold mb-1">Export Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your {exportFormat.toUpperCase()} file has been generated successfully.
              </p>
              <Button className="gap-1.5" onClick={() => {
                toast({ title: 'Download started', description: `archive-export.${exportFormat}` });
                setExportOpen(false);
                setExportComplete(false);
                setExportProgress(0);
              }}>
                <Download className="h-4 w-4" />
                Download File
              </Button>
            </div>
          ) : (
            <div className="py-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Generating {exportFormat.toUpperCase()} export...</p>
                  <p className="text-xs text-muted-foreground">This may take a moment</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.min(Math.round(exportProgress), 100)}%</span>
                </div>
                <Progress value={Math.min(exportProgress, 100)} className="h-2" />
              </div>
              <div className="space-y-1.5">
                {['Collecting document data', 'Formatting export fields', 'Generating file', 'Preparing download'].map((step, i) => {
                  const stepProgress = (i + 1) * 25;
                  const isDone = exportProgress >= stepProgress;
                  const isCurrent = !isDone && exportProgress >= stepProgress - 25;
                  return (
                    <div key={step} className="flex items-center gap-2 text-xs">
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : isCurrent ? (
                        <motion.div
                          className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-muted" />
                      )}
                      <span className={cn(isDone && 'text-emerald-600 dark:text-emerald-400', isCurrent && 'text-primary font-medium', !isDone && !isCurrent && 'text-muted-foreground')}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!exporting && !exportComplete && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
              <Button onClick={handleExport}>
                <FileDown className="h-4 w-4 mr-1.5" />
                Start Export
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
