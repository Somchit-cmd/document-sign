'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ActivityItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { FileText, FileSignature, ShieldCheck, LogIn, LogOut, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const actionIcons: Record<string, React.ReactNode> = {
  'document.created': <FileText className="h-4 w-4 text-blue-500" />,
  'document.sent': <FileText className="h-4 w-4 text-cyan-500" />,
  'document.viewed': <Eye className="h-4 w-4 text-slate-500" />,
  'document.signed': <FileSignature className="h-4 w-4 text-emerald-500" />,
  'document.completed': <FileSignature className="h-4 w-4 text-emerald-500" />,
  'document.rejected': <FileText className="h-4 w-4 text-red-500" />,
  'signature.added': <FileSignature className="h-4 w-4 text-emerald-500" />,
  'workflow.approved': <ShieldCheck className="h-4 w-4 text-emerald-500" />,
  'workflow.rejected': <ShieldCheck className="h-4 w-4 text-red-500" />,
  'user.login': <LogIn className="h-4 w-4 text-blue-500" />,
  'user.logout': <LogOut className="h-4 w-4 text-slate-500" />,
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <ScrollArea className="h-96">
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="flex gap-3 group"
          >
            <div className="mt-0.5 shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {activity.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{' '}
                    <span className="text-muted-foreground">{activity.description}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <div className="shrink-0 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  {actionIcons[activity.action] || <FileText className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  );
}
