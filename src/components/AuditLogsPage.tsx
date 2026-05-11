'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api, mockAuditLogs } from '@/lib/api';
import type { AuditAction, AuditLog } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, ShieldCheck, Download, Filter, FileJson, FileSpreadsheet, FileText, MapPin, Clock, ChevronRight, X, RefreshCw, AlertTriangle, Info, AlertCircle, XCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { EmptyState } from './EmptyState';

const actionTypes: { value: string; label: string }[] = [
  { value: 'document.created', label: 'Document Created' },
  { value: 'document.sent', label: 'Document Sent' },
  { value: 'document.viewed', label: 'Document Viewed' },
  { value: 'document.signed', label: 'Document Signed' },
  { value: 'document.completed', label: 'Document Completed' },
  { value: 'document.rejected', label: 'Document Rejected' },
  { value: 'signature.added', label: 'Signature Added' },
  { value: 'user.login', label: 'User Login' },
  { value: 'user.created', label: 'User Created' },
  { value: 'template.used', label: 'Template Used' },
  { value: 'document.downloaded', label: 'Document Downloaded' },
  { value: 'document.create', label: 'Document Create' },
  { value: 'document.update', label: 'Document Update' },
  { value: 'document.archive', label: 'Document Archive' },
];

// Severity level based on action type
type SeverityLevel = 'info' | 'warning' | 'critical';

function getSeverity(action: string): SeverityLevel {
  if (action.includes('rejected') || action.includes('deleted') || action.includes('deactivated')) return 'critical';
  if (action.includes('login') || action.includes('update') || action.includes('archive')) return 'warning';
  return 'info';
}

const severityConfig: Record<SeverityLevel, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  info: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: <Info className="h-3 w-3" />,
    label: 'Info',
  },
  warning: {
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: <AlertTriangle className="h-3 w-3" />,
    label: 'Warning',
  },
  critical: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Critical',
  },
};

