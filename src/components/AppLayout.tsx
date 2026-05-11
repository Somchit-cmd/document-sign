'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { cn } from '@/lib/utils';
import { FileSignature, Wifi, WifiOff, Clock, Server, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen, fetchNotifications, checkAuth } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Simulate connection status check
  useEffect(() => {
    const checkConnection = () => setIsConnected(navigator.onLine);
    window.addEventListener('online', () => setIsConnected(true));
    window.addEventListener('offline', () => setIsConnected(false));
    return () => {
      window.removeEventListener('online', () => setIsConnected(true));
      window.removeEventListener('offline', () => setIsConnected(false));
    };
  }, []);

  const lastSyncTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

          {/* Enhanced Professional Footer */}
          <footer className="shrink-0 border-t border-border bg-muted/50">
            {/* Subtle top separator line with gradient */}
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

            <div className="h-9 flex items-center px-4 text-[11px] text-muted-foreground">
              {/* Left section - Copyright & Environment */}
              <div className="flex-1 flex items-center gap-3">
                <span>© 2025 DocuSign Enterprise</span>
                <span className="text-muted-foreground/30">·</span>
                {/* Environment indicator */}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  PROD
                </span>
              </div>

              {/* Center section - System Status & Connection */}
              <div className="hidden sm:flex items-center gap-3">
                {/* System Status */}
                <div className="flex items-center gap-1.5">
                  <Server className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-muted-foreground/70">System Status:</span>
                  <div className="flex items-center gap-1">
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Operational</span>
                  </div>
                </div>

                <span className="text-muted-foreground/20">|</span>

                {/* Connection Status */}
                <div className="flex items-center gap-1.5">
                  {isConnected ? (
                    <Wifi className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span className={isConnected ? 'text-muted-foreground/70' : 'text-red-500'}>
                    {isConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>

                <span className="text-muted-foreground/20">|</span>

                {/* Last Sync */}
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-muted-foreground/70">Last sync: {lastSyncTime}</span>
                </div>

                <span className="text-muted-foreground/20">|</span>

                {/* Security indicator */}
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-muted-foreground/70">AES-256</span>
                </div>
              </div>

              {/* Right section - Version & Powered by */}
              <div className="flex-1 flex items-center justify-end gap-3">
                <span className="text-muted-foreground/60">v2.1.0</span>
                <span className="text-muted-foreground/30">·</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground/60">Powered by</span>
                  <div className="flex items-center gap-1">
                    <FileSignature className="h-3 w-3 text-primary" />
                    <span className="font-medium text-primary/80">Z.ai</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
