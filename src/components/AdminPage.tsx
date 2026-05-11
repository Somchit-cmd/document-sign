'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api, mockUsers, mockDepartments } from '@/lib/api';
import type { User, UserRole, Department } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Building2,
  GitBranch,
  Activity,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  FileText,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FolderTree,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Eye,
  ChevronRight,
  ChevronDown,
  Workflow,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { RoleBadge } from './RoleBadge';
import { StatusBadge } from './StatusBadge';
import { toast } from 'sonner';

// ========= Dashboard Overview =========
function DashboardOverview() {
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.getDashboardStats();
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: 60 * 1000,
  });

  const stats = [
    { title: 'Total Users', value: statsData?.totalDocuments ?? 11, icon: Users, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', trend: '+3', trendUp: true },
    { title: 'Active Documents', value: statsData?.pendingSignatures ?? 8, icon: FileText, color: 'bg-cyan-100 dark:bg-cyan-900/30', iconColor: 'text-cyan-600 dark:text-cyan-400', trend: '+12%', trendUp: true },
    { title: 'Pending Approvals', value: statsData?.pendingApprovals ?? 4, icon: ShieldCheck, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', trend: '-2', trendUp: false },
    { title: 'Completed Today', value: statsData?.completedThisMonth ?? 3, icon: CheckCircle2, color: 'bg-teal-100 dark:bg-teal-900/30', iconColor: 'text-teal-600 dark:text-teal-400', trend: '+5', trendUp: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg ${stat.color} p-2`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs ${stat.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.trend}
                  </div>
                </div>
                <p className="text-2xl font-bold mt-3">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// ========= User Management =========
function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: async () => {
      const res = await api.getUsers({
        role: roleFilter !== 'all' ? [roleFilter as UserRole] : undefined,
        search: search || undefined,
        pageSize: 50,
      });
      if (res.success && res.data && res.data.items.length > 0) return res.data.items;
      return mockUsers;
    },
    staleTime: 30 * 1000,
  });

  const users: User[] = usersData || mockUsers;

  const { data: departmentsData } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: async () => {
      const res = await api.getDepartments();
      if (res.success && res.data && res.data.length > 0) return res.data;
      return mockDepartments;
    },
    staleTime: 60 * 1000,
  });

  const departments: Department[] = departmentsData || mockDepartments;

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => api.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deactivated');
    },
    onError: () => {
      toast.error('Failed to deactivate user');
    },
  });

  const filteredUsers = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchDept = deptFilter === 'all' || u.department === deptFilter;
    return matchSearch && matchRole && matchDept;
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="signer">Signer</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (<SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />Add User
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><RoleBadge role={user.role} /></TableCell>
                  <TableCell><span className="text-sm">{user.department || '—'}</span></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={user.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={(checked) => {
                          if (!checked) deleteMutation.mutate(user.id);
                        }}
                        className="scale-75"
                      />
                    </div>
                  </TableCell>
                  <TableCell><span className="text-xs text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteMutation.mutate(user.id)}><Trash2 className="mr-2 h-4 w-4" />Deactivate</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="Full name" /></div>
              <div className="space-y-2"><Label>Email</Label><Input placeholder="email@company.com" type="email" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="signer">Signer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => { toast.success('User created'); setAddDialogOpen(false); }}>Add User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editingUser && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {editingUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingUser.name}</p>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select defaultValue={editingUser.role}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="signer">Signer</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select defaultValue={editingUser.department}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (<SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => { toast.success('User updated'); setEditDialogOpen(false); }}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========= Department Tree =========
function DepartmentManagement() {
  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: async () => {
      const res = await api.getDepartments();
      if (res.success && res.data && res.data.length > 0) return res.data;
      return mockDepartments;
    },
    staleTime: 60 * 1000,
  });

  const departments: Department[] = departmentsData || mockDepartments;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(departments.map(d => d.id)));

  const toggleExpand = (id: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-3 w-48 mb-4" /><Skeleton className="h-3 w-20" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Department
        </Button>
      </div>

      {/* Department tree view */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <FolderTree className="h-4 w-4" />
          Organization Structure
        </div>
        {departments.map((dept) => (
          <motion.div key={dept.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleExpand(dept.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {expandedDepts.has(dept.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{dept.name}</h3>
                      <p className="text-xs text-muted-foreground">{dept.head || 'No head assigned'}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {expandedDepts.has(dept.id) && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden">
                    <div className="ml-11 mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">{dept.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{dept.memberCount} members</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Created {new Date(dept.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {/* Member avatars preview */}
                      <div className="flex -space-x-2 mt-2">
                        {Array.from({ length: Math.min(dept.memberCount, 5) }).map((_, i) => (
                          <Avatar key={i} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                              {String.fromCharCode(65 + i)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {dept.memberCount > 5 && (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium border-2 border-background">
                            +{dept.memberCount - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create Department Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Department</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Department Name</Label><Input placeholder="e.g. Marketing" /></div>
            <div className="space-y-2"><Label>Description</Label><Input placeholder="Department description" /></div>
            <div className="space-y-2">
              <Label>Department Head</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">Sarah Chen</SelectItem>
                  <SelectItem value="user2">John Martinez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => { toast.success('Department created'); setCreateDialogOpen(false); }}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========= Workflow Template Builder =========
function WorkflowManagement() {
  const { data: workflowTemplatesData, isLoading } = useQuery({
    queryKey: ['admin-workflow-templates'],
    queryFn: async () => {
      const res = await api.getWorkflowTemplates();
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: 60 * 1000,
  });

  const workflowTemplates: Record<string, unknown>[] = (workflowTemplatesData as Record<string, unknown>[]) || [];

  const sampleWorkflows = [
    { id: 'wf1', name: 'Contract Approval', type: 'sequential', steps: [
      { name: 'Legal Review', type: 'review', assignee: 'Legal Dept' },
      { name: 'Manager Approval', type: 'approve', assignee: 'John Martinez' },
      { name: 'CFO Sign-off', type: 'sign', assignee: 'David Kim' },
    ], status: 'active', usageCount: 45 },
    { id: 'wf2', name: 'NDA Signing', type: 'parallel', steps: [
      { name: 'Both Parties Sign', type: 'sign', assignee: 'Both Parties' },
      { name: 'Legal Filing', type: 'notify', assignee: 'Legal Dept' },
    ], status: 'active', usageCount: 89 },
    { id: 'wf3', name: 'HR Document Review', type: 'sequential', steps: [
      { name: 'HR Review', type: 'review', assignee: 'Lisa Park' },
      { name: 'Manager Approval', type: 'approve', assignee: 'Dept Manager' },
      { name: 'Employee Sign', type: 'sign', assignee: 'Employee' },
      { name: 'HR Filing', type: 'notify', assignee: 'HR Dept' },
    ], status: 'active', usageCount: 34 },
    { id: 'wf4', name: 'Finance Approval', type: 'conditional', steps: [
      { name: 'Amount Check', type: 'review', assignee: 'Finance' },
      { name: 'Director Approval', type: 'approve', assignee: 'CFO' },
      { name: 'Final Sign', type: 'sign', assignee: 'CEO' },
    ], status: 'paused', usageCount: 12 },
  ];

  const workflows = workflowTemplates.length > 0
    ? workflowTemplates.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        type: (t.type || 'sequential') as string,
        steps: [] as { name: string; type: string; assignee: string }[],
        status: t.isActive ? 'active' : 'paused',
        usageCount: 0,
      }))
    : sampleWorkflows;

  const stepTypeIcons: Record<string, React.ReactNode> = {
    review: <Eye className="h-3.5 w-3.5 text-cyan-500" />,
    approve: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    sign: <FileText className="h-3.5 w-3.5 text-primary" />,
    notify: <Activity className="h-3.5 w-3.5 text-amber-500" />,
  };

  const stepTypeBadge: Record<string, string> = {
    review: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    sign: 'bg-primary/10 text-primary',
    notify: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Workflow className="mr-2 h-4 w-4" />Create Workflow
        </Button>
      </div>

      <div className="space-y-4">
        {workflows.map((wf) => (
          <motion.div key={wf.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <GitBranch className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{wf.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="capitalize text-[10px]">{wf.type}</Badge>
                        <StatusBadge status={wf.status} />
                        {wf.usageCount > 0 && (
                          <span className="text-xs text-muted-foreground">{wf.usageCount} uses</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>

                {/* Visual workflow steps */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {wf.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1 shrink-0">
                      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border bg-muted/30">
                        {stepTypeIcons[step.type]}
                        <div>
                          <p className="text-[11px] font-medium">{step.name}</p>
                          <p className="text-[9px] text-muted-foreground">{step.assignee}</p>
                        </div>
                        <Badge className={`text-[8px] px-1 py-0 border-0 ${stepTypeBadge[step.type]}`}>
                          {step.type}
                        </Badge>
                      </div>
                      {i < wf.steps.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ========= System Health Dashboard =========
function SystemHealth() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await api.getSystemHealth();
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: 30 * 1000,
  });

  const services = [
    { name: 'API Server', status: 'operational', latency: 45, uptime: 99.98 },
    { name: 'Database', status: healthData?.status === 'healthy' ? 'operational' : 'degraded', latency: healthData ? 12 : 45, uptime: 99.99 },
    { name: 'Storage Service', status: 'operational', latency: 85, uptime: 99.95 },
    { name: 'Email Service', status: 'degraded', latency: 250, uptime: 98.5 },
    { name: 'WebSocket Server', status: 'operational', latency: 8, uptime: 99.97 },
    { name: 'Authentication', status: 'operational', latency: 35, uptime: 99.99 },
  ];

  const uptime = healthData?.uptime || 0;
  const uptimeFormatted = uptime > 86400 ? `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h` : `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
  const cpuUsage = healthData?.cpuUsage || 34;
  const memoryUsage = healthData?.memoryUsage || 45;
  const diskUsage = healthData?.diskUsage || 67;
  const connections = healthData?.activeConnections || 0;

  // Mock time-series data for charts
  const cpuHistory = [
    { time: '00:00', value: 28 }, { time: '04:00', value: 22 }, { time: '08:00', value: 45 },
    { time: '12:00', value: 52 }, { time: '16:00', value: 38 }, { time: '20:00', value: 30 },
    { time: 'Now', value: cpuUsage },
  ];

  const memoryHistory = [
    { time: '00:00', value: 35 }, { time: '04:00', value: 33 }, { time: '08:00', value: 48 },
    { time: '12:00', value: 55 }, { time: '16:00', value: 50 }, { time: '20:00', value: 42 },
    { time: 'Now', value: memoryUsage },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-lg" /><div><Skeleton className="h-3 w-16 mb-1" /><Skeleton className="h-6 w-12" /></div></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2"><Server className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div><p className="text-xs text-muted-foreground">Uptime</p><p className="text-lg font-bold">{uptimeFormatted || '99.96%'}</p></div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-teal-100 dark:bg-teal-900/30 p-2"><Cpu className="h-5 w-5 text-teal-600 dark:text-teal-400" /></div>
            <div>
              <p className="text-xs text-muted-foreground">CPU Usage</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{cpuUsage}%</p>
                <Progress value={cpuUsage} className="h-1.5 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2"><HardDrive className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Memory / Disk</p>
              <p className="text-lg font-bold">{memoryUsage}% / {diskUsage}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-cyan-100 dark:bg-cyan-900/30 p-2"><Wifi className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /></div>
            <div><p className="text-xs text-muted-foreground">Active Sessions</p><p className="text-lg font-bold">{connections}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-teal-500" />CPU Usage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cpuHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.1} name="CPU %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4 text-amber-500" />Memory Usage</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={memoryHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Memory %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Services table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Service Status</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Uptime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((svc) => (
                <TableRow key={svc.name}>
                  <TableCell><span className="text-sm font-medium">{svc.name}</span></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${svc.status === 'operational' ? 'bg-emerald-500' : svc.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <StatusBadge status={svc.status} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${svc.latency > 200 ? 'text-amber-600 dark:text-amber-400' : ''}`}>{svc.latency}ms</span>
                  </TableCell>
                  <TableCell><span className="text-sm">{svc.uptime}%</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ========= Main Admin Page =========
export function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage users, departments, workflows, and system settings
        </p>
      </div>

      {/* Dashboard overview at top */}
      <DashboardOverview />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users</TabsTrigger>
          <TabsTrigger value="departments"><Building2 className="mr-2 h-4 w-4" />Departments</TabsTrigger>
          <TabsTrigger value="workflows"><GitBranch className="mr-2 h-4 w-4" />Workflows</TabsTrigger>
          <TabsTrigger value="system"><Activity className="mr-2 h-4 w-4" />System</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4"><UserManagement /></TabsContent>
        <TabsContent value="departments" className="mt-4"><DepartmentManagement /></TabsContent>
        <TabsContent value="workflows" className="mt-4"><WorkflowManagement /></TabsContent>
        <TabsContent value="system" className="mt-4"><SystemHealth /></TabsContent>
      </Tabs>
    </div>
  );
}
