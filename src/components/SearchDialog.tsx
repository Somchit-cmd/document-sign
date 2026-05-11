'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Inbox,
  FileText,
  LayoutTemplate,
  ShieldCheck,
  Settings,
  Users,
  Search,
  Upload,
  Building2,
  GitBranch,
  Clock,
  ArrowRight,
  Hash,
  BarChart3,
  Keyboard,
  SunMoon,
  Send,
} from 'lucide-react';

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Navigation', shortcut: 'G D' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, group: 'Navigation', shortcut: 'G I' },
  { id: 'documents', label: 'Documents', icon: FileText, group: 'Navigation', shortcut: 'G O' },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, group: 'Navigation', shortcut: 'G T' },
  { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck, group: 'Navigation', shortcut: 'G L' },
  { id: 'admin', label: 'Admin Panel', icon: Users, group: 'Navigation', shortcut: 'G A' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'Navigation', shortcut: 'G S' },
  { id: 'contacts', label: 'Contacts', icon: Building2, group: 'Navigation' },
  { id: 'workflow-builder', label: 'Workflows', icon: GitBranch, group: 'Navigation' },
];

const quickActions = [
  { id: 'upload-doc', label: 'Upload Document', icon: Upload, group: 'Quick Actions', action: 'document-editor', shortcut: '⌘N' },
  { id: 'create-template', label: 'Create from Template', icon: LayoutTemplate, group: 'Quick Actions', action: 'templates' },
  { id: 'send-signature', label: 'Send for Signature', icon: Send, group: 'Quick Actions', action: 'documents' },
  { id: 'go-admin', label: 'Go to Admin Panel', icon: Users, group: 'Quick Actions', action: 'admin' },
  { id: 'go-settings', label: 'Go to Settings', icon: Settings, group: 'Quick Actions', action: 'settings' },
  { id: 'view-audit', label: 'View Audit Logs', icon: ShieldCheck, group: 'Quick Actions', action: 'audit-logs' },
  { id: 'view-reports', label: 'Navigate to Reports', icon: BarChart3, group: 'Quick Actions', action: 'dashboard' },
  { id: 'shortcuts', label: 'Show Keyboard Shortcuts', icon: Keyboard, group: 'Quick Actions', action: '__shortcuts__', shortcut: '⌘/' },
  { id: 'toggle-theme', label: 'Toggle Theme', icon: SunMoon, group: 'Quick Actions', action: '__toggle-theme__' },
];

// Search categories
const searchCategories = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'departments', label: 'Departments', icon: Building2 },
];

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { navigate, setKeyboardShortcutsOpen, setTheme, theme } = useAppStore();

  // Recent searches from localStorage (lazy init)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('docsign-recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('docsign-recent-searches', JSON.stringify(updated));
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (pageId: string) => {
    navigate(pageId);
    setOpen(false);
    setQuery('');
  };

  const handleQuickAction = (action: string) => {
    if (action === '__shortcuts__') {
      setOpen(false);
      setQuery('');
      setTimeout(() => setKeyboardShortcutsOpen(true), 100);
      return;
    }
    if (action === '__toggle-theme__') {
      const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
      setTheme(next);
      setOpen(false);
      setQuery('');
      return;
    }
    navigate(action);
    setOpen(false);
    setQuery('');
  };

  const handleSearch = (term: string) => {
    if (term.trim()) {
      saveRecentSearch(term.trim());
      navigate('documents');
    }
    setOpen(false);
    setQuery('');
  };

  const isCommandMode = query.startsWith('>');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:border-primary/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 w-64"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground animate-pulse">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={isCommandMode ? "Type a command..." : "Search pages, documents, templates... (Type > for commands)"}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Command mode */}
          {isCommandMode && (
            <>
              <CommandGroup heading="Commands">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem key={action.id} onSelect={() => handleQuickAction(action.action)}>
                      <ArrowRight className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Icon className="mr-2 h-4 w-4" />
                      {action.label}
                      {action.shortcut && (
                        <CommandShortcut>{action.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {/* Normal search mode */}
          {!isCommandMode && (
            <>
              {/* Recent searches */}
              {recentSearches.length > 0 && !query && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((term) => (
                    <CommandItem key={term} onSelect={() => handleSearch(term)}>
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{term}</span>
                      <button
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = recentSearches.filter(s => s !== term);
                          setRecentSearches(updated);
                          localStorage.setItem('docsign-recent-searches', JSON.stringify(updated));
                        }}
                      >
                        <Hash className="h-3 w-3" />
                      </button>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Search categories */}
              {query && (
                <CommandGroup heading="Search In">
                  {searchCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <CommandItem key={cat.id} onSelect={() => handleSearch(query)}>
                        <Icon className="mr-2 h-4 w-4" />
                        Search {cat.label} for &quot;{query}&quot;
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {/* Pages */}
              <CommandGroup heading="Navigation">
                {pages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <CommandItem key={page.id} onSelect={() => handleSelect(page.id)}>
                      <Icon className="mr-2 h-4 w-4" />
                      {page.label}
                      {page.shortcut && (
                        <CommandShortcut>{page.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              <CommandSeparator />

              {/* Quick Actions */}
              <CommandGroup heading="Quick Actions">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem key={action.id} onSelect={() => handleQuickAction(action.action)}>
                      <Icon className="mr-2 h-4 w-4" />
                      {action.label}
                      {action.shortcut && (
                        <CommandShortcut>{action.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {/* Hint footer */}
              <CommandSeparator />
              <div className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Type <kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">&gt;</kbd> for commands
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                  <span>Esc Close</span>
                </div>
              </div>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
