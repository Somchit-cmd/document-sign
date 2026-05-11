'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  CalendarClock,
  User,
  ArrowRight,
  List,
  LayoutGrid,
  CalendarDays,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────
type EventType = 'deadline' | 'signing' | 'approval' | 'review' | 'expiry';
type ViewMode = 'month' | 'week' | 'agenda';

interface CalendarEvent {
  id: string;
  title: string;
  documentName: string;
  description: string;
  date: Date;
  time: string;
  type: EventType;
  status: 'pending' | 'completed' | 'overdue' | 'in-progress';
  assignedTo: { name: string; avatar: string; initials: string };
}

// ─── Event Type Config ────────────────────────────────────────────
const eventTypeConfig: Record<EventType, { label: string; color: string; dotColor: string; bgColor: string; borderColor: string; icon: string }> = {
  deadline: { label: 'Document Deadline', color: 'text-red-500', dotColor: 'bg-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: '🔴' },
  signing: { label: 'Signing Event', color: 'text-blue-500', dotColor: 'bg-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: '🔵' },
  approval: { label: 'Approval Milestone', color: 'text-emerald-500', dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', icon: '🟢' },
  review: { label: 'Review Deadline', color: 'text-amber-500', dotColor: 'bg-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', icon: '🟡' },
  expiry: { label: 'Expiry Date', color: 'text-purple-500', dotColor: 'bg-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', icon: '🟣' },
};

// ─── Mock Data Generator ──────────────────────────────────────────
function generateMockEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Contract Signing Deadline',
      documentName: 'Master Service Agreement - Acme Corp',
      description: 'Final signature required from the client side. All internal approvals have been completed. Follow up with client contact if not signed by EOD.',
      date: new Date(year, month, 3, 14, 0),
      time: '2:00 PM',
      type: 'deadline',
      status: 'pending',
      assignedTo: { name: 'Sarah Johnson', avatar: '', initials: 'SJ' },
    },
    {
      id: '2',
      title: 'NDA Review Completion',
      documentName: 'Mutual NDA - TechVentures LLC',
      description: 'Legal team review deadline for the mutual NDA. Focus on non-compete and IP protection clauses.',
      date: new Date(year, month, 5, 10, 0),
      time: '10:00 AM',
      type: 'review',
      status: 'pending',
      assignedTo: { name: 'Michael Chen', avatar: '', initials: 'MC' },
    },
    {
      id: '3',
      title: 'Employment Agreement Signing',
      documentName: 'Employment Agreement - David Park',
      description: 'New hire signing session for senior developer position. HR representative will be present.',
      date: new Date(year, month, 7, 11, 30),
      time: '11:30 AM',
      type: 'signing',
      status: 'pending',
      assignedTo: { name: 'Emily Rodriguez', avatar: '', initials: 'ER' },
    },
    {
      id: '4',
      title: 'Compliance Review Deadline',
      documentName: 'SOC 2 Compliance Report Q4',
      description: 'Compliance team must complete review of Q4 security audit report before board presentation.',
      date: new Date(year, month, 8, 17, 0),
      time: '5:00 PM',
      type: 'review',
      status: 'in-progress',
      assignedTo: { name: 'Alex Thompson', avatar: '', initials: 'AT' },
    },
    {
      id: '5',
      title: 'Document Expiry Alert',
      documentName: 'Vendor Agreement - DataFlow Inc',
      description: 'This vendor agreement expires today. Renewal terms have been negotiated but not yet signed.',
      date: new Date(year, month, 10, 0, 0),
      time: '12:00 AM',
      type: 'expiry',
      status: 'pending',
      assignedTo: { name: 'Sarah Johnson', avatar: '', initials: 'SJ' },
    },
    {
      id: '6',
      title: 'Approval Step Deadline',
      documentName: 'Merger Agreement - Draft v3',
      description: 'CFO approval required on the latest merger agreement draft. Financial terms section updated per last meeting.',
      date: new Date(year, month, 12, 16, 0),
      time: '4:00 PM',
      type: 'approval',
      status: 'pending',
      assignedTo: { name: 'Robert Kim', avatar: '', initials: 'RK' },
    },
    {
      id: '7',
      title: 'Lease Agreement Signing',
      documentName: 'Office Lease - 500 Market St',
      description: 'Scheduled signing session for new office lease. Both parties confirmed attendance.',
      date: new Date(year, month, 14, 9, 0),
      time: '9:00 AM',
      type: 'signing',
      status: 'pending',
      assignedTo: { name: 'Emily Rodriguez', avatar: '', initials: 'ER' },
    },
    {
      id: '8',
      title: 'IP Assignment Deadline',
      documentName: 'IP Assignment - Project Aurora',
      description: 'All team members must sign IP assignment documents for Project Aurora before development sprint begins.',
      date: new Date(year, month, 15, 12, 0),
      time: '12:00 PM',
      type: 'deadline',
      status: 'pending',
      assignedTo: { name: 'Michael Chen', avatar: '', initials: 'MC' },
    },
    {
      id: '9',
      title: 'Policy Document Review',
      documentName: 'Remote Work Policy 2025',
      description: 'HR policy update review. Changes to home office stipend and equipment allowance sections.',
      date: new Date(year, month, 17, 14, 30),
      time: '2:30 PM',
      type: 'review',
      status: 'pending',
      assignedTo: { name: 'Alex Thompson', avatar: '', initials: 'AT' },
    },
    {
      id: '10',
      title: 'Partnership Agreement Expiry',
      documentName: 'Strategic Partnership - CloudSync',
      description: 'Partnership agreement expires in 5 days. Auto-renewal clause exists but requires written confirmation.',
      date: new Date(year, month, 20, 0, 0),
      time: '12:00 AM',
      type: 'expiry',
      status: 'pending',
      assignedTo: { name: 'Sarah Johnson', avatar: '', initials: 'SJ' },
    },
    {
      id: '11',
      title: 'Board Resolution Approval',
      documentName: 'Board Resolution - Stock Split',
      description: 'Board members must approve the 3:1 stock split resolution before shareholder meeting.',
      date: new Date(year, month, 22, 10, 0),
      time: '10:00 AM',
      type: 'approval',
      status: 'pending',
      assignedTo: { name: 'Robert Kim', avatar: '', initials: 'RK' },
    },
    {
      id: '12',
      title: 'Consulting Contract Deadline',
      documentName: 'Consulting Agreement - Deloitte',
      description: 'Signed consulting agreement must be returned by deadline to secure Q1 engagement.',
      date: new Date(year, month, 24, 17, 0),
      time: '5:00 PM',
      type: 'deadline',
      status: 'pending',
      assignedTo: { name: 'Michael Chen', avatar: '', initials: 'MC' },
    },
    {
      id: '13',
      title: 'SLA Signing Session',
      documentName: 'Service Level Agreement - MegaCorp',
      description: 'Virtual signing session for enterprise SLA. IT and Legal representatives from both sides will attend.',
      date: new Date(year, month, 26, 13, 0),
      time: '1:00 PM',
      type: 'signing',
      status: 'pending',
      assignedTo: { name: 'Emily Rodriguez', avatar: '', initials: 'ER' },
    },
    // Next month events
    {
      id: '14',
      title: 'Annual Report Filing',
      documentName: 'Annual Compliance Report 2024',
      description: 'Annual compliance report must be filed with regulatory authorities. All department heads must certify their sections.',
      date: new Date(year, month + 1, 2, 9, 0),
      time: '9:00 AM',
      type: 'deadline',
      status: 'pending',
      assignedTo: { name: 'Alex Thompson', avatar: '', initials: 'AT' },
    },
    {
      id: '15',
      title: 'Non-Compete Signing',
      documentName: 'Non-Compete Agreement - Key Staff',
      description: 'Key staff members signing updated non-compete agreements as part of annual policy review.',
      date: new Date(year, month + 1, 5, 11, 0),
      time: '11:00 AM',
      type: 'signing',
      status: 'pending',
      assignedTo: { name: 'Emily Rodriguez', avatar: '', initials: 'ER' },
    },
    {
      id: '16',
      title: 'Insurance Policy Expiry',
      documentName: 'Directors & Officers Insurance',
      description: 'D&O insurance policy expires. Renewal quote received from broker, needs approval.',
      date: new Date(year, month + 1, 8, 0, 0),
      time: '12:00 AM',
      type: 'expiry',
      status: 'pending',
      assignedTo: { name: 'Robert Kim', avatar: '', initials: 'RK' },
    },
    {
      id: '17',
      title: 'Marketing Budget Approval',
      documentName: 'Q2 Marketing Budget Proposal',
      description: 'CMO approval required on Q2 marketing budget. Digital marketing spend increased by 20%.',
      date: new Date(year, month + 1, 10, 15, 0),
      time: '3:00 PM',
      type: 'approval',
      status: 'pending',
      assignedTo: { name: 'Sarah Johnson', avatar: '', initials: 'SJ' },
    },
    {
      id: '18',
      title: 'Terms of Service Review',
      documentName: 'Platform ToS Update - v4.2',
      description: 'Legal review of updated terms of service. GDPR and CCPA compliance updates included.',
      date: new Date(year, month + 1, 12, 10, 30),
      time: '10:30 AM',
      type: 'review',
      status: 'pending',
      assignedTo: { name: 'Michael Chen', avatar: '', initials: 'MC' },
    },
    // Some overdue events
    {
      id: '19',
      title: 'Tax Filing Deadline',
      documentName: 'Q4 Tax Filing - Corporate',
      description: 'Corporate tax filing for Q4 was due. Penalty risk if not completed immediately.',
      date: new Date(year, month, Math.max(1, now.getDate() - 3), 17, 0),
      time: '5:00 PM',
      type: 'deadline',
      status: 'overdue',
      assignedTo: { name: 'Alex Thompson', avatar: '', initials: 'AT' },
    },
    {
      id: '20',
      title: 'Supplier Contract Review',
      documentName: 'Supplier Agreement - RawTech',
      description: 'Procurement team review of updated supplier terms. Pricing and delivery schedule changes.',
      date: new Date(year, month, Math.max(1, now.getDate() - 1), 14, 0),
      time: '2:00 PM',
      type: 'review',
      status: 'overdue',
      assignedTo: { name: 'Robert Kim', avatar: '', initials: 'RK' },
    },
  ];

  // Mark some as completed
  const completedIds = ['3', '7'];
  completedIds.forEach(id => {
    const event = events.find(e => e.id === id);
    if (event) event.status = 'completed';
  });

  return events;
}

