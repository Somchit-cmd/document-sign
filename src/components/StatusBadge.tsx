'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusColor } from '@/lib/api';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('capitalize font-medium text-xs', getStatusColor(status), className)}
    >
      {status}
    </Badge>
  );
}
