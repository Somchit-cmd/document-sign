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
import { AIAssistant } from '@/components/AIAssistant';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function AppContent() {
  const { isAuthenticated, currentPage, checkAuth } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
      case 'admin':
        return <AdminPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppLayout>
      <PageTransition pageKey={currentPage}>
        {renderPage()}
      </PageTransition>
      <AIAssistant />
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
