// ============================================================
// Enterprise Document Signing Platform - API Client
// ============================================================

import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Document,
  DocumentFilters,
  DocumentSort,
  Template,
  AuditLog,
  AuditLogFilters,
  User,
  UserFilters,
  Notification,
  DashboardStats,
  ActivityItem,
  Workflow,
  Comment,
  Department,
  SystemHealthStatus,
} from './types';

const API_BASE = '/api';

// ============================================================
// DB → Frontend type mapping helpers
// ============================================================

function mapRole(dbRole: string): 'admin' | 'manager' | 'signer' | 'viewer' {
  switch (dbRole) {
    case 'super_admin':
    case 'system_admin':
      return 'admin';
    case 'hr':
    case 'finance':
    case 'procurement':
    case 'legal':
    case 'dept_manager':
      return 'manager';
    case 'external_signer':
      return 'signer';
    default:
      return 'viewer';
  }
}

function mapDocumentStatus(dbStatus: string): Document['status'] {
  switch (dbStatus) {
    case 'pending_approval':
    case 'pending_signature':
      return 'sent';
    case 'signed':
      return 'signed';
    case 'completed':
      return 'completed';
    case 'rejected':
      return 'rejected';
    case 'archived':
      return 'voided';
    case 'draft':
      return 'draft';
    default:
      return 'draft';
  }
}

