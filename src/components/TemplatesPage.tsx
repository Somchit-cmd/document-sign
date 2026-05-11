'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api, mockTemplates } from '@/lib/api';
import type { TemplateCategory, Template } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Search,
  LayoutTemplate,
  FileText,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Eye,
  Plus,
  Sparkles,
  BarChart3,
  X,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';

const categories: { value: TemplateCategory | 'all'; label: string; icon?: React.ReactNode }[] = [
  { value: 'all', label: 'All' },
  { value: 'contract', label: 'Contracts' },
  { value: 'agreement', label: 'Agreements' },
  { value: 'nda', label: 'NDAs' },
  { value: 'proposal', label: 'Proposals' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'hr', label: 'HR' },
  { value: 'legal', label: 'Legal' },
];

const categoryColors: Record<string, string> = {
  contract: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  agreement: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  nda: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  proposal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  invoice: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hr: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  legal: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// Enhanced Template Card with hover preview & usage stats
function EnhancedTemplateCard({
  template,
  onUse,
}: {
  template: Template;
  onUse: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group"
        onClick={onUse}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-4">
          {/* Template preview */}
          <div className="bg-muted/30 rounded-lg border border-border h-36 flex items-center justify-center mb-4 relative overflow-hidden">
            {/* Preview overlay on hover */}
            <div className={`absolute inset-0 bg-primary/5 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex flex-col items-center gap-2">
                <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg">
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Preview
                </Button>
              </div>
            </div>

            <FileText className="h-12 w-12 text-muted-foreground/30" />

            {/* Category badge */}
            <Badge
              className={`absolute top-2 right-2 text-[10px] capitalize ${categoryColors[template.category] || categoryColors.other}`}
            >
              {template.category}
            </Badge>

            {/* Popularity indicator */}
            {template.usageCount > 100 && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] border-0">
                  <TrendingUp className="mr-1 h-2.5 w-2.5" />
                  Popular
                </Badge>
              </div>
            )}
          </div>

          {/* Info */}
          <h3 className="text-sm font-medium group-hover:text-primary transition-colors">{template.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>

          {/* Meta */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{template.usageCount} uses</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(template.updatedAt), { addSuffix: false })}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Use <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {/* Creator info */}
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                {template.createdBy.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground">
              by {template.createdBy.name}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Create from template dialog
function CreateFromTemplateDialog({
  open,
  onClose,
  template,
}: {
  open: boolean;
  onClose: () => void;
  template: Template | null;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');

  if (!template) return null;

  const handleCreate = () => {
    toast.success(`Document created from "${template.name}" template`);
    setTitle('');
    setDescription('');
    setRecipient('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create from Template
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Template info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{template.category} · Used {template.usageCount} times</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-2">
            <Label>Document Title</Label>
            <Input
              placeholder="Enter document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description of this document"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>First Recipient</Label>
            <Input
              placeholder="Recipient email address"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          {/* Template variables */}
          {template.fields.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Template Variables
                <Badge variant="outline" className="text-[10px]">{template.fields.length}</Badge>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {template.fields.slice(0, 6).map((field) => (
                  <div key={field.id} className="flex items-center gap-2 p-2 rounded border border-border bg-background text-xs">
                    <span className="font-medium capitalize">{field.label}</span>
                    <Badge variant="outline" className="text-[9px] ml-auto">{field.type}</Badge>
                  </div>
                ))}
                {template.fields.length > 6 && (
                  <div className="flex items-center justify-center p-2 rounded border border-dashed border-border text-xs text-muted-foreground">
                    +{template.fields.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleCreate}
              disabled={!title.trim()}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TemplatesPage() {
  const { navigate } = useAppStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'updated'>('usage');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Fetch templates from API
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates', category, search],
    queryFn: async () => {
      const res = await api.getTemplates(
        category !== 'all' ? category : undefined,
        search || undefined
      );
      if (res.success && res.data && res.data.length > 0) return res.data;
      return mockTemplates;
    },
    staleTime: 60 * 1000,
  });

  const templates: Template[] = templatesData || mockTemplates;

  const filteredTemplates = useMemo(() => {
    let tpls = [...templates];

    // Client-side search fallback
    if (search) {
      const q = search.toLowerCase();
      tpls = tpls.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    // Client-side category filter fallback
    if (category !== 'all') {
      tpls = tpls.filter((t) => t.category === category);
    }

    // Sort
    if (sortBy === 'usage') {
      tpls.sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortBy === 'name') {
      tpls.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'updated') {
      tpls.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return tpls;
  }, [templates, search, category, sortBy]);

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Start with a pre-built template
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-36">
              <BarChart3 className="mr-2 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usage">Most Popular</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-primary hover:bg-primary/90">
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => setSearch('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Category filter pills - horizontal scrollable */}
      <div className="relative -mx-6 px-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? 'secondary' : 'outline'}
                size="sm"
                className="shrink-0"
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
                {cat.value !== 'all' && (
                  <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[9px]">
                    {templates.filter(t => t.category === cat.value).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <LayoutTemplate className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-1">No templates found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Try adjusting your search or category filter, or create a new template.
          </p>
        </motion.div>
      ) : (
        /* Template grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template) => (
              <EnhancedTemplateCard
                key={template.id}
                template={template}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create from template dialog */}
      <CreateFromTemplateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        template={selectedTemplate}
      />
    </div>
  );
}
