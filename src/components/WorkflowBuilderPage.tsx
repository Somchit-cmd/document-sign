'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, mockUsers } from '@/lib/api';
import type { User, Department } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  PenLine,
  Eye,
  Bell,
  GitBranch,
  Play,
  Save,
  ArrowDown,
  Circle,
  ChevronRight,
  Move,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type StepType = 'approval' | 'signature' | 'review' | 'notification' | 'condition';

interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  assigneeId: string;
  department: string;
  dueDate: string;
  required: boolean;
  autoRemind: boolean;
  comment: string;
  status: 'pending' | 'complete';
}

interface StepPaletteItem {
  type: StepType;
  label: string;
  description: string;
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEP_PALETTE: StepPaletteItem[] = [
  {
    type: 'approval',
    label: 'Approval Step',
    description: 'Requires approval from assignee',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    type: 'signature',
    label: 'Signature Step',
    description: 'Requires electronic signature',
    icon: PenLine,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-200 dark:border-teal-800',
  },
  {
    type: 'review',
    label: 'Review Step',
    description: 'Document review and feedback',
    icon: Eye,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  {
    type: 'notification',
    label: 'Notification Step',
    description: 'Send notification to recipient',
    icon: Bell,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    type: 'condition',
    label: 'Condition Step',
    description: 'If/else branching logic',
    icon: GitBranch,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
];

// Gradient backgrounds for step type icons
const STEP_GRADIENTS: Record<StepType, string> = {
  approval: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  signature: 'bg-gradient-to-br from-teal-500 to-cyan-600',
  review: 'bg-gradient-to-br from-cyan-500 to-teal-600',
  notification: 'bg-gradient-to-br from-amber-500 to-orange-600',
  condition: 'bg-gradient-to-br from-purple-500 to-violet-600',
};

function getStepConfig(type: StepType): StepPaletteItem {
  return STEP_PALETTE.find((s) => s.type === type) || STEP_PALETTE[0];
}

function generateId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

const INITIAL_STEPS: WorkflowStep[] = [
  {
    id: 'step-init-1',
    type: 'approval',
    name: 'Manager Approval',
    assigneeId: '2',
    department: '',
    dueDate: '',
    required: true,
    autoRemind: true,
    comment: '',
    status: 'pending',
  },
  {
    id: 'step-init-2',
    type: 'signature',
    name: 'Legal Director Signature',
    assigneeId: '2',
    department: '',
    dueDate: '',
    required: true,
    autoRemind: false,
    comment: '',
    status: 'pending',
  },
  {
    id: 'step-init-3',
    type: 'notification',
    name: 'Notify HR Department',
    assigneeId: '5',
    department: '',
    dueDate: '',
    required: false,
    autoRemind: true,
    comment: 'Send completion notice to HR',
    status: 'pending',
  },
];

// ─── Step Palette Component ──────────────────────────────────────────────────

function StepPalette({
  onAddStep,
}: {
  onAddStep: (type: StepType) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-1">
        Step Types
      </h3>
      <div className="space-y-1.5">
        {STEP_PALETTE.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.type}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg border cursor-grab active:cursor-grabbing transition-colors',
                item.bgColor,
                item.borderColor,
                'hover:shadow-sm'
              )}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('stepType', item.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onAddStep(item.type)}
            >
              <div className={cn('p-1.5 rounded-md', item.bgColor)}>
                <Icon className={cn('h-4 w-4', item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
              <Move className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Connection Line Component ───────────────────────────────────────────────

function ConnectionLine({ animated = false }: { animated?: boolean }) {
  return (
    <div className="flex flex-col items-center py-0">
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          'w-0.5 h-6 origin-top',
          animated ? 'gradient-flow-line' : 'bg-emerald-300 dark:bg-emerald-700'
        )}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.2 }}
      >
        <ArrowDown className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 -mt-1" />
      </motion.div>
    </div>
  );
}

// ─── Add Step Button ─────────────────────────────────────────────────────────

function AddStepButton({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      className="flex justify-center py-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAdd}
              className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border-2 border-dashed border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent>Add step here</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

// ─── Workflow Step Card ──────────────────────────────────────────────────────

function WorkflowStepCard({
  step,
  index,
  isSelected,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  step: WorkflowStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const config = getStepConfig(step.type);
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onSelect}
      className={cn(
        'relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 group',
        isSelected
          ? 'border-emerald-400 dark:border-emerald-500 shadow-lg shadow-emerald-100 dark:shadow-emerald-950/30 ring-2 ring-emerald-200 dark:ring-emerald-800 animate-step-pulse'
          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md',
        step.status === 'complete' && 'opacity-70'
      )}
    >
      {/* Step number badge */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2">
        <div className="h-6 w-6 rounded-full bg-background border-2 border-emerald-400 dark:border-emerald-600 flex items-center justify-center">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {index + 1}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Drag handle & move buttons */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            className={cn(
              'p-0.5 rounded hover:bg-accent transition-colors',
              isFirst && 'opacity-20 cursor-not-allowed'
            )}
          >
            <ChevronRight className="h-3 w-3 -rotate-90" />
          </motion.button>
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            className={cn(
              'p-0.5 rounded hover:bg-accent transition-colors',
              isLast && 'opacity-20 cursor-not-allowed'
            )}
          >
            <ChevronRight className="h-3 w-3 rotate-90" />
          </motion.button>
        </div>

        {/* Icon with gradient background */}
        <div
          className={cn(
            'p-2 rounded-lg shrink-0 text-white',
            STEP_GRADIENTS[step.type]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{step.name}</p>
            <Badge
              variant="secondary"
              className={cn(
                'text-[9px] px-1.5 py-0 h-4 shrink-0',
                config.bgColor,
                config.color,
                'border-0'
              )}
            >
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {step.assigneeId && (
              <div className="h-4 w-4 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold text-emerald-700 dark:text-emerald-300">
                  {step.assigneeId}
                </span>
              </div>
            )}
            <span className="text-[11px] text-muted-foreground truncate">
              {step.assigneeId
                ? `Assignee #${step.assigneeId}`
                : 'No assignee'}
            </span>
          </div>
        </div>

        {/* Status & Delete */}
        <div className="flex items-center gap-1.5 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  {step.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/30" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {step.status === 'complete' ? 'Complete' : 'Pending'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Start/End Nodes ─────────────────────────────────────────────────────────

function StartNode() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col items-center"
    >
      <div className="h-10 w-10 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
        <Play className="h-4 w-4 text-white" />
      </div>
      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
        START
      </span>
    </motion.div>
  );
}

function EndNode() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col items-center"
    >
      <div className="h-10 w-10 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-red-900/40">
        <Circle className="h-4 w-4 text-white" />
      </div>
      <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 mt-1">
        END
      </span>
    </motion.div>
  );
}

// ─── Properties Panel ────────────────────────────────────────────────────────

function PropertiesPanel({
  selectedStep,
  onUpdateStep,
  onDeleteStep,
  workflowName,
  workflowType,
  workflowDescription,
  totalSteps,
  onWorkflowNameChange,
  onWorkflowTypeChange,
  onWorkflowDescriptionChange,
  users,
  departments,
}: {
  selectedStep: WorkflowStep | null;
  onUpdateStep: (id: string, updates: Partial<WorkflowStep>) => void;
  onDeleteStep: (id: string) => void;
  workflowName: string;
  workflowType: string;
  workflowDescription: string;
  totalSteps: number;
  onWorkflowNameChange: (name: string) => void;
  onWorkflowTypeChange: (type: string) => void;
  onWorkflowDescriptionChange: (desc: string) => void;
  users: User[];
  departments: Department[];
}) {
  if (selectedStep) {
    const config = getStepConfig(selectedStep.type);
    const Icon = config.icon;

    return (
      <div className="space-y-4">
        {/* Step type badge */}
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-md', config.bgColor)}>
            <Icon className={cn('h-4 w-4', config.color)} />
          </div>
          <Badge
            className={cn(
              'text-xs px-2.5 py-1 border-0',
              config.bgColor,
              config.color
            )}
          >
            {config.label}
          </Badge>
        </div>

        <Separator />

        {/* Step name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Step Name</Label>
          <Input
            value={selectedStep.name}
            onChange={(e) =>
              onUpdateStep(selectedStep.id, { name: e.target.value })
            }
            placeholder="Enter step name"
            className="h-8 text-sm"
          />
        </div>

        {/* Assignee */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Assignee</Label>
          <Select
            value={selectedStep.assigneeId}
            onValueChange={(val) =>
              onUpdateStep(selectedStep.id, { assigneeId: val })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-emerald-700 dark:text-emerald-300">
                        {u.name.charAt(0)}
                      </span>
                    </div>
                    <span>{u.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({u.jobTitle || u.role})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            Department <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Select
            value={selectedStep.department}
            onValueChange={(val) =>
              onUpdateStep(selectedStep.id, { department: val })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Due date */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Due Date</Label>
          <Input
            type="date"
            value={selectedStep.dueDate}
            onChange={(e) =>
              onUpdateStep(selectedStep.id, { dueDate: e.target.value })
            }
            className="h-8 text-sm"
          />
        </div>

        {/* Required */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Required</Label>
          <Checkbox
            checked={selectedStep.required}
            onCheckedChange={(checked) =>
              onUpdateStep(selectedStep.id, { required: !!checked })
            }
          />
        </div>

        {/* Auto-remind */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Auto-remind</Label>
          <Switch
            checked={selectedStep.autoRemind}
            onCheckedChange={(val) =>
              onUpdateStep(selectedStep.id, { autoRemind: val })
            }
          />
        </div>

        <Separator />

        {/* Comment */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Comment / Notes</Label>
          <Textarea
            value={selectedStep.comment}
            onChange={(e) =>
              onUpdateStep(selectedStep.id, { comment: e.target.value })
            }
            placeholder="Add notes or instructions..."
            className="min-h-[80px] text-sm resize-none"
          />
        </div>

        <Separator />

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onDeleteStep(selectedStep.id)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete Step
        </Button>
      </div>
    );
  }

  // No step selected - show workflow properties
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40">
          <GitBranch className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold">Workflow Properties</h3>
      </div>

      <Separator />

      {/* Workflow name */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Workflow Name</Label>
        <Input
          value={workflowName}
          onChange={(e) => onWorkflowNameChange(e.target.value)}
          placeholder="Enter workflow name"
          className="h-8 text-sm"
        />
      </div>

      {/* Workflow type */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Workflow Type</Label>
        <RadioGroup
          value={workflowType}
          onValueChange={onWorkflowTypeChange}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sequential" id="sequential" />
            <Label htmlFor="sequential" className="text-xs font-normal cursor-pointer">
              Sequential
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="parallel" id="parallel" />
            <Label htmlFor="parallel" className="text-xs font-normal cursor-pointer">
              Parallel
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="conditional" id="conditional" />
            <Label htmlFor="conditional" className="text-xs font-normal cursor-pointer">
              Conditional
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Description</Label>
        <Textarea
          value={workflowDescription}
          onChange={(e) => onWorkflowDescriptionChange(e.target.value)}
          placeholder="Describe this workflow..."
          className="min-h-[80px] text-sm resize-none"
        />
      </div>

      <Separator />

      {/* Summary */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
          Summary
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground">Total Steps</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {totalSteps}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground">Est. Duration</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {totalSteps > 0 ? `${totalSteps * 2}d` : '—'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function WorkflowBuilderPage() {
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Document Approval Workflow');
  const [workflowType, setWorkflowType] = useState('sequential');
  const [workflowDescription, setWorkflowDescription] = useState(
    'Standard document approval and signing workflow'
  );
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [addMenuIndex, setAddMenuIndex] = useState<number | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);

  // Fetch users and departments
  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          api.getUsers({ pageSize: 50 }),
          api.getDepartments(),
        ]);
        if (usersRes.success && usersRes.data) {
          setUsers(usersRes.data.items);
        }
        if (deptsRes.success && deptsRes.data) {
          setDepartments(deptsRes.data);
        }
      } catch {
        // Use mock data as fallback
      }
    }
    fetchData();
  }, []);

  const selectedStep = steps.find((s) => s.id === selectedStepId) || null;

  const addStep = useCallback(
    (type: StepType, atIndex?: number) => {
      const config = getStepConfig(type);
      const newStep: WorkflowStep = {
        id: generateId(),
        type,
        name: config.label,
        assigneeId: '',
        department: '',
        dueDate: '',
        required: type !== 'notification',
        autoRemind: type === 'approval' || type === 'signature',
        comment: '',
        status: 'pending',
      };

      setSteps((prev) => {
        if (atIndex !== undefined) {
          const next = [...prev];
          next.splice(atIndex, 0, newStep);
          return next;
        }
        return [...prev, newStep];
      });
      setSelectedStepId(newStep.id);
      setAddMenuIndex(null);
    },
    []
  );

  const deleteStep = useCallback(
    (id: string) => {
      setSteps((prev) => prev.filter((s) => s.id !== id));
      if (selectedStepId === id) {
        setSelectedStepId(null);
      }
    },
    [selectedStepId]
  );

  const updateStep = useCallback((id: string, updates: Partial<WorkflowStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const moveStep = useCallback((index: number, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const next = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    // Use a simple toast-like notification
    showToast('Workflow saved successfully', 'success');
  }, []);

  const handleTestRun = useCallback(async () => {
    setTestRunning(true);
    showToast('Test run initiated...', 'info');
    await new Promise((r) => setTimeout(r, 2000));
    setTestRunning(false);
    showToast('Test run completed successfully', 'success');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, atIndex: number) => {
      e.preventDefault();
      const stepType = e.dataTransfer.getData('stepType') as StepType;
      if (stepType) {
        addStep(stepType, atIndex);
      }
    },
    [addStep]
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
            <GitBranch className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Workflow Builder</h1>
            <p className="text-xs text-muted-foreground">
              Design document approval &amp; signing workflows
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestRun}
            disabled={testRunning}
          >
            {testRunning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mr-1.5"
              >
                <Play className="h-3.5 w-3.5" />
              </motion.div>
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5" />
            )}
            Test Run
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="mr-1.5"
              >
                <Save className="h-3.5 w-3.5" />
              </motion.div>
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save Workflow
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Step Palette */}
        <div className="w-64 border-r border-border bg-muted/30 shrink-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              <StepPalette onAddStep={(type) => addStep(type)} />

              <Separator className="my-4" />

              {/* Tips */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-1">
                  Tips
                </h3>
                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                  <p className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Click a step type or drag it to the canvas to add
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Click the + button between steps to insert
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Use arrows on step cards to reorder
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Click a step card to view its properties
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Workflow Canvas */}
        <div className="flex-1 overflow-auto" id="workflow-canvas">
          <div
            className="min-h-full p-6 flex flex-col items-center"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const stepType = e.dataTransfer.getData('stepType') as StepType;
              if (stepType) {
                addStep(stepType);
              }
            }}
          >
            <div className="w-full max-w-md flex flex-col items-center">
              {/* Start node */}
              <StartNode />
              <ConnectionLine />

              {/* Steps */}
              <AnimatePresence mode="popLayout">
                {steps.map((step, index) => (
                  <div key={step.id} className="w-full flex flex-col items-center">
                    {/* Add step button before this step */}
                    <AddStepButton
                      onAdd={() => {
                        setAddMenuIndex(index);
                        addStep(
                          'approval',
                          index
                        );
                      }}
                    />
                    <ConnectionLine animated />

                    {/* The step card */}
                    <div
                      className="w-full"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <WorkflowStepCard
                        step={step}
                        index={index}
                        isSelected={selectedStepId === step.id}
                        onSelect={() => setSelectedStepId(step.id)}
                        onDelete={() => deleteStep(step.id)}
                        onMoveUp={() => moveStep(index, 'up')}
                        onMoveDown={() => moveStep(index, 'down')}
                        isFirst={index === 0}
                        isLast={index === steps.length - 1}
                      />
                    </div>

                    <ConnectionLine animated />
                  </div>
                ))}
              </AnimatePresence>

              {/* Add step at end */}
              {steps.length === 0 ? (
                <div className="w-full flex flex-col items-center py-6">
                  <div
                    className="w-full border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const stepType = e.dataTransfer.getData('stepType') as StepType;
                      if (stepType) {
                        addStep(stepType);
                      }
                    }}
                    onClick={() => addStep('approval')}
                  >
                    <Plus className="h-8 w-8 text-emerald-400 dark:text-emerald-600 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Add your first step
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Drag a step type from the palette or click here
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <AddStepButton onAdd={() => addStep('approval')} />
                  <ConnectionLine animated />
                </>
              )}

              {/* End node */}
              <EndNode />
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-72 border-l border-border bg-muted/30 shrink-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              <PropertiesPanel
                selectedStep={selectedStep}
                onUpdateStep={updateStep}
                onDeleteStep={deleteStep}
                workflowName={workflowName}
                workflowType={workflowType}
                workflowDescription={workflowDescription}
                totalSteps={steps.length}
                onWorkflowNameChange={setWorkflowName}
                onWorkflowTypeChange={setWorkflowType}
                onWorkflowDescriptionChange={setWorkflowDescription}
                users={users}
                departments={departments}
              />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Mini-map / Overview */}
      {showMinimap && steps.length > 0 && (
        <div className="absolute bottom-4 right-80 z-10 minimap-container p-2" style={{ width: 120 }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-wider">Overview</span>
            <button
              onClick={() => setShowMinimap(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-[10px]">×</span>
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="w-0.5 h-1 bg-emerald-300 dark:bg-emerald-700 mx-auto" />
            {steps.map((step, i) => {
              const config = getStepConfig(step.type);
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={cn(
                      'h-3 w-16 rounded-sm border',
                      selectedStepId === step.id ? 'border-emerald-400 bg-emerald-100 dark:bg-emerald-900/50' : 'border-border bg-muted/50',
                      step.status === 'complete' && 'opacity-50'
                    )}
                  />
                  {i < steps.length - 1 && <div className="w-0.5 h-1 bg-emerald-300 dark:bg-emerald-700" />}
                </div>
              );
            })}
            <div className="w-0.5 h-1 bg-emerald-300 dark:bg-emerald-700 mx-auto" />
            <div className="flex justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Toast container */}
      <ToastContainer />
    </div>
  );
}

// ─── Simple Toast System ─────────────────────────────────────────────────────

let toastTimeout: ReturnType<typeof setTimeout>;
let setToastState: ((toast: ToastMessage | null) => void) | null = null;

interface ToastMessage {
  message: string;
  type: 'success' | 'info' | 'error';
}

function showToast(message: string, type: 'success' | 'info' | 'error' = 'success') {
  if (setToastState) {
    setToastState({ message, type });
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      setToastState?.(null);
    }, 3000);
  }
}

function ToastContainer() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    setToastState = setToast;
    return () => {
      setToastState = null;
    };
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-6 left-1/2 z-50"
        >
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border',
              toast.type === 'success' &&
                'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
              toast.type === 'info' &&
                'bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200',
              toast.type === 'error' &&
                'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            )}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            {toast.type === 'info' && <Play className="h-4 w-4 shrink-0" />}
            {toast.type === 'error' && <Trash2 className="h-4 w-4 shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
