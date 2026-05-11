'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Keyboard,
  Search,
  LayoutDashboard,
  Inbox,
  FileText,
  LayoutTemplate,
  ShieldCheck,
  Settings,
  Users,
  Plus,
  Command,
  HelpCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShortcutItem {
  keys: string[];
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: () => void;
}

interface ShortcutCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ShortcutItem[];
}

function Kbd({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <kbd
      className={`inline-flex items-center justify-center rounded-md border border-border bg-muted/80 font-mono text-muted-foreground shadow-[0_1px_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_1px_rgba(255,255,255,0.06)] select-none
        ${compact ? 'min-w-5 h-5 px-1 text-[10px]' : 'min-w-6 h-6 px-1.5 text-[11px]'}
      `}
    >
      {children}
    </kbd>
  );
}

function ShortcutRow({ item, index }: { item: ShortcutItem; index: number }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted/60 group-hover:bg-primary/10 transition-colors">
            <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{item.label}</p>
          {item.description && (
            <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {item.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-[10px] text-muted-foreground/50 mx-0.5">
                {key.includes('then') ? '' : '+'}
              </span>
            )}
            {key.split(' then ').map((part, j) => (
              <span key={j} className="flex items-center gap-1">
                {j > 0 && (
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40 mx-0.5" />
                )}
                <Kbd compact>{part}</Kbd>
              </span>
            ))}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function KeyboardShortcutsDialog() {
  const { keyboardShortcutsOpen, setKeyboardShortcutsOpen, navigate } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl';

  const categories: ShortcutCategory[] = useMemo(() => [
    {
      title: 'Navigation',
      icon: LayoutDashboard,
      items: [
        {
          keys: [`${mod} K`],
          label: 'Open Search',
          description: 'Quickly find pages and actions',
          icon: Search,
        },
        {
          keys: ['G then D'],
          label: 'Go to Dashboard',
          description: 'Navigate to the main dashboard',
          icon: LayoutDashboard,
          action: () => navigate('dashboard'),
        },
        {
          keys: ['G then I'],
          label: 'Go to Inbox',
          description: 'View your inbox and pending items',
          icon: Inbox,
          action: () => navigate('inbox'),
        },
        {
          keys: ['G then O'],
          label: 'Go to Documents',
          description: 'Browse all documents',
          icon: FileText,
          action: () => navigate('documents'),
        },
        {
          keys: ['G then T'],
          label: 'Go to Templates',
          description: 'Manage document templates',
          icon: LayoutTemplate,
          action: () => navigate('templates'),
        },
        {
          keys: ['G then A'],
          label: 'Go to Admin',
          description: 'Access admin panel',
          icon: Users,
          action: () => navigate('admin'),
        },
        {
          keys: ['G then S'],
          label: 'Go to Settings',
          description: 'Open settings page',
          icon: Settings,
          action: () => navigate('settings'),
        },
      ],
    },
    {
      title: 'Documents',
      icon: FileText,
      items: [
        {
          keys: [`${mod} N`],
          label: 'New Document',
          description: 'Create a new document',
          icon: Plus,
          action: () => navigate('document-editor'),
        },
        {
          keys: ['G then L'],
          label: 'Go to Audit Logs',
          description: 'View activity audit trail',
          icon: ShieldCheck,
          action: () => navigate('audit-logs'),
        },
      ],
    },
    {
      title: 'Actions',
      icon: Command,
      items: [
        {
          keys: [`${mod} /`],
          label: 'Show Keyboard Shortcuts',
          description: 'Open this shortcuts panel',
          icon: Keyboard,
        },
        {
          keys: ['?'],
          label: 'Show Help',
          description: 'Display help information',
          icon: HelpCircle,
        },
      ],
    },
    {
      title: 'General',
      icon: Settings,
      items: [
        {
          keys: ['Esc'],
          label: 'Close Dialog',
          description: 'Close the current dialog or panel',
          icon: X,
        },
      ],
    },
  ], [mod, navigate]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.keys.some((k) => k.toLowerCase().includes(query))
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, searchQuery]);

  const totalShortcuts = categories.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <Dialog open={keyboardShortcutsOpen} onOpenChange={setKeyboardShortcutsOpen}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Keyboard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span>Keyboard Shortcuts</span>
              <p className="text-xs font-normal text-muted-foreground mt-0.5">
                {totalShortcuts} shortcuts available
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and search all available keyboard shortcuts for the application
          </DialogDescription>
        </DialogHeader>

        {/* Search filter */}
        <div className="px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <Separator />

        {/* Shortcuts list */}
        <div className="max-h-[480px] overflow-y-auto px-2 py-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {filteredCategories.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-muted-foreground"
              >
                <Search className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No shortcuts found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredCategories.map((category, catIndex) => {
                  const CategoryIcon = category.icon;
                  return (
                    <div key={category.title} className="mb-2">
                      {catIndex > 0 && <Separator className="mb-2" />}
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category.title}
                        </h3>
                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px] ml-auto">
                          {category.items.length}
                        </Badge>
                      </div>
                      <div className="space-y-0.5">
                        {category.items.map((item, itemIndex) => (
                          <ShortcutRow
                            key={`${category.title}-${item.label}`}
                            item={item}
                            index={catIndex * 10 + itemIndex}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Kbd compact>↑</Kbd>
              <Kbd compact>↓</Kbd>
              <span className="ml-1">Scroll</span>
            </span>
            <span className="flex items-center gap-1">
              <Kbd compact>Esc</Kbd>
              <span className="ml-1">Close</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Powered by</span>
            <Badge variant="outline" className="h-4 px-1.5 text-[9px] gap-0.5">
              <Keyboard className="h-2.5 w-2.5" />
              Z.ai
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
