'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { PageTransition } from '@/components/PageTransition';
import { LoginPage } from '@/components/LoginPage';
import { DashboardPage } from '@/components/DashboardPage';
import { InboxPage } from '@/components/InboxPage';
import { DocumentsPage } from '@/components/DocumentsPage';
import { DocumentDetailPage } from '@/components/DocumentDetailPage';
import { DocumentEditorPage } from '@/components/DocumentEditorPage';
import { TemplatesPage } from '@/components/TemplatesPage';
import { AuditLogsPage } from '@/components/AuditLogsPage';
import { AdminPage } from '@/components/AdminPage';
import { SettingsPage } from '@/components/SettingsPage';
import { WorkflowBuilderPage } from '@/components/WorkflowBuilderPage';
import { AIAssistant } from '@/components/AIAssistant';
import { ContactsPage } from '@/components/ContactsPage';
import { ReportsPage } from '@/components/ReportsPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function AppContent() {
  const { isAuthenticated, currentPage, checkAuth, setKeyboardShortcutsOpen, navigate } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Global keyboard shortcut handler
  useEffect(() => {
    if (!isAuthenticated) return;

    let gKeyPressed = false;
    let gKeyTimeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘/ or Ctrl+/ to open keyboard shortcuts
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
        return;
      }

      // G then X shortcuts for navigation (only when not in an input)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInput) return;

      if (e.key === 'g' || e.key === 'G') {
        if (gKeyPressed) return;
        gKeyPressed = true;
        clearTimeout(gKeyTimeout);
        gKeyTimeout = setTimeout(() => {
          gKeyPressed = false;
        }, 1000);
        return;
      }

      if (gKeyPressed) {
        clearTimeout(gKeyTimeout);
        gKeyPressed = false;

        const keyMap: Record<string, string> = {
          'd': 'dashboard',
          'D': 'dashboard',
          'i': 'inbox',
          'I': 'inbox',
          'o': 'documents',
          'O': 'documents',
          't': 'templates',
          'T': 'templates',
          'a': 'admin',
          'A': 'admin',
          's': 'settings',
          'S': 'settings',
          'l': 'audit-logs',
          'L': 'audit-logs',
        };

        const page = keyMap[e.key];
        if (page) {
          e.preventDefault();
          navigate(page);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gKeyTimeout);
    };
  }, [isAuthenticated, setKeyboardShortcutsOpen, navigate]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'inbox':
        return <InboxPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'document-detail':
        return <DocumentDetailPage />;
      case 'document-editor':
        return <DocumentEditorPage />;
      case 'templates':
        return <TemplatesPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'contacts':
        return <ContactsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'admin':
        return <AdminPage />;
      case 'settings':
        return <SettingsPage />;
      case 'workflow-builder':
        return <WorkflowBuilderPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppLayout>
      <ErrorBoundary key={currentPage}>
        <PageTransition pageKey={currentPage}>
          {renderPage()}
        </PageTransition>
      </ErrorBoundary>
      <ErrorBoundary>
        <AIAssistant />
      </ErrorBoundary>
      <KeyboardShortcutsDialog />
    </AppLayout>
  );
}

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
