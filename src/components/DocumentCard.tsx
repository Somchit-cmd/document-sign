'use client';

import type { Document } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatFileSize } from '@/lib/api';
import { Progress } from '@/components/ui/progress';

interface DocumentCardProps {
  document: Document;
  onClick: () => void;
}

export function DocumentCard({ document, onClick }: DocumentCardProps) {
  const signedCount = document.signatures.filter(s => s.signedAt).length;
  const totalSigners = document.recipients.length || document.signatures.length;
  const progressPct = totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0;
  const category = document.tags?.[0] || document.folder || 'Document';

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {document.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground truncate">
                {document.fileName} · {formatFileSize(document.fileSize)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <StatusBadge status={document.status} />
          <PriorityBadge priority={document.priority} />
          <Badge variant="outline" className="text-[9px] capitalize px-1.5 py-0">
            {category}
          </Badge>
        </div>

        {/* Signature progress */}
        {totalSigners > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Progress value={progressPct} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{signedCount}/{totalSigners}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Avatar className="h-4 w-4">
              <AvatarFallback className="text-[6px] bg-primary/10 text-primary">
                {document.owner.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[80px]">{document.owner.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
