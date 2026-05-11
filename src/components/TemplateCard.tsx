'use client';

import type { Template } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Users, Clock, ArrowRight, TrendingUp, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TemplateCardProps {
  template: Template;
  onUse: () => void;
}

const categoryColors: Record<string, string> = {
  contract: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  agreement: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  nda: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  proposal: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  invoice: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hr: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  legal: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group" onClick={onUse}>
      <CardContent className="p-4">
        {/* Template preview */}
        <div className="bg-muted/30 rounded-lg border border-border h-32 flex items-center justify-center mb-4 relative overflow-hidden group/img">
          <FileText className="h-12 w-12 text-muted-foreground/30" />
          <Badge
            className={`absolute top-2 right-2 text-[10px] capitalize ${categoryColors[template.category] || categoryColors.other}`}
          >
            {template.category}
          </Badge>
          {/* Hover preview overlay */}
          <div className="absolute inset-0 bg-primary/5 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          {template.usageCount > 100 && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] border-0">
                <TrendingUp className="mr-0.5 h-2.5 w-2.5" />Popular
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="text-sm font-medium group-hover:text-primary transition-colors">{template.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>

        {/* Meta */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{template.usageCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(template.updatedAt), { addSuffix: false })}</span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            Use <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
