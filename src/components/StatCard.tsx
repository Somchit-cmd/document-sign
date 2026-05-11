'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
  className?: string;
  variant?: 'default' | 'emerald' | 'teal' | 'cyan' | 'amber';
  sparklineData?: number[];
  viewDetailsHref?: string;
  onViewDetails?: () => void;
}

// Mini sparkline component
function MiniSparkline({ data, color = '#10b981' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;

  const width = 60;
  const height = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-40">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Animated number counter
function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;
    const endValue = value;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (endValue - startValue) * eased);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, isInView]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

const variantStyles: Record<string, { gradient: string; iconBg: string; border: string; sparkColor: string }> = {
  default: {
    gradient: 'from-card to-card',
    iconBg: 'bg-primary/10',
    border: 'border-border',
    sparkColor: '#10b981',
  },
  emerald: {
    gradient: 'from-emerald-50/80 to-card dark:from-emerald-950/20 dark:to-card',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
    border: 'border-emerald-200/50 dark:border-emerald-900/30',
    sparkColor: '#10b981',
  },
  teal: {
    gradient: 'from-teal-50/80 to-card dark:from-teal-950/20 dark:to-card',
    iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white',
    border: 'border-teal-200/50 dark:border-teal-900/30',
    sparkColor: '#14b8a6',
  },
  cyan: {
    gradient: 'from-cyan-50/80 to-card dark:from-cyan-950/20 dark:to-card',
    iconBg: 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white',
    border: 'border-cyan-200/50 dark:border-cyan-900/30',
    sparkColor: '#06b6d4',
  },
  amber: {
    gradient: 'from-amber-50/80 to-card dark:from-amber-950/20 dark:to-card',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
    border: 'border-amber-200/50 dark:border-amber-900/30',
    sparkColor: '#f59e0b',
  },
};

export function StatCard({ title, value, trend, icon, className, variant = 'default', sparklineData, viewDetailsHref, onViewDetails }: StatCardProps) {
  const isPositive = trend && trend > 0;
  const styles = variantStyles[variant] || variantStyles.default;

  // Generate random sparkline data if not provided
  const defaultSparkline = sparklineData || Array.from({ length: 7 }, () => Math.random() * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={cn(
        'card-hover-lift hover-card-glow card-tilt gradient-border-hover border rounded-xl overflow-hidden',
        styles.border,
        'bg-gradient-to-br',
        styles.gradient,
        className
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold tracking-tight">
                {typeof value === 'number' ? (
                  <AnimatedCounter value={value} />
                ) : (
                  value
                )}
              </p>
              {trend !== undefined && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(trend)}% from last month</span>
                  {/* Sparkle on trend */}
                  {isPositive && (
                    <motion.span
                      className="inline-block ml-1"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ✦
                    </motion.span>
                  )}
                </motion.div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={cn('rounded-xl p-2.5 shadow-lg shadow-primary/10', styles.iconBg)}>
                {icon}
              </div>
              <MiniSparkline data={defaultSparkline} color={styles.sparkColor} />
            </div>
          </div>
          {(viewDetailsHref || onViewDetails) && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails?.();
                }}
                className="text-xs font-medium text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
              >
                View Details
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