const actionColors: Record<string, string> = {
  'document.created': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'document.create': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'document.sent': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'document.viewed': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'document.signed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'document.completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'document.rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'document.update': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'document.archive': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'signature.added': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'user.login': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'user.created': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'template.used': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'template.create': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'document.downloaded': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

// Approximate IP geolocation (mock)
function getIpLocation(ip: string): string {
  if (!ip || ip === '—') return '';
  if (ip.startsWith('192.168.')) return 'Local Network';
  if (ip.startsWith('10.0.')) return 'VPN / Internal';
  if (ip.startsWith('172.')) return 'Corporate Network';
  return 'External Network';
}

// Log detail side panel
function LogDetailPanel({
  log,
  open,
  onClose,
}: {
  log: AuditLog | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!log) return null;
  const severity = getSeverity(log.action);
  const sevConf = severityConfig[severity];
  const ipLocation = getIpLocation(log.ipAddress || '');

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Log Details
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Severity */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Severity:</span>
            <Badge className={`${sevConf.bgColor} ${sevConf.color} border-0 flex items-center gap-1`}>
              {sevConf.icon}
              {sevConf.label}
            </Badge>
          </div>

          {/* Action */}
          <div>
            <Label className="text-xs text-muted-foreground">Action</Label>
            <Badge className={`text-xs mt-1 ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
              {log.action}
            </Badge>
          </div>

          {/* User */}
          <div>
            <Label className="text-xs text-muted-foreground">User</Label>
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                  {log.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{log.user?.name || 'System'}</span>
            </div>
          </div>

          {/* Resource */}
          <div>
            <Label className="text-xs text-muted-foreground">Resource</Label>
            <p className="text-sm mt-1 capitalize">{log.resourceType} · {log.resourceId}</p>
          </div>

          {/* Timestamp */}
          <div>
            <Label className="text-xs text-muted-foreground">Timestamp</Label>
            <p className="text-sm mt-1">{format(new Date(log.createdAt), 'PPP pp')}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
            </p>
          </div>

          {/* IP Address */}
          {log.ipAddress && (
            <div>
              <Label className="text-xs text-muted-foreground">IP Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono">{log.ipAddress}</span>
                {ipLocation && (
                  <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    {ipLocation}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* User Agent */}
          {log.userAgent && (
            <div>
              <Label className="text-xs text-muted-foreground">User Agent</Label>
              <p className="text-xs text-muted-foreground mt-1 break-all">{log.userAgent}</p>
            </div>
          )}

          {/* Details */}
          <div>
            <Label className="text-xs text-muted-foreground">Details</Label>
            <pre className="text-xs bg-muted/50 rounded-lg p-3 mt-1 overflow-x-auto max-h-60">
              {typeof log.details === 'string'
                ? log.details
                : JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [resourceType, setResourceType] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Fetch audit logs from API
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', actionFilter, resourceType],
    queryFn: async () => {
      const res = await api.getAuditLogs({
        action: actionFilter.length > 0 ? (actionFilter as AuditAction[]) : undefined,
        resourceType: resourceType !== 'all' ? resourceType : undefined,
        pageSize: 50,
      });
      if (res.success && res.data && res.data.items.length > 0) return res.data.items;
      return mockAuditLogs;
    },
    staleTime: 30 * 1000,
  });

  const allLogs: AuditLog[] = logsData || mockAuditLogs;

  const filteredLogs = useMemo(() => {
    let logs = [...allLogs];

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.action.toLowerCase().includes(q) ||
          log.user?.name.toLowerCase().includes(q) ||
          JSON.stringify(log.details).toLowerCase().includes(q)
      );
    }

    if (actionFilter.length > 0) {
      logs = logs.filter((log) => actionFilter.includes(log.action));
    }

    if (resourceType !== 'all') {
      logs = logs.filter((log) => log.resourceType === resourceType);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      logs = logs.filter((log) => getSeverity(log.action) === severityFilter);
    }

    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allLogs, search, actionFilter, resourceType, severityFilter]);

  const toggleActionFilter = (action: string) => {
    setActionFilter((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    if (format === 'json') {
      const res = await api.exportAuditLogs();
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else if (format === 'csv') {
      // Generate CSV
      const headers = ['Action', 'User', 'Resource Type', 'Resource ID', 'IP Address', 'Timestamp'];
      const rows = filteredLogs.map(log => [
        log.action,
        log.user?.name || 'System',
        log.resourceType,
        log.resourceId,
        log.ipAddress || '',
        log.createdAt,
      ]);
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const openLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Complete audit trail of all system activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('json')}>
                  <FileJson className="mr-2 h-4 w-4" />JSON
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('csv')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />CSV
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('pdf')} disabled>
                  <FileText className="mr-2 h-4 w-4" />PDF (Coming Soon)
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={resourceType} onValueChange={setResourceType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Resource type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="template">Templates</SelectItem>
            <SelectItem value="workflow">Workflows</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityLevel | 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Actions
              {actionFilter.length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {actionFilter.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Filter by Action</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {actionTypes.map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`action-${type.value}`}
                      checked={actionFilter.includes(type.value)}
                      onCheckedChange={() => toggleActionFilter(type.value)}
                    />
                    <Label htmlFor={`action-${type.value}`} className="text-sm font-normal cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
              {actionFilter.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setActionFilter([])}>
                  Clear
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active filters */}
      {(actionFilter.length > 0 || severityFilter !== 'all' || resourceType !== 'all') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {severityFilter !== 'all' && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive capitalize"
              onClick={() => setSeverityFilter('all')}
            >
              {severityFilter} ×
            </Badge>
          )}
          {resourceType !== 'all' && (
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive capitalize"
              onClick={() => setResourceType('all')}
            >
              {resourceType} ×
            </Badge>
          )}
          {actionFilter.map((action) => (
            <Badge
              key={action}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
              onClick={() => toggleActionFilter(action)}
            >
              {action} ×
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setActionFilter([]); setSeverityFilter('all'); setResourceType('all'); }}>
            Clear all
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          variant="audit"
          title="No audit logs found"
          description="Try adjusting your filters to find what you're looking for."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredLogs.map((log) => {
                  const severity = getSeverity(log.action);
                  const sevConf = severityConfig[severity];
                  const ipLoc = getIpLocation(log.ipAddress || '');

                  return (
                    <motion.tr
                      key={log.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`cursor-pointer hover:bg-accent/50 border-b border-border transition-colors ${
                        i % 2 === 0 ? 'bg-muted/10' : ''
                      }`}
                      onClick={() => openLogDetail(log)}
                    >
                      <TableCell>
                        <div className={`h-2 w-2 rounded-full ${severity === 'critical' ? 'bg-red-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                              {log.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{log.user?.name || 'System'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{log.resourceType}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                          {typeof log.details === 'string'
                            ? log.details.substring(0, 60)
                            : JSON.stringify(log.details).substring(0, 60)}
                          ...
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground font-mono">{log.ipAddress || '—'}</span>
                          {ipLoc && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />{ipLoc}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Log detail panel */}
      <LogDetailPanel
        log={selectedLog}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