// ─── Helper: Date formatting ──────────────────────────────────────
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isToday(date: Date): boolean {
  const now = new Date();
  return isSameDay(date, now);
}

// ─── Stats Bar Component ──────────────────────────────────────────
function StatsBar({ events, currentMonth, currentYear }: { events: CalendarEvent[]; currentMonth: number; currentYear: number }) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const stats = useMemo(() => {
    const monthEvents = events.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const upcomingDeadlines = events.filter(e => {
      const d = new Date(e.date);
      return d >= now && d <= sevenDaysFromNow && e.status !== 'completed';
    });

    const overdue = events.filter(e => e.status === 'overdue');

    const completed = monthEvents.filter(e => e.status === 'completed');

    return {
      thisMonth: monthEvents.length,
      upcomingDeadlines: upcomingDeadlines.length,
      overdue: overdue.length,
      completed: completed.length,
    };
  }, [events, currentMonth, currentYear]);

  const statCards = [
    { label: 'Events This Month', value: stats.thisMonth, icon: CalendarDays, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Upcoming (7 days)', value: stats.upcomingDeadlines, icon: Clock, gradient: 'from-blue-500 to-cyan-600' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, gradient: 'from-red-500 to-orange-600' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, gradient: 'from-green-500 to-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {statCards.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="glass-card overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={cn('rounded-xl p-2.5 bg-gradient-to-br', stat.gradient)}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Month View Component ─────────────────────────────────────────
function MonthView({
  currentMonth,
  currentYear,
  events,
  selectedDate,
  onSelectDate,
  onSelectEvent,
  activeFilters,
}: {
  currentMonth: number;
  currentYear: number;
  events: CalendarEvent[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  activeFilters: Set<EventType>;
}) {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const today = new Date();

  const filteredEvents = useMemo(
    () => events.filter(e => activeFilters.has(e.type)),
    [events, activeFilters]
  );

  const getEventsForDay = useCallback(
    (day: number) => {
      return filteredEvents.filter(e => {
        const d = new Date(e.date);
        return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    },
    [filteredEvents, currentMonth, currentYear]
  );

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
      {/* Day names header */}
      <div className="grid grid-cols-7 bg-muted/50">
        {dayNames.map(day => (
          <div key={day} className="py-2.5 text-center text-xs font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[90px] border-t border-border/30 bg-muted/10" />;
          }

          const date = new Date(currentYear, currentMonth, day);
          const dayEvents = getEventsForDay(day);
          const isCurrentDay = isToday(date);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.008 }}
              className={cn(
                'min-h-[90px] border-t border-border/30 p-1.5 cursor-pointer transition-all duration-200 hover:bg-accent/50 relative group',
                isCurrentDay && 'bg-emerald-500/5',
                isSelected && 'bg-primary/5 ring-1 ring-primary/20',
                isPast && !isCurrentDay && 'opacity-60'
              )}
              onClick={() => onSelectDate(date)}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full transition-all',
                    isCurrentDay && 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-300 dark:ring-emerald-700',
                    !isCurrentDay && 'text-foreground/80'
                  )}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event dots */}
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map(event => (
                  <button
                    key={event.id}
                    onClick={e => {
                      e.stopPropagation();
                      onSelectEvent(event);
                    }}
                    className={cn(
                      'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate w-full text-left transition-all hover:opacity-80',
                      eventTypeConfig[event.type].bgColor,
                      eventTypeConfig[event.type].color
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', eventTypeConfig[event.type].dotColor)} />
                    <span className="truncate">{event.title}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-muted-foreground px-1.5">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View Component ──────────────────────────────────────────
function WeekView({
  currentMonth,
  currentYear,
  currentDate,
  events,
  onSelectEvent,
  activeFilters,
}: {
  currentMonth: number;
  currentYear: number;
  currentDate: number;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  activeFilters: Set<EventType>;
}) {
  const today = new Date();

  // Calculate the start of the week containing currentDate
  const weekStart = useMemo(() => {
    const d = new Date(currentYear, currentMonth, currentDate);
    const dayOfWeek = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - dayOfWeek);
    return start;
  }, [currentYear, currentMonth, currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const filteredEvents = useMemo(
    () => events.filter(e => activeFilters.has(e.type)),
    [events, activeFilters]
  );

  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
      {/* Header row */}
      <div className="grid grid-cols-8 bg-muted/50 border-b border-border/30">
        <div className="py-2.5 text-center text-xs font-semibold text-muted-foreground border-r border-border/30">
          Time
        </div>
        {weekDays.map((day, i) => {
          const isCurrentDay = isToday(day);
          return (
            <div
              key={i}
              className={cn(
                'py-2.5 text-center text-xs font-semibold border-r border-border/30 last:border-r-0',
                isCurrentDay ? 'text-emerald-500' : 'text-muted-foreground'
              )}
            >
              <div>{dayNames[day.getDay()]}</div>
              <div className={cn('text-lg font-bold mt-0.5', isCurrentDay && 'text-emerald-500')}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="h-[500px]">
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-border/20 min-h-[60px]">
              <div className="py-1 text-center text-[10px] text-muted-foreground border-r border-border/30 flex items-start justify-center pt-2">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              {weekDays.map((day, dayIdx) => {
                const dayEvents = filteredEvents.filter(e => {
                  const d = new Date(e.date);
                  return isSameDay(d, day) && d.getHours() === hour;
                });
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      'border-r border-border/20 last:border-r-0 p-0.5 relative',
                      isCurrentDay && 'bg-emerald-500/5'
                    )}
                  >
                    {dayEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className={cn(
                          'w-full text-left px-1.5 py-1 rounded text-[10px] font-medium mb-0.5 transition-all hover:opacity-80',
                          eventTypeConfig[event.type].bgColor,
                          eventTypeConfig[event.type].color
                        )}
                      >
                        {event.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Agenda View Component ────────────────────────────────────────
function AgendaView({
  events,
  onSelectEvent,
  activeFilters,
}: {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  activeFilters: Set<EventType>;
}) {
  const now = new Date();

  const filteredEvents = useMemo(
    () => events.filter(e => activeFilters.has(e.type)),
    [events, activeFilters]
  );

  const groupedEvents = useMemo(() => {
    const sorted = [...filteredEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
    const groups: { label: string; events: CalendarEvent[] }[] = [];
    const todayStr = 'Today';
    const tomorrowStr = 'Tomorrow';

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);

    const overdue = sorted.filter(e => e.date < todayStart && e.status !== 'completed');
    const todayEvents = sorted.filter(e => e.date >= todayStart && e.date < tomorrowStart);
    const tomorrowEvents = sorted.filter(e => e.date >= tomorrowStart && e.date < tomorrowEnd);
    const upcoming = sorted.filter(e => e.date >= tomorrowEnd && e.status !== 'completed');
    const completed = sorted.filter(e => e.status === 'completed');

    if (overdue.length > 0) groups.push({ label: 'Overdue', events: overdue });
    if (todayEvents.length > 0) groups.push({ label: todayStr, events: todayEvents });
    if (tomorrowEvents.length > 0) groups.push({ label: tomorrowStr, events: tomorrowEvents });
    if (upcoming.length > 0) groups.push({ label: 'Upcoming', events: upcoming });
    if (completed.length > 0) groups.push({ label: 'Completed', events: completed });

    return groups;
  }, [filteredEvents, now]);

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 pr-3">
        {groupedEvents.map(group => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <h3
                className={cn(
                  'text-sm font-semibold',
                  group.label === 'Overdue' && 'text-red-500',
                  group.label === 'Today' && 'text-emerald-500',
                  group.label === 'Tomorrow' && 'text-blue-500',
                  group.label === 'Upcoming' && 'text-amber-500',
                  group.label === 'Completed' && 'text-green-500'
                )}
              >
                {group.label}
              </h3>
              <Badge variant="secondary" className="text-[10px] h-4">
                {group.events.length}
              </Badge>
              <div className="flex-1 h-px bg-border/50" />
            </div>
            <div className="space-y-2">
              {group.events.map(event => (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => onSelectEvent(event)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all hover:shadow-md hover:translate-x-0.5',
                    eventTypeConfig[event.type].borderColor,
                    eventTypeConfig[event.type].bgColor,
                    event.status === 'overdue' && 'border-red-500/50 bg-red-500/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{eventTypeConfig[event.type].icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm truncate">{event.title}</span>
                        <Badge
                          variant={event.status === 'overdue' ? 'destructive' : 'secondary'}
                          className="text-[10px] h-4 shrink-0"
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{event.documentName}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {event.assignedTo.name}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
        {groupedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No events match your filters</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Event Detail Dialog ──────────────────────────────────────────
function EventDetailDialog({
  event,
  open,
  onClose,
}: {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  const { navigate } = useAppStore();

  if (!event) return null;

  const config = eventTypeConfig[event.type];

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    completed: 'bg-green-500/10 text-green-600 border-green-500/30',
    overdue: 'bg-red-500/10 text-red-600 border-red-500/30',
    'in-progress': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-xl">{config.icon}</span>
            <span>{event.title}</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Event details and actions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Type & Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('border', config.bgColor, config.color, config.borderColor)}>
              {config.label}
            </Badge>
            <Badge className={cn('border', statusColors[event.status])}>
              {event.status === 'in-progress' ? 'In Progress' : event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Badge>
          </div>

          {/* Document info */}
          <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Document</span>
            </div>
            <p className="text-sm text-foreground ml-6">{event.documentName}</p>
          </div>

          {/* Date & Time */}
          <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date & Time</span>
            </div>
            <div className="ml-6 space-y-0.5">
              <p className="text-sm text-foreground">{formatDate(event.date)}</p>
              <p className="text-sm text-muted-foreground">{formatTime(event.date)}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{event.description}</p>
          </div>

          <Separator />

          {/* Assigned person */}
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={event.assignedTo.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                {event.assignedTo.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{event.assignedTo.name}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </div>
          </div>

          <Separator />

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
              onClick={() => {
                navigate('documents');
                onClose();
              }}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              View Document
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast.info('Reschedule feature coming soon');
                onClose();
              }}
            >
              <CalendarClock className="h-4 w-4 mr-1.5" />
              Reschedule
            </Button>
            <Button
              variant="outline"
              className="border-green-500/30 text-green-600 hover:bg-green-500/10"
              onClick={() => {
                toast.success('Event marked as complete');
                onClose();
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Mark Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Calendar Page ───────────────────────────────────────────
export function CalendarPage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(
    new Set(['deadline', 'signing', 'approval', 'review', 'expiry'])
  );
  const [mobileShowAgenda, setMobileShowAgenda] = useState(false);

  const events = useMemo(() => generateMockEvents(), []);

  // Auto-detect mobile and show agenda
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const effectiveViewMode = isMobile && !mobileShowAgenda ? 'agenda' : viewMode;

  // Navigation
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  // Filter toggle
  const toggleFilter = (type: EventType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Selected day events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => {
      const d = new Date(e.date);
      return isSameDay(d, selectedDate) && activeFilters.has(e.type);
    });
  }, [selectedDate, events, activeFilters]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const currentDate = new Date();
    const sevenDaysFromNow = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events
      .filter(e => e.date >= currentDate && e.date <= sevenDaysFromNow && e.status !== 'completed' && activeFilters.has(e.type))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, activeFilters]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDialogOpen(true);
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const viewModeButtons: { mode: ViewMode; icon: typeof CalendarDays; label: string }[] = [
    { mode: 'month', icon: LayoutGrid, label: 'Month' },
    { mode: 'week', icon: CalendarDays, label: 'Week' },
    { mode: 'agenda', icon: List, label: 'Agenda' },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-emerald-500" />
            Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track document deadlines, signing events, and milestones
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border/50">
          {viewModeButtons.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              size="sm"
              variant={effectiveViewMode === mode ? 'default' : 'ghost'}
              className={cn(
                'text-xs gap-1.5 h-8',
                effectiveViewMode === mode && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-sm'
              )}
              onClick={() => setViewMode(mode)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Stats Bar */}
      <StatsBar events={events} currentMonth={currentMonth} currentYear={currentYear} />

      {/* Filter Pills */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(Object.keys(eventTypeConfig) as EventType[]).map(type => {
          const config = eventTypeConfig[type];
          const isActive = activeFilters.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                isActive
                  ? cn(config.bgColor, config.color, config.borderColor, 'shadow-sm')
                  : 'bg-muted/30 text-muted-foreground border-border/30 opacity-50 hover:opacity-80'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full', config.dotColor, !isActive && 'opacity-50')} />
              {config.label}
            </button>
          );
        })}
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar / View Area */}
        <div className="lg:col-span-2 space-y-3">
          {/* Month Navigation */}
          {effectiveViewMode !== 'agenda' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold min-w-[180px] text-center">{monthName}</h2>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                onClick={goToToday}
              >
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                Today
              </Button>
            </div>
          )}

          {/* Calendar View */}
          <AnimatePresence mode="wait">
            {effectiveViewMode === 'month' && (
              <motion.div
                key="month"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MonthView
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  events={events}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onSelectEvent={handleSelectEvent}
                  activeFilters={activeFilters}
                />
              </motion.div>
            )}
            {effectiveViewMode === 'week' && (
              <motion.div
                key="week"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <WeekView
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  currentDate={selectedDate?.getDate() || now.getDate()}
                  events={events}
                  onSelectEvent={handleSelectEvent}
                  activeFilters={activeFilters}
                />
              </motion.div>
            )}
            {effectiveViewMode === 'agenda' && (
              <motion.div
                key="agenda"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AgendaView
                  events={events}
                  onSelectEvent={handleSelectEvent}
                  activeFilters={activeFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Day Events (below calendar when a day is selected) */}
          <AnimatePresence>
            {selectedDate && effectiveViewMode === 'month' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-card border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">
                        Events for {formatShortDate(selectedDate)}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setSelectedDate(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedDayEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No events on this day</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayEvents.map(event => {
                          const config = eventTypeConfig[event.type];
                          return (
                            <button
                              key={event.id}
                              onClick={() => handleSelectEvent(event)}
                              className={cn(
                                'w-full text-left p-3 rounded-lg border transition-all hover:shadow-md',
                                config.borderColor,
                                config.bgColor
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span>{config.icon}</span>
                                <span className="font-medium text-sm">{event.title}</span>
                                <Badge
                                  variant={event.status === 'overdue' ? 'destructive' : 'secondary'}
                                  className="text-[10px] h-4 ml-auto"
                                >
                                  {event.status === 'in-progress' ? 'In Progress' : event.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">{event.documentName}</p>
                              <div className="flex items-center gap-3 mt-1 ml-6 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(event.date)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming Events */}
          <Card className="glass-card border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                Upcoming Events
                <Badge variant="secondary" className="text-[10px] h-4 ml-auto">
                  Next 7 days
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2 pr-2">
                    {upcomingEvents.map((event, i) => {
                      const config = eventTypeConfig[event.type];
                      return (
                        <motion.button
                          key={event.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSelectEvent(event)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg border transition-all hover:shadow-md hover:translate-x-0.5',
                            config.borderColor,
                            config.bgColor
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={cn('rounded-lg p-1.5 mt-0.5', config.bgColor)}>
                              <span className="text-sm">{config.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{event.documentName}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="outline" className={cn('text-[10px] h-4 border', config.borderColor, config.color)}>
                                  {config.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatShortDate(event.date)} · {event.time}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Quick Legend */}
          <Card className="glass-card border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Event Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(eventTypeConfig) as EventType[]).map(type => {
                const config = eventTypeConfig[type];
                const count = events.filter(e => e.type === type && activeFilters.has(type)).length;
                return (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <span className={cn('w-2.5 h-2.5 rounded-full', config.dotColor)} />
                    <span className="text-muted-foreground flex-1">{config.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Keyboard Navigation hint */}
          <Card className="glass-card border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                  G
                </kbd>
                <span>then</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                  C
                </kbd>
                <span className="ml-1">to navigate here</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <EventDetailDialog
        event={selectedEvent}
        open={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
      />
    </div>
  );
}
