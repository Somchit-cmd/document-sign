'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getRoleColor } from '@/lib/api';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn('capitalize font-medium text-xs', getRoleColor(role), className)}
    >
      {role}
    </Badge>
  );
}
