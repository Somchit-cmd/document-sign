'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileQuestion, Inbox, LayoutTemplate, ShieldCheck, FileText, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'documents' | 'inbox' | 'templates' | 'audit' | 'folder';
}

const variantConfig: Record<string, { icon: React.ReactNode; emoji: string }> = {
  default: { icon: <FileQuestion className="h-10 w-10" />, emoji: '📄' },
  documents: { icon: <FileText className="h-10 w-10" />, emoji: '📑' },
  inbox: { icon: <Inbox className="h-10 w-10" />, emoji: '✉️' },
  templates: { icon: <LayoutTemplate className="h-10 w-10" />, emoji: '📋' },
  audit: { icon: <ShieldCheck className="h-10 w-10" />, emoji: '🛡️' },
  folder: { icon: <FolderOpen className="h-10 w-10" />, emoji: '📁' },
};

export function EmptyState({ icon, title, description, action, variant = 'default' }: EmptyStateProps) {
  const config = variantConfig[variant] || variantConfig.default;
  const displayIcon = icon || config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Animated illustration container */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl scale-150" />

        {/* Main icon circle with gentle bobbing */}
        <motion.div
          className="relative rounded-full bg-muted/50 border border-border p-6"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="text-muted-foreground/40">
            {displayIcon}
          </div>
        </motion.div>

        {/* Floating accent elements */}
        <motion.div
          className="absolute -top-2 -right-2 text-lg"
          animate={{ y: [0, -4, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          {config.emoji}
        </motion.div>

        <motion.div
          className="absolute -bottom-1 -left-3 text-sm opacity-60"
          animate={{ y: [0, -3, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          ✨
        </motion.div>
      </motion.div>

      <motion.h3
        className="text-lg font-semibold mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="text-muted-foreground text-sm max-w-md mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        {description}
      </motion.p>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Button onClick={action.onClick} className="bg-primary hover:bg-primary/90 btn-click-scale">
            {action.label}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
