'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { PageTransition } from '@/components/PageTransition';
import { LoginPage } from '@/components/LoginPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';

// Dynamic imports to reduce initial compilation memory - each page loads on demand
const DashboardPage = dynamic(() => import('@/components/DashboardPage').then(m => ({ default: m.DashboardPage })), { ssr: false });
const InboxPage = dynamic(() => import('@/components/InboxPage').then(m => ({ default: m.InboxPage })), { ssr: false });
const DocumentsPage = dynamic(() => import('@/components/DocumentsPage').then(m => ({ default: m.DocumentsPage })), { ssr: false });
const DocumentDetailPage = dynamic(() => import('@/components/DocumentDetailPage').then(m => ({ default: m.DocumentDetailPage })), { ssr: false });
const DocumentEditorPage = dynamic(() => import('@/components/DocumentEditorPage').then(m => ({ default: m.DocumentEditorPage })), { ssr: false });
const TemplatesPage = dynamic(() => import('@/components/TemplatesPage').then(m => ({ default: m.TemplatesPage })), { ssr: false });
const AuditLogsPage = dynamic(() => import('@/components/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })), { ssr: false });
const AdminPage = dynamic(() => import('@/components/AdminPage').then(m => ({ default: m.AdminPage })), { ssr: false });
const SettingsPage = dynamic(() => import('@/components/SettingsPage').then(m => ({ default: m.SettingsPage })), { ssr: false });
const WorkflowBuilderPage = dynamic(() => import('@/components/WorkflowBuilderPage').then(m => ({ default: m.WorkflowBuilderPage })), { ssr: false });
const AIAssistant = dynamic(() => import('@/components/AIAssistant').then(m => ({ default: m.AIAssistant })), { ssr: false });
const ContactsPage = dynamic(() => import('@/components/ContactsPage').then(m => ({ default: m.ContactsPage })), { ssr: false });
const ReportsPage = dynamic(() => import('@/components/ReportsPage').then(m => ({ default: m.ReportsPage })), { ssr: false });
const NotificationCenterPage = dynamic(() => import('@/components/NotificationCenterPage').then(m => ({ default: m.NotificationCenterPage })), { ssr: false });
const OnboardingTour = dynamic(() => import('@/components/OnboardingTour').then(m => ({ default: m.OnboardingTour })), { ssr: false });
const CalendarPage = dynamic(() => import('@/components/CalendarPage').then(m => ({ default: m.CalendarPage })), { ssr: false });
const ApprovalChainsPage = dynamic(() => import('@/components/ApprovalChainsPage').then(m => ({ default: m.ApprovalChainsPage })), { ssr: false });
const ArchivePage = dynamic(() => import('@/components/ArchivePage').then(m => ({ default: m.ArchivePage })), { ssr: false });
const CertificatePage = dynamic(() => import('@/components/CertificatePage').then(m => ({ default: m.CertificatePage })), { ssr: false });
const TeamLeaderboardPage = dynamic(() => import('@/components/TeamLeaderboardPage').then(m => ({ default: m.TeamLeaderboardPage })), { ssr: false });
const DocumentExpiryPage = dynamic(() => import('@/components/DocumentExpiryPage').then(m => ({ default: m.DocumentExpiryPage })), { ssr: false });
const DocumentAnnotationsPage = dynamic(() => import('@/components/DocumentAnnotationsPage').then(m => ({ default: m.DocumentAnnotationsPage })), { ssr: false });
const DocumentComparisonPage = dynamic(() => import('@/components/DocumentComparisonPage').then(m => ({ default: m.DocumentComparisonPage })), { ssr: false });

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
      case 'notifications':
        return <NotificationCenterPage />;
      case 'admin':
        return <AdminPage />;
      case 'settings':
        return <SettingsPage />;
      case 'workflow-builder':
        return <WorkflowBuilderPage />;
      case 'approval-chains':
        return <ApprovalChainsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'archive':
        return <ArchivePage />;
      case 'team-leaderboard':
        return <TeamLeaderboardPage />;
      case 'certificates':
        return <CertificatePage />;
      case 'document-expiry':
        return <DocumentExpiryPage />;
      case 'comparison':
        return <DocumentComparisonPage />;
      case 'annotations':
        return <DocumentAnnotationsPage />;
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
      <OnboardingTour />
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