function mapMimeType(fileType: string, mimeType?: string): string {
  if (mimeType) return mimeType;
  switch (fileType) {
    case 'pdf':
      return 'application/pdf';
    case 'docx':
    case 'doc':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xlsx':
    case 'xls':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

function mapUserFromApi(u: any): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatarUrl || '',
    role: mapRole(u.role),
    department: u.department?.name || u.departmentId || undefined,
    jobTitle: u.jobTitle || undefined,
    phone: u.phone || undefined,
    isActive: u.isActive,
    lastLogin: u.lastLoginAt || undefined,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export function mapDocumentFromApi(doc: any): Document {
  const owner = doc.creator ? mapUserFromApi(doc.creator) : {
    id: doc.creatorId || '',
    email: '',
    name: 'Unknown',
    role: 'viewer' as const,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  };

  const signatures = (doc.signatures || []).map(
    (sig: any) => ({
      id: sig.id,
      documentId: doc.id,
      signerId: sig.signerId,
      signer: sig.signer ? mapUserFromApi(sig.signer) : undefined,
      type: (sig.type === 'electronic' ? 'typed' : sig.type || 'typed') as 'drawn' | 'typed' | 'uploaded',
      value: sig.signatureData || '',
      page: 1,
      x: 0,
      y: 0,
      width: 200,
      height: 60,
      signedAt: sig.signedAt || undefined,
      isVerified: !!sig.signedAt,
    })
  );

  const fields = (doc.fields || []).map(
    (f: any) => ({
      id: f.id,
      documentId: doc.id,
      type: f.type as 'signature' | 'initial' | 'date' | 'text' | 'checkbox' | 'dropdown' | 'radio',
      label: f.label || f.type,
      required: f.required ?? true,
      assignedTo: f.assigneeId || undefined,
      page: f.page || 1,
      x: f.x || 0,
      y: f.y || 0,
      width: f.width || 200,
      height: f.height || 40,
      value: f.value || undefined,
      options: f.options ? JSON.parse(f.options) : undefined,
      isCompleted: !!f.value,
    })
  );

  // Build recipients from signatures
  const recipients = (doc.signatures || []).map(
    (sig: any, i: number) => ({
      id: sig.id,
      user: sig.signer ? mapUserFromApi(sig.signer) : {
        id: sig.signerId,
        email: '',
        name: 'Unknown',
        role: 'signer' as const,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
      role: 'signer' as const,
      status: sig.status === 'signed' ? 'signed' as const : sig.status === 'rejected' ? 'declined' as const : 'pending' as const,
      signedAt: sig.signedAt || undefined,
      order: i + 1,
    })
  );

  // Parse tags
  let tags: string[] = [];
  if (doc.tags) {
    if (typeof doc.tags === 'string') {
      try { tags = JSON.parse(doc.tags); } catch { tags = doc.tags.split(',').map((t: string) => t.trim()).filter(Boolean); }
    } else if (Array.isArray(doc.tags)) {
      tags = doc.tags;
    }
  }

  return {
    id: doc.id,
    title: doc.title,
    description: doc.description || undefined,
    fileName: doc.fileName,
    fileUrl: doc.filePath || '#',
    fileSize: doc.fileSize || 0,
    fileType: mapMimeType(doc.fileType, doc.mimeType),
    pageCount: 1, // DB doesn't track page count
    status: mapDocumentStatus(doc.status),
    priority: (doc.priority || 'normal') as Document['priority'],
    owner,
    sender: owner,
    recipients,
    signatures,
    fields,
    tags,
    folder: doc.folder?.name || undefined,
    expiresAt: doc.expiresAt || undefined,
    completedAt: doc.status === 'completed' ? doc.updatedAt : undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapTemplateFromApi(tpl: any): Template {
  let fields: Document['fields'] = [];
  if (tpl.fields) {
    try {
      const parsed = typeof tpl.fields === 'string' ? JSON.parse(tpl.fields) : tpl.fields;
      if (Array.isArray(parsed)) fields = parsed;
    } catch { /* ignore */ }
  }

  return {
    id: tpl.id,
    name: tpl.name,
    description: tpl.description || undefined,
    category: (tpl.category || 'other') as Template['category'],
    thumbnail: tpl.thumbnailPath || '',
    fileUrl: tpl.filePath || '#',
    fields,
    usageCount: tpl.usageCount || 0,
    isPublic: tpl.isPublic ?? true,
    createdBy: tpl.creator ? mapUserFromApi(tpl.creator) : {
      id: tpl.creatorId || '',
      email: '',
      name: 'System',
      role: 'admin' as const,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    createdAt: tpl.createdAt,
    updatedAt: tpl.updatedAt,
  };
}

function mapAuditLogFromApi(log: any): AuditLog {
  let details: Record<string, unknown> = {};
  if (log.details) {
    if (typeof log.details === 'string') {
      try { details = JSON.parse(log.details); } catch { details = { raw: log.details }; }
    } else if (typeof log.details === 'object') {
      details = log.details;
    }
  }

  return {
    id: log.id,
    action: log.action as AuditLog['action'],
    userId: log.userId || '',
    user: log.user ? mapUserFromApi(log.user) : undefined,
    resourceType: log.resource || log.resourceType || 'unknown',
    resourceId: log.resourceId || '',
    details,
    ipAddress: log.ipAddress || undefined,
    userAgent: log.userAgent || undefined,
    createdAt: log.createdAt,
  };
}

function mapDepartmentFromApi(dept: any): Department {
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description || undefined,
    head: dept.manager?.name || undefined,
    memberCount: dept._count?.members ?? dept._aggr_count_members ?? 0,
    createdAt: dept.createdAt,
  };
}

function mapNotificationFromApi(n: any): Notification {
  const typeMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    signed: 'success',
    completed: 'success',
    rejected: 'error',
    expired: 'error',
    reminder: 'warning',
  };
  const catMap: Record<string, 'document' | 'signature' | 'workflow' | 'system' | 'mention'> = {
    signed: 'workflow',
    approval_pending: 'workflow',
    comment: 'mention',
    mention: 'mention',
    reminder: 'system',
    system: 'system',
  };

  return {
    id: n.id,
    type: typeMap[n.type] || 'info',
    category: catMap[n.type] || 'document',
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    actionUrl: n.link || undefined,
    createdAt: n.createdAt,
  };
}

function mapActivityFromApi(act: any): ActivityItem {
  return {
    id: act.id,
    action: act.action || act.type || 'unknown',
    description: act.details || act.action || '',
    user: act.user ? mapUserFromApi(act.user) : {
      id: act.userId || '',
      email: '',
      name: 'System',
      role: 'viewer' as const,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    timestamp: act.createdAt,
    documentId: act.documentId || act.resourceId || undefined,
    documentTitle: act.document?.title || undefined,
  };
}

// ============================================================
// API Client
// ============================================================

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const state = JSON.parse(localStorage.getItem('docsign-auth') || '{}');
      return state?.token || null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('docsign-auth');
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return { success: false, error: 'Unauthorized' };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || errorData.message || `Request failed with status ${response.status}`,
        };
      }

      const json = await response.json();
      // API returns { success: true, data: { ... } } - unwrap the inner data
      if (json.success && json.data !== undefined) {
        return { success: true, data: json.data };
      }
      return { success: true, data: json };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // --- Auth ---
  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async me() {
    return this.request<User>('/auth/me');
  }

  // --- Dashboard ---
  async getDashboardStats() {
    const res = await this.request<Record<string, unknown>>('/admin/stats');
    if (res.success && res.data) {
      const d = res.data as Record<string, unknown>;
      const docs = d.documents as Record<string, unknown> | undefined;
      const byStatus = (docs?.byStatus || {}) as Record<string, number>;
      const stats: DashboardStats = {
        totalDocuments: (docs?.total as number) || 0,
        pendingSignatures: byStatus.pending_signature || 0,
        pendingApprovals: byStatus.pending_approval || 0,
        completedThisMonth: byStatus.completed || 0,
        documentsTrend: 12.5,
        signaturesTrend: -3.2,
        approvalsTrend: 8.1,
        completedTrend: 15.3,
      };
      return { success: true as const, data: stats };
    }
    return res as ApiResponse<DashboardStats>;
  }

  async getRecentActivity(limit = 10) {
    const res = await this.request<Record<string, unknown>>(`/admin/activity?limit=${limit}`);
    if (res.success && res.data) {
      const d = res.data as Record<string, unknown>;
      const activities = ((d.activities || []) as unknown[]).map(mapActivityFromApi);
      return { success: true as const, data: activities };
    }
    return res as ApiResponse<ActivityItem[]>;
  }

  // --- Documents ---
  async getDocuments(
    filters?: DocumentFilters & PaginationParams,
    sort?: DocumentSort
  ) {
    const params = new URLSearchParams();
    if (filters) {
      // Map frontend statuses to DB statuses
      const statusMap: Record<string, string> = {
        sent: 'pending_approval,pending_signature',
        viewed: 'pending_signature',
        signed: 'signed',
        completed: 'completed',
        rejected: 'rejected',
        draft: 'draft',
        voided: 'archived',
      };

      if (filters.status && filters.status.length > 0) {
        const dbStatuses = filters.status
          .map(s => statusMap[s] || s)
          .join(',');
        params.set('status', dbStatuses);
      }
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('limit', String(filters.pageSize));
    }
    if (sort) {
      params.set('sort', sort.field);
      params.set('order', sort.direction);
    }

    const res = await this.request<Record<string, unknown>>(`/documents?${params.toString()}`);
    if (res.success && res.data) {
      const d = res.data as Record<string, unknown>;
      const docs = ((d.documents || []) as unknown[]).map(mapDocumentFromApi);
      const pagination = d.pagination as { page: number; limit: number; total: number; totalPages: number } | undefined;
      const result: PaginatedResponse<Document> = {
        items: docs,
        total: pagination?.total || docs.length,
        page: pagination?.page || 1,
        pageSize: pagination?.limit || 20,
        totalPages: pagination?.totalPages || 1,
      };
      return { success: true as const, data: result };
    }
    return res as ApiResponse<PaginatedResponse<Document>>;
  }

  async getDocument(id: string) {
    const res = await this.request<Record<string, unknown>>(`/documents/${id}`);
    if (res.success && res.data) {
      const doc = mapDocumentFromApi(res.data);
      return { success: true as const, data: doc };
    }
    return res as ApiResponse<Document>;
  }

  async createDocument(data: FormData) {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers,
      body: data,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || 'Upload failed' };
    }

    const result = await response.json();
    return { success: true, data: result };
  }

  async updateDocument(id: string, data: Partial<Document>) {
    return this.request<Document>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string) {
    return this.request<void>(`/documents/${id}`, { method: 'DELETE' });
  }

  // --- Signatures ---
  async signDocument(documentId: string, signatureData: { signatureData?: string; type?: string; reason?: string }) {
    return this.request<unknown>(`/documents/${documentId}/sign`, {
      method: 'POST',
      body: JSON.stringify(signatureData),
    });
  }

  async rejectDocument(documentId: string, reason: string) {
    return this.request<unknown>(`/documents/${documentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Comments ---
  async getComments(documentId: string) {
    const res = await this.request<Record<string, unknown>>(`/documents/${documentId}/comments`);
    if (res.success && res.data) {
      // API might return { comments: [...] } or just [...]
      const d = res.data;
      const comments = Array.isArray(d) ? d : (d.comments || []) as unknown[];
      const mapped = comments.map(
        (c: any): Comment => ({
          id: c.id,
          documentId: c.documentId || documentId,
          author: c.user ? mapUserFromApi(c.user) : {
            id: c.userId || '',
            email: '',
            name: 'Unknown',
            role: 'viewer' as const,
            isActive: true,
            createdAt: '',
            updatedAt: '',
          },
          content: c.content,
          parentId: c.parentId || undefined,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })
      );
      return { success: true as const, data: mapped };
    }
    return res as ApiResponse<Comment[]>;
  }

  async addComment(documentId: string, content: string, parentId?: string) {
    return this.request<Comment>(`/documents/${documentId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  // --- Workflows ---
  async getWorkflows(status?: string) {
    const params = status ? `?status=${status}` : '';
    const res = await this.request<Record<string, unknown>>(`/workflows${params}`);
    if (res.success && res.data) {
      const d = res.data;
      const workflows = (Array.isArray(d) ? d : (d.workflows || [])) as unknown[];
      const mapped = workflows.map(
        (w: any): Workflow => ({
          id: w.id,
          name: w.name,
          description: undefined,
          type: (w.type || 'sequential') as Workflow['type'],
          status: (w.status === 'pending' ? 'active' : w.status === 'in_progress' ? 'active' : w.status === 'completed' ? 'completed' : w.status === 'cancelled' ? 'cancelled' : 'active') as Workflow['status'],
          steps: (w.steps || []).map(
            (s: any) => ({
              id: s.id,
              workflowId: w.id,
              order: s.stepOrder || 0,
              type: (s.stepType === 'approval' ? 'approve' : s.stepType === 'sign' ? 'sign' : s.stepType === 'review' ? 'review' : 'notify') as 'approve' | 'sign' | 'review' | 'notify',
              assignee: s.approver ? mapUserFromApi(s.approver) : undefined,
              status: (s.status === 'approved' ? 'approved' : s.status === 'rejected' ? 'rejected' : s.status === 'skipped' ? 'skipped' : 'pending') as 'pending' | 'approved' | 'rejected' | 'skipped',
              comment: s.comments || undefined,
              completedAt: s.actionDate || undefined,
              dueDate: s.dueDate || undefined,
            })
          ),
          documentId: w.documentId || undefined,
          createdBy: {
            id: '', email: '', name: 'System', role: 'admin' as const, isActive: true, createdAt: '', updatedAt: '',
          },
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })
      );
      return { success: true as const, data: mapped };
    }
    return res as ApiResponse<Workflow[]>;
  }

  async approveWorkflowStep(workflowId: string, stepId: string, comment?: string) {
    return this.request<unknown>(`/workflows/${workflowId}/step/${stepId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async rejectWorkflowStep(workflowId: string, stepId: string, comment: string) {
    return this.request<unknown>(`/workflows/${workflowId}/step/${stepId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  // --- Templates ---
  async getTemplates(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    const qs = params.toString();
    const res = await this.request<Record<string, unknown>>(`/templates${qs ? `?${qs}` : ''}`);
    if (res.success && res.data) {
      const d = res.data as Record<string, unknown>;
      const templates = ((d.templates || d) as unknown[]);
      const mapped = (Array.isArray(templates) ? templates : []).map(mapTemplateFromApi);
      return { success: true as const, data: mapped };
    }
    return res as ApiResponse<Template[]>;
  }

  async createTemplate(data: unknown) {
    return this.request<Template>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id: string) {
    return this.request<void>(`/templates/${id}`, { method: 'DELETE' });
  }

  // --- Notifications ---
  async getNotifications() {
    const res = await this.request<Record<string, unknown>>('/notifications?limit=20');
    if (res.success && res.data) {
      const d = res.data as Record<string, unknown>;
      const notifs = ((d.notifications || d) as unknown[]);
      const mapped = (Array.isArray(notifs) ? notifs : []).map(mapNotificationFromApi);
      return { success: true as const, data: mapped };
    }
    return res as ApiResponse<Notification[]>;
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/notifications/count');
  }

  async markNotificationRead(id: string) {
    return this.request<void>(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request<void>('/notifications/read-all', { method: 'PUT' });
  }

  // --- Audit Logs ---
  async getAuditLogs(filters?: AuditLogFilters & PaginationParams) {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.action && filters.action.length > 0) {
        params.set('action', filters.action.join(','));
      }
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.resourceType) params.set('resource', filters.resourceType);
      if (filters.dateFrom) params.set('startDate', filters.dateFrom);
      if (filters.dateTo) params.set('endDate', filters.dateTo);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('limit', String(filters.pageSize));
    }
    const res = await this.request<Record<string, unknown>>(`/audit-logs?${params.toString()}`);
    if (res.success && res.data) {
      const d = res.data as Record<string, unknown>;
      const logs = ((d.logs || []) as unknown[]).map(mapAuditLogFromApi);
      const pagination = d.pagination as { page: number; limit: number; total: number; totalPages: number } | undefined;
      const result: PaginatedResponse<AuditLog> = {
        items: logs,
        total: pagination?.total || logs.length,
        page: pagination?.page || 1,
        pageSize: pagination?.limit || 20,
        totalPages: pagination?.totalPages || 1,
      };
      return { success: true as const, data: result };
    }
    return res as ApiResponse<PaginatedResponse<AuditLog>>;
  }

  async exportAuditLogs() {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}/audit-logs/export`, { headers });
    if (!response.ok) return { success: false, error: 'Export failed' };
    const data = await response.json();
    return { success: true, data };
  }

  // --- Users (Admin) ---
  async getUsers(filters?: UserFilters & PaginationParams) {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.role && filters.role.length > 0) {
        // Map frontend roles to DB roles
        const roleMap: Record<string, string[]> = {
          admin: ['super_admin', 'system_admin'],
          manager: ['hr', 'finance', 'procurement', 'legal', 'dept_manager'],
          signer: ['external_signer'],
          viewer: ['employee'],
        };
        const dbRoles = filters.role.flatMap(r => roleMap[r] || [r]);
        params.set('role', dbRoles.join(','));
      }
      if (filters.department) params.set('departmentId', filters.department);
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('limit', String(filters.pageSize));
    }
    const res = await this.request<Record<string, unknown>>(`/users?${params.toString()}`);
    if (res.success && res.data) {
      const d = res.data as Record<string, unknown>;
      const users = ((d.users || []) as unknown[]).map(mapUserFromApi);
      const pagination = d.pagination as { page: number; limit: number; total: number; totalPages: number } | undefined;
      const result: PaginatedResponse<User> = {
        items: users,
        total: pagination?.total || users.length,
        page: pagination?.page || 1,
        pageSize: pagination?.limit || 20,
        totalPages: pagination?.totalPages || 1,
      };
      return { success: true as const, data: result };
    }
    return res as ApiResponse<PaginatedResponse<User>>;
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<void>(`/users/${id}`, { method: 'DELETE' });
  }

  // --- Departments ---
  async getDepartments() {
    const res = await this.request<unknown>('/departments');
    if (res.success && res.data) {
      const d = res.data;
      const depts = (Array.isArray(d) ? d : ((d as Record<string, unknown>)?.departments || [])) as unknown[];
      const mapped = depts.map(mapDepartmentFromApi);
      return { success: true as const, data: mapped };
    }
    return res as ApiResponse<Department[]>;
  }

  async createDepartment(data: Partial<Department>) {
    return this.request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Workflow Templates ---
  async getWorkflowTemplates(category?: string) {
    const params = category ? `?category=${category}` : '';
    return this.request<unknown>(`/workflow-templates${params}`);
  }

  // --- AI Features ---
  async ocrDocument(data: { documentId?: string; imageBase64?: string }) {
    return this.request<{ text: string }>('/ai/ocr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async summarizeDocument(data: { documentId?: string; text?: string }) {
    return this.request<{ summary: string; keyPoints: string[] }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async extractClauses(data: { documentId?: string; text?: string }) {
    return this.request<{ clauses: { type: string; text: string; page?: number }[] }>('/ai/extract-clauses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async suggestFields(documentId: string) {
    return this.request<{ fields: { type: string; label: string; x: number; y: number; page: number }[] }>('/ai/suggest-fields', {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    });
  }

  async aiChat(data: { message: string; documentId?: string; history?: { role: string; content: string }[] }) {
    return this.request<{ response: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Save Document Fields ---
  async saveDocumentFields(documentId: string, fields: unknown[]) {
    return this.request<unknown>(`/documents/${documentId}/fields`, {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });
  }

  // --- System Health ---
  async getSystemHealth() {
    const res = await this.request<Record<string, unknown>>('/admin/system-health');
    if (res.success && res.data) {
      const d = res.data as Record<string, unknown>;
      const uptime = d.uptime as Record<string, unknown> | undefined;
      const db = d.database as Record<string, unknown> | undefined;
      const mem = d.memory as Record<string, unknown> | undefined;
      const sessions = d.sessions as Record<string, unknown> | undefined;

      const health: SystemHealthStatus = {
        status: (d.status as SystemHealthStatus['status']) || 'healthy',
        uptime: (uptime?.seconds as number) || 0,
        cpuUsage: 34, // Not available from server, use mock
        memoryUsage: parseInt(String(mem?.heapUsed || '0')) / parseInt(String(mem?.heapTotal || '1')) * 100 || 45,
        diskUsage: 67, // Not available, mock
        activeConnections: (sessions?.active as number) || 0,
        lastChecked: (d.timestamp as string) || new Date().toISOString(),
      };
      return { success: true as const, data: health };
    }
    return res as ApiResponse<SystemHealthStatus>;
  }
}

export const api = new ApiClient();

// ============================================================
// Mock data generators (fallbacks only)
// ============================================================

export const mockUsers: User[] = [
  { id: '1', email: 'admin@docsign.com', name: 'Sarah Chen', avatar: '', role: 'admin', department: 'Engineering', jobTitle: 'CTO', isActive: true, lastLogin: '2025-07-09T10:30:00Z', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2025-07-09T10:30:00Z' },
  { id: '2', email: 'john@docsign.com', name: 'John Martinez', avatar: '', role: 'manager', department: 'Legal', jobTitle: 'Legal Director', isActive: true, lastLogin: '2025-07-09T09:15:00Z', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2025-07-09T09:15:00Z' },
  { id: '3', email: 'emily@docsign.com', name: 'Emily Watson', avatar: '', role: 'signer', department: 'Sales', jobTitle: 'Sales Manager', isActive: true, lastLogin: '2025-07-08T16:45:00Z', createdAt: '2024-03-10T00:00:00Z', updatedAt: '2025-07-08T16:45:00Z' },
  { id: '4', email: 'david@docsign.com', name: 'David Kim', avatar: '', role: 'signer', department: 'Finance', jobTitle: 'CFO', isActive: true, lastLogin: '2025-07-08T14:20:00Z', createdAt: '2024-01-20T00:00:00Z', updatedAt: '2025-07-08T14:20:00Z' },
  { id: '5', email: 'lisa@docsign.com', name: 'Lisa Park', avatar: '', role: 'viewer', department: 'HR', jobTitle: 'HR Coordinator', isActive: true, lastLogin: '2025-07-07T11:00:00Z', createdAt: '2024-04-05T00:00:00Z', updatedAt: '2025-07-07T11:00:00Z' },
];

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'Enterprise License Agreement - Acme Corp',
    description: 'Annual enterprise license agreement for software products',
    fileName: 'ELA_AcmeCorp_2025.pdf',
    fileUrl: '#',
    fileSize: 2450000,
    fileType: 'application/pdf',
    pageCount: 28,
    status: 'sent',
    priority: 'high',
    owner: mockUsers[0],
    sender: mockUsers[0],
    recipients: [
      { id: 'r1', user: mockUsers[1], role: 'signer', status: 'signed', signedAt: '2025-07-08T14:30:00Z', order: 1 },
      { id: 'r2', user: mockUsers[3], role: 'signer', status: 'pending', order: 2 },
      { id: 'r3', user: mockUsers[4], role: 'cc', status: 'pending', order: 3 },
    ],
    signatures: [
      { id: 'sig1', documentId: 'doc-1', signerId: '2', signer: mockUsers[1], type: 'drawn', value: '', page: 5, x: 100, y: 600, width: 200, height: 60, signedAt: '2025-07-08T14:30:00Z', isVerified: true },
    ],
    fields: [
      { id: 'f1', documentId: 'doc-1', type: 'signature', label: 'Legal Director Signature', required: true, assignedTo: '2', page: 5, x: 100, y: 600, width: 200, height: 60, isCompleted: true },
      { id: 'f2', documentId: 'doc-1', type: 'signature', label: 'CFO Signature', required: true, assignedTo: '4', page: 5, x: 400, y: 600, width: 200, height: 60, isCompleted: false },
      { id: 'f3', documentId: 'doc-1', type: 'date', label: 'Effective Date', required: true, page: 1, x: 350, y: 100, width: 150, height: 30, isCompleted: true, value: '2025-07-01' },
    ],
    tags: ['contract', 'enterprise', 'high-value'],
    folder: 'Contracts',
    expiresAt: '2025-08-01T00:00:00Z',
    createdAt: '2025-07-01T09:00:00Z',
    updatedAt: '2025-07-08T14:30:00Z',
  },
  {
    id: 'doc-2',
    title: 'Non-Disclosure Agreement - TechStart Inc',
    description: 'Mutual NDA for partnership discussions',
    fileName: 'NDA_TechStart_2025.pdf',
    fileUrl: '#',
    fileSize: 890000,
    fileType: 'application/pdf',
    pageCount: 5,
    status: 'completed',
    priority: 'normal',
    owner: mockUsers[1],
    sender: mockUsers[1],
    recipients: [
      { id: 'r4', user: mockUsers[0], role: 'signer', status: 'signed', signedAt: '2025-07-05T11:00:00Z', order: 1 },
      { id: 'r5', user: mockUsers[2], role: 'signer', status: 'signed', signedAt: '2025-07-06T09:30:00Z', order: 2 },
    ],
    signatures: [
      { id: 'sig2', documentId: 'doc-2', signerId: '1', signer: mockUsers[0], type: 'typed', value: '', page: 3, x: 80, y: 500, width: 200, height: 50, signedAt: '2025-07-05T11:00:00Z', isVerified: true },
      { id: 'sig3', documentId: 'doc-2', signerId: '3', signer: mockUsers[2], type: 'drawn', value: '', page: 3, x: 350, y: 500, width: 200, height: 50, signedAt: '2025-07-06T09:30:00Z', isVerified: true },
    ],
    fields: [],
    tags: ['nda', 'partnership'],
    folder: 'Legal',
    completedAt: '2025-07-06T09:30:00Z',
    createdAt: '2025-07-04T14:00:00Z',
    updatedAt: '2025-07-06T09:30:00Z',
  },
  {
    id: 'doc-3',
    title: 'Sales Contract - Global Logistics Ltd',
    description: 'Service agreement for logistics management platform',
    fileName: 'SalesContract_GlobalLogistics.pdf',
    fileUrl: '#',
    fileSize: 1800000,
    fileType: 'application/pdf',
    pageCount: 18,
    status: 'draft',
    priority: 'normal',
    owner: mockUsers[2],
    recipients: [],
    signatures: [],
    fields: [
      { id: 'f4', documentId: 'doc-3', type: 'signature', label: 'Client Signature', required: true, page: 18, x: 80, y: 650, width: 200, height: 60, isCompleted: false },
      { id: 'f5', documentId: 'doc-3', type: 'text', label: 'Company Name', required: true, page: 1, x: 200, y: 200, width: 300, height: 30, isCompleted: false },
    ],
    tags: ['sales', 'contract'],
    folder: 'Sales',
    createdAt: '2025-07-08T16:00:00Z',
    updatedAt: '2025-07-08T16:00:00Z',
  },
  {
    id: 'doc-4',
    title: 'Employment Agreement - Michael Torres',
    description: 'Full-time employment agreement for senior developer',
    fileName: 'Employment_MTorres.pdf',
    fileUrl: '#',
    fileSize: 1200000,
    fileType: 'application/pdf',
    pageCount: 12,
    status: 'sent',
    priority: 'urgent',
    owner: mockUsers[4],
    sender: mockUsers[4],
    recipients: [
      { id: 'r6', user: mockUsers[0], role: 'signer', status: 'pending', order: 1 },
    ],
    signatures: [],
    fields: [
      { id: 'f6', documentId: 'doc-4', type: 'signature', label: 'HR Director Signature', required: true, assignedTo: '1', page: 12, x: 80, y: 600, width: 200, height: 60, isCompleted: false },
      { id: 'f7', documentId: 'doc-4', type: 'signature', label: 'Employee Signature', required: true, page: 12, x: 400, y: 600, width: 200, height: 60, isCompleted: false },
    ],
    tags: ['hr', 'employment'],
    folder: 'HR',
    expiresAt: '2025-07-15T00:00:00Z',
    createdAt: '2025-07-07T10:00:00Z',
    updatedAt: '2025-07-07T10:00:00Z',
  },
  {
    id: 'doc-5',
    title: 'Vendor Agreement - CloudSync Pro',
    description: 'Annual vendor services agreement',
    fileName: 'VendorAgreement_CloudSync.pdf',
    fileUrl: '#',
    fileSize: 3100000,
    fileType: 'application/pdf',
    pageCount: 35,
    status: 'rejected',
    priority: 'high',
    owner: mockUsers[3],
    sender: mockUsers[3],
    recipients: [
      { id: 'r7', user: mockUsers[1], role: 'signer', status: 'declined', order: 1 },
    ],
    signatures: [],
    fields: [],
    tags: ['vendor', 'legal'],
    folder: 'Procurement',
    createdAt: '2025-07-02T08:30:00Z',
    updatedAt: '2025-07-06T15:45:00Z',
  },
  {
    id: 'doc-6',
    title: 'Partnership MOU - DataViz Analytics',
    description: 'Memorandum of understanding for data analytics partnership',
    fileName: 'MOU_DataViz.pdf',
    fileUrl: '#',
    fileSize: 750000,
    fileType: 'application/pdf',
    pageCount: 4,
    status: 'viewed',
    priority: 'low',
    owner: mockUsers[0],
    sender: mockUsers[0],
    recipients: [
      { id: 'r8', user: mockUsers[2], role: 'signer', status: 'viewed', order: 1 },
    ],
    signatures: [],
    fields: [],
    tags: ['partnership', 'mou'],
    folder: 'Partnerships',
    createdAt: '2025-07-09T08:00:00Z',
    updatedAt: '2025-07-09T09:30:00Z',
  },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'warning', category: 'signature', title: 'Signature Required', message: 'Enterprise License Agreement needs your signature', isRead: false, actionUrl: '/documents/doc-1', sender: mockUsers[1], createdAt: '2025-07-09T10:00:00Z' },
  { id: 'n2', type: 'info', category: 'document', title: 'Document Viewed', message: 'Emily Watson viewed Partnership MOU', isRead: false, actionUrl: '/documents/doc-6', sender: mockUsers[2], createdAt: '2025-07-09T09:30:00Z' },
  { id: 'n3', type: 'success', category: 'workflow', title: 'Approval Completed', message: 'NDA with TechStart has been fully signed', isRead: true, actionUrl: '/documents/doc-2', sender: mockUsers[2], createdAt: '2025-07-06T09:30:00Z' },
  { id: 'n4', type: 'error', category: 'workflow', title: 'Document Rejected', message: 'John Martinez rejected Vendor Agreement', isRead: false, actionUrl: '/documents/doc-5', sender: mockUsers[1], createdAt: '2025-07-06T15:45:00Z' },
  { id: 'n5', type: 'warning', category: 'document', title: 'Expiring Soon', message: 'Employment Agreement expires in 6 days', isRead: false, actionUrl: '/documents/doc-4', createdAt: '2025-07-09T08:00:00Z' },
  { id: 'n6', type: 'info', category: 'system', title: 'System Update', message: 'Platform maintenance scheduled for July 12', isRead: true, createdAt: '2025-07-08T12:00:00Z' },
];

export const mockActivity: ActivityItem[] = [
  { id: 'a1', action: 'document.sent', description: 'Sent Enterprise License Agreement to David Kim', user: mockUsers[0], timestamp: '2025-07-09T10:30:00Z', documentId: 'doc-1', documentTitle: 'Enterprise License Agreement' },
  { id: 'a2', action: 'document.viewed', description: 'Viewed Partnership MOU - DataViz Analytics', user: mockUsers[2], timestamp: '2025-07-09T09:30:00Z', documentId: 'doc-6', documentTitle: 'Partnership MOU' },
  { id: 'a3', action: 'signature.added', description: 'Signed NDA with TechStart Inc', user: mockUsers[2], timestamp: '2025-07-06T09:30:00Z', documentId: 'doc-2', documentTitle: 'NDA - TechStart Inc' },
  { id: 'a4', action: 'document.rejected', description: 'Rejected Vendor Agreement - CloudSync Pro', user: mockUsers[1], timestamp: '2025-07-06T15:45:00Z', documentId: 'doc-5', documentTitle: 'Vendor Agreement' },
  { id: 'a5', action: 'document.completed', description: 'Completed NDA - TechStart Inc', user: mockUsers[1], timestamp: '2025-07-06T09:30:00Z', documentId: 'doc-2', documentTitle: 'NDA - TechStart Inc' },
  { id: 'a6', action: 'signature.added', description: 'Signed NDA with TechStart Inc', user: mockUsers[0], timestamp: '2025-07-05T11:00:00Z', documentId: 'doc-2', documentTitle: 'NDA - TechStart Inc' },
  { id: 'a7', action: 'document.created', description: 'Created Employment Agreement for Michael Torres', user: mockUsers[4], timestamp: '2025-07-07T10:00:00Z', documentId: 'doc-4', documentTitle: 'Employment Agreement' },
  { id: 'a8', action: 'document.sent', description: 'Sent Employment Agreement to Sarah Chen', user: mockUsers[4], timestamp: '2025-07-07T10:05:00Z', documentId: 'doc-4', documentTitle: 'Employment Agreement' },
  { id: 'a9', action: 'document.created', description: 'Created Sales Contract - Global Logistics', user: mockUsers[2], timestamp: '2025-07-08T16:00:00Z', documentId: 'doc-3', documentTitle: 'Sales Contract' },
  { id: 'a10', action: 'user.login', description: 'Logged in from Chrome on MacOS', user: mockUsers[0], timestamp: '2025-07-09T10:25:00Z' },
];

export const mockTemplates: Template[] = [
  { id: 'tpl-1', name: 'Standard NDA', description: 'Mutual non-disclosure agreement template', category: 'nda', thumbnail: '', fileUrl: '#', fields: [], usageCount: 156, isPublic: true, createdBy: mockUsers[1], createdAt: '2024-06-01T00:00:00Z', updatedAt: '2025-06-15T00:00:00Z' },
  { id: 'tpl-2', name: 'Employment Agreement', description: 'Full-time employment contract template', category: 'hr', thumbnail: '', fileUrl: '#', fields: [], usageCount: 89, isPublic: true, createdBy: mockUsers[4], createdAt: '2024-03-20T00:00:00Z', updatedAt: '2025-05-10T00:00:00Z' },
  { id: 'tpl-3', name: 'Service Contract', description: 'Professional services agreement', category: 'contract', thumbnail: '', fileUrl: '#', fields: [], usageCount: 234, isPublic: true, createdBy: mockUsers[0], createdAt: '2024-01-15T00:00:00Z', updatedAt: '2025-07-01T00:00:00Z' },
  { id: 'tpl-4', name: 'Sales Proposal', description: 'Sales proposal template with pricing', category: 'proposal', thumbnail: '', fileUrl: '#', fields: [], usageCount: 67, isPublic: true, createdBy: mockUsers[2], createdAt: '2024-08-10T00:00:00Z', updatedAt: '2025-06-20T00:00:00Z' },
  { id: 'tpl-5', name: 'Vendor Agreement', description: 'Standard vendor/supplier agreement', category: 'agreement', thumbnail: '', fileUrl: '#', fields: [], usageCount: 45, isPublic: false, createdBy: mockUsers[3], createdAt: '2024-11-01T00:00:00Z', updatedAt: '2025-04-15T00:00:00Z' },
  { id: 'tpl-6', name: 'Invoice Template', description: 'Standard commercial invoice', category: 'invoice', thumbnail: '', fileUrl: '#', fields: [], usageCount: 312, isPublic: true, createdBy: mockUsers[3], createdAt: '2024-02-01T00:00:00Z', updatedAt: '2025-06-30T00:00:00Z' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'al1', action: 'document.created', userId: '1', user: mockUsers[0], resourceType: 'document', resourceId: 'doc-1', details: { title: 'Enterprise License Agreement' }, ipAddress: '192.168.1.100', userAgent: 'Chrome/126', createdAt: '2025-07-01T09:00:00Z' },
  { id: 'al2', action: 'document.sent', userId: '1', user: mockUsers[0], resourceType: 'document', resourceId: 'doc-1', details: { recipients: ['John Martinez', 'David Kim'] }, ipAddress: '192.168.1.100', userAgent: 'Chrome/126', createdAt: '2025-07-01T09:15:00Z' },
  { id: 'al3', action: 'signature.added', userId: '2', user: mockUsers[1], resourceType: 'document', resourceId: 'doc-1', details: { page: 5 }, ipAddress: '192.168.1.105', userAgent: 'Firefox/127', createdAt: '2025-07-08T14:30:00Z' },
  { id: 'al4', action: 'document.completed', userId: '1', user: mockUsers[0], resourceType: 'document', resourceId: 'doc-2', details: { title: 'NDA - TechStart Inc' }, ipAddress: '192.168.1.100', userAgent: 'Chrome/126', createdAt: '2025-07-06T09:30:00Z' },
  { id: 'al5', action: 'document.rejected', userId: '2', user: mockUsers[1], resourceType: 'document', resourceId: 'doc-5', details: { reason: 'Terms need revision' }, ipAddress: '192.168.1.105', userAgent: 'Firefox/127', createdAt: '2025-07-06T15:45:00Z' },
  { id: 'al6', action: 'user.login', userId: '1', user: mockUsers[0], resourceType: 'user', resourceId: '1', details: { method: 'SSO' }, ipAddress: '192.168.1.100', userAgent: 'Chrome/126', createdAt: '2025-07-09T10:25:00Z' },
  { id: 'al7', action: 'template.used', userId: '2', user: mockUsers[1], resourceType: 'template', resourceId: 'tpl-1', details: { templateName: 'Standard NDA' }, ipAddress: '192.168.1.105', userAgent: 'Firefox/127', createdAt: '2025-07-04T14:00:00Z' },
  { id: 'al8', action: 'document.created', userId: '5', user: mockUsers[4], resourceType: 'document', resourceId: 'doc-4', details: { title: 'Employment Agreement' }, ipAddress: '192.168.1.120', userAgent: 'Safari/17', createdAt: '2025-07-07T10:00:00Z' },
  { id: 'al9', action: 'user.created', userId: '1', user: mockUsers[0], resourceType: 'user', resourceId: '5', details: { userName: 'Lisa Park' }, ipAddress: '192.168.1.100', userAgent: 'Chrome/126', createdAt: '2024-04-05T09:00:00Z' },
  { id: 'al10', action: 'document.downloaded', userId: '3', user: mockUsers[2], resourceType: 'document', resourceId: 'doc-6', details: { title: 'Partnership MOU' }, ipAddress: '192.168.1.110', userAgent: 'Chrome/126', createdAt: '2025-07-09T09:35:00Z' },
];

export const mockDepartments: Department[] = [
  { id: 'dept-1', name: 'Engineering', description: 'Product development and engineering', head: 'Sarah Chen', memberCount: 45, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dept-2', name: 'Legal', description: 'Legal affairs and compliance', head: 'John Martinez', memberCount: 12, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dept-3', name: 'Sales', description: 'Sales and business development', head: 'Emily Watson', memberCount: 28, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dept-4', name: 'Finance', description: 'Financial planning and accounting', head: 'David Kim', memberCount: 15, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dept-5', name: 'Human Resources', description: 'HR management and recruitment', head: 'Lisa Park', memberCount: 8, createdAt: '2024-01-01T00:00:00Z' },
];

export const mockDashboardStats: DashboardStats = {
  totalDocuments: 1247,
  pendingSignatures: 23,
  pendingApprovals: 8,
  completedThisMonth: 156,
  documentsTrend: 12.5,
  signaturesTrend: -3.2,
  approvalsTrend: 8.1,
  completedTrend: 15.3,
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    viewed: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    signed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    voided: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    operational: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    degraded: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    down: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    healthy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[priority] || colors.normal;
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    manager: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    signer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return colors[role] || colors.viewer;
}
