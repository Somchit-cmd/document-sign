// ============================================================
// Enterprise Document Signing Platform - Type Definitions
// ============================================================

// --- User & Auth ---
export type UserRole = 'admin' | 'manager' | 'signer' | 'viewer';
export type AuthProvider = 'email' | 'google' | 'microsoft' | 'ldap';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Department ---
export interface Department {
  id: string;
  name: string;
  description?: string;
  head?: string;
  memberCount: number;
  createdAt: string;
}

// --- Document ---
export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'completed' | 'rejected' | 'expired' | 'voided';
export type DocumentPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  pageCount: number;
  status: DocumentStatus;
  priority: DocumentPriority;
  owner: User;
  sender?: User;
  recipients: DocumentRecipient[];
  signatures: Signature[];
  fields: DocumentField[];
  tags: string[];
  folder?: string;
  expiresAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecipient {
  id: string;
  user: User;
  role: 'signer' | 'cc' | 'viewer';
  status: 'pending' | 'viewed' | 'signed' | 'declined';
  signedAt?: string;
  order: number;
}

// --- Signature ---
export type SignatureType = 'drawn' | 'typed' | 'uploaded';

export interface Signature {
  id: string;
  documentId: string;
  signerId: string;
  signer?: User;
  type: SignatureType;
  value: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  signedAt?: string;
  isVerified: boolean;
}

// --- Document Field ---
export type FieldType = 'signature' | 'initial' | 'date' | 'text' | 'checkbox' | 'dropdown' | 'radio';

export interface DocumentField {
  id: string;
  documentId: string;
  type: FieldType;
  label: string;
  required: boolean;
  assignedTo?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  options?: string[];
  isCompleted: boolean;
}

// --- Workflow ---
export type WorkflowType = 'sequential' | 'parallel' | 'conditional';
export type WorkflowStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  type: WorkflowType;
  status: WorkflowStatus;
  steps: ApprovalStep[];
  documentId?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStep {
  id: string;
  workflowId: string;
  order: number;
  type: 'approve' | 'sign' | 'review' | 'notify';
  assignee?: User;
  department?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comment?: string;
  completedAt?: string;
  dueDate?: string;
}

// --- Template ---
export type TemplateCategory = 'contract' | 'agreement' | 'nda' | 'proposal' | 'invoice' | 'hr' | 'legal' | 'other';

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  thumbnail?: string;
  fileUrl: string;
  fields: DocumentField[];
  usageCount: number;
  isPublic: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

// --- Audit Log ---
export type AuditAction =
  | 'document.created'
  | 'document.viewed'
  | 'document.sent'
  | 'document.signed'
  | 'document.completed'
  | 'document.rejected'
  | 'document.voided'
  | 'document.expired'
  | 'document.downloaded'
  | 'document.shared'
  | 'signature.added'
  | 'signature.verified'
  | 'workflow.started'
  | 'workflow.approved'
  | 'workflow.rejected'
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deactivated'
  | 'template.created'
  | 'template.used'
  | 'system.settings_changed';

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  user?: User;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// --- Notification ---
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'document' | 'signature' | 'workflow' | 'system' | 'mention';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  sender?: User;
  createdAt: string;
}

// --- Comment ---
export interface Comment {
  id: string;
  documentId: string;
  author: User;
  content: string;
  parentId?: string;
  mentions?: User[];
  createdAt: string;
  updatedAt: string;
}

// --- API Types ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// --- Filter & Sort ---
export interface DocumentFilters {
  status?: DocumentStatus[];
  priority?: DocumentPriority[];
  owner?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  tags?: string[];
  folder?: string;
}

export interface DocumentSort {
  field: 'title' | 'status' | 'priority' | 'createdAt' | 'updatedAt' | 'expiresAt';
  direction: 'asc' | 'desc';
}

export interface AuditLogFilters {
  action?: AuditAction[];
  userId?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface UserFilters {
  role?: UserRole[];
  department?: string;
  isActive?: boolean;
  search?: string;
}

// --- Dashboard ---
export interface DashboardStats {
  totalDocuments: number;
  pendingSignatures: number;
  pendingApprovals: number;
  completedThisMonth: number;
  documentsTrend: number;
  signaturesTrend: number;
  approvalsTrend: number;
  completedTrend: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  user: User;
  timestamp: string;
  documentId?: string;
  documentTitle?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// --- System Health ---
export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
  lastChecked: string;
}

export interface SystemHealthService {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastIncident?: string;
}
