'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { cn } from '@/lib/utils';
import { FileSignature } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen, fetchNotifications, checkAuth } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && <AppSidebar />}
        <div className={cn(
          'flex flex-col flex-1 overflow-hidden transition-all duration-300',
          sidebarOpen && !isMobile ? 'lg:ml-64' : 'lg:ml-16'
        )}>
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>

          {/* Professional Footer */}
          <footer className="h-8 shrink-0 border-t border-border bg-muted/50 flex items-center px-4 text-[11px] text-muted-foreground">
            <div className="flex-1">© 2025 DocuSign Enterprise. Internal use only.</div>
            <div className="flex items-center gap-1 text-muted-foreground/60">
              v2.1.0
            </div>
            <div className="flex-1 flex items-center justify-end gap-1.5">
              <span className="text-muted-foreground/60">Powered by</span>
              <div className="flex items-center gap-1">
                <FileSignature className="h-3 w-3 text-primary" />
                <span className="font-medium text-primary/80">Z.ai</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
