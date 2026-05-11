// ============================================================
// Enterprise Document Signing Platform - Zustand Store
// ============================================================

import { create } from 'zustand';
import type { User, Notification } from './types';

const API_BASE = '/api';

interface AppStore {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;

  // Navigation
  currentPage: string;
  pageParams: Record<string, unknown>;
  navigate: (page: string, params?: Record<string, unknown>) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: string) => void;

  // Keyboard Shortcuts Dialog
  keyboardShortcutsOpen: boolean;
  setKeyboardShortcutsOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Auth
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, _password: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: _password || 'demo' }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const { token, user } = data.data;
        // Map DB user to frontend user type
        const mappedUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatarUrl || '',
          role: mapRole(user.role),
          department: user.departmentId || undefined,
          jobTitle: user.jobTitle || undefined,
          isActive: user.isActive,
          lastLogin: user.lastLoginAt || undefined,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('docsign-auth', JSON.stringify({ token, user: mappedUser }));
        }

        set({
          user: mappedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
          currentPage: 'dashboard',
        });
      } else {
        set({ isLoading: false });
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    const { token } = get();
    // Try to invalidate session on server
    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('docsign-auth');
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      currentPage: 'login',
      notifications: [],
      unreadCount: 0,
    });
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('docsign-auth');
      if (stored) {
        const { token, user } = JSON.parse(stored);
        if (token && user) {
          // Verify token is still valid
          try {
            const response = await fetch(`${API_BASE}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success && data.data) {
              const freshUser: User = {
                id: data.data.id,
                email: data.data.email,
                name: data.data.name,
                avatar: data.data.avatarUrl || '',
                role: mapRole(data.data.role),
                department: data.data.departmentId || undefined,
                jobTitle: data.data.jobTitle || undefined,
                isActive: data.data.isActive,
                lastLogin: data.data.lastLoginAt || undefined,
                createdAt: data.data.createdAt,
                updatedAt: data.data.updatedAt,
              };
              localStorage.setItem('docsign-auth', JSON.stringify({ token, user: freshUser }));
              set({
                user: freshUser,
                token,
                isAuthenticated: true,
                currentPage: get().currentPage === 'login' ? 'dashboard' : get().currentPage,
              });
              return;
            }
          } catch {
            // Network error, use cached data
          }
          set({
            user,
            token,
            isAuthenticated: true,
            currentPage: get().currentPage === 'login' ? 'dashboard' : get().currentPage,
          });
          return;
        }
      }
    } catch {
      // Invalid stored data
    }
    set({ isAuthenticated: false, currentPage: 'login' });
  },

  // Navigation
  currentPage: 'login',
  pageParams: {},

  navigate: (page: string, params?: Record<string, unknown>) => {
    set({ currentPage: page, pageParams: params || {} });
  },

  // Notifications
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        const notifications: Notification[] = (data.data.notifications || data.data || []).map(
          (n: Record<string, unknown>) => ({
            id: n.id,
            type: mapNotificationType(n.type as string),
            category: mapNotificationCategory(n.type as string),
            title: n.title,
            message: n.message,
            isRead: n.isRead,
            actionUrl: n.link ? String(n.link) : undefined,
            createdAt: n.createdAt,
          })
        );
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadCount });
      }
    } catch {
      // Use fallback
    }
  },

  markAsRead: (id: string) => {
    const { token } = get();
    // Fire and forget API call
    fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});

    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  markAllAsRead: () => {
    const { token } = get();
    fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});

    const notifications = get().notifications.map((n) => ({
      ...n,
      isRead: true,
    }));
    set({ notifications, unreadCount: 0 });
  },

  // Sidebar
  sidebarOpen: true,

  toggleSidebar: () => {
    set({ sidebarOpen: !get().sidebarOpen });
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  // Theme
  theme: 'system',

  setTheme: (theme: string) => {
    set({ theme: theme as 'light' | 'dark' | 'system' });
    if (typeof window !== 'undefined') {
      localStorage.setItem('docsign-theme', theme);
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }
  },

  // Keyboard Shortcuts Dialog
  keyboardShortcutsOpen: false,

  setKeyboardShortcutsOpen: (open: boolean) => {
    set({ keyboardShortcutsOpen: open });
  },
}));

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

function mapNotificationType(type: string): 'info' | 'success' | 'warning' | 'error' {
  switch (type) {
    case 'signed':
    case 'completed':
      return 'success';
    case 'rejected':
    case 'expired':
      return 'error';
    case 'reminder':
      return 'warning';
    default:
      return 'info';
  }
}

function mapNotificationCategory(type: string): 'document' | 'signature' | 'workflow' | 'system' | 'mention' {
  switch (type) {
    case 'signed':
    case 'approval_pending':
      return 'workflow';
    case 'comment':
    case 'mention':
      return 'mention';
    case 'reminder':
    case 'system':
      return 'system';
    default:
      return 'document';
  }
}
