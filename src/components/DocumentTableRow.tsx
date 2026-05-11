'use client';

import type { Document } from '@/lib/types';
import { formatFileSize } from '@/lib/api';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TableCell, TableRow } from '@/components/ui/table';
import { FileText, MoreHorizontal, Eye, Send, Trash2, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface DocumentTableRowProps {
  document: Document;
  onClick: () => void;
}

export function DocumentTableRow({ document, onClick }: DocumentTableRowProps) {
  const signedCount = document.signatures.filter(s => s.signedAt).length;
  const totalSigners = document.recipients.length || document.signatures.length;
  const category = document.tags?.[0] || document.folder || '';

  return (
    <TableRow className="cursor-pointer hover:bg-accent/50" onClick={onClick}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-1.5 shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[280px]">{document.title}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{document.fileName}</span>
              {category && (
                <Badge variant="outline" className="text-[9px] h-4 capitalize px-1.5 py-0">
                  {category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={document.status} />
      </TableCell>
      <TableCell>
        <PriorityBadge priority={document.priority} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {document.owner.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{document.owner.name}</span>
        </div>
      </TableCell>
      <TableCell>
        {totalSigners > 0 ? (
          <div className="flex items-center gap-2 min-w-[100px]">
            <Progress value={(signedCount / totalSigners) * 100} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{signedCount}/{totalSigners}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
