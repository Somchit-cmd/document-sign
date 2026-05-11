'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getPriorityColor } from '@/lib/api';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('capitalize font-medium text-xs', getPriorityColor(priority), className)}
    >
      {priority}
    </Badge>
  );
}
