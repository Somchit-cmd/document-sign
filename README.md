# DocuSign Enterprise — Secure Document Signing Platform

<p align="center">
  <img src="public/logo.svg" alt="DocuSign Enterprise" width="80" height="80" />
  <br />
  <strong>Enterprise-grade electronic signatures with approval workflows, audit trails, and real-time collaboration.</strong>
</p>

---

## Overview

DocuSign Enterprise is a full-featured internal document signing platform designed for enterprise teams. It enables digital document approval, electronic signatures, and comprehensive audit trails — all within a secure, role-based environment.

Built with modern web technologies, this platform serves internal employees, management, HR, Finance, Legal, Compliance, and IT departments.

## Features

### Core Capabilities (95+)

| Category | Features |
|----------|----------|
| **Authentication** | SSO login (Microsoft, Google, LDAP), 6 demo accounts, Session management, MFA support |
| **Dashboard** | Time-aware greeting, Quick Stats, Weekly Activity Chart, Deadline Tracker, Signing Velocity, Activity Heatmap, Document Status Breakdown, Quick Links |
| **Documents** | Upload (drag & drop), Grid/List/Table views, Folders, Bulk Operations, Advanced Search, Version History, Document Comparison, Annotations & Markup |
| **Inbox** | Priority-colored items, Quick Sign, Delegate, Sort options, Sound toggle, Step progress indicator |
| **Signatures** | Draw/Type/Upload modes, Pen customization, Signature Canvas, Signature field placement |
| **Workflows** | Visual Builder with drag-and-drop, Sequential/Parallel approval, Approval Chains tracker |
| **Templates** | Category filters, Preview Dialog, Usage statistics, Popularity tracking, Variable auto-fill |
| **AI Features** | OCR, Document Summarization, Clause Extraction, Field Suggestion, AI Chat Assistant |
| **Compliance** | Audit Logs (filtering, severity, export), Compliance Certificates, ESIGN/UETA/eIDAS standards |
| **Analytics** | Reports with 10+ chart types, Department breakdown, Signer analytics, Compliance gauge |
| **Calendar** | Monthly/Week/Agenda views, 5 event types, Upcoming events sidebar |
| **Archive** | Grid/List/Table views, Export (CSV/PDF/JSON), Restore documents |
| **Notifications** | Notification Center, Preferences, Quiet Hours, Bulk actions, Grouped display |
| **Team** | Contacts Directory, Team Leaderboard (gamification), Achievement badges |
| **Document Expiry** | Expiry timeline, Renewal workflow, Reminder settings, Batch operations |
| **Admin** | User CRUD, Department tree, System Configuration (5 sections), System Health, Quick Actions |
| **Settings** | Profile, Security, Notifications, API Keys, Integrations |
| **UX** | Dark mode, Mobile responsive, Keyboard shortcuts (Cmd+/, G+X), Command palette (Cmd+K), Onboarding Tour, Page transitions |

### Pages (22+)

1. **Login** — Animated gradient, floating icons, parallax, glassmorphism, SSO buttons
2. **Dashboard** — Stats, charts, deadlines, activity feed, quick actions
3. **Inbox** — Approval items with priority, quick sign, delegate
4. **Documents** — Full document management with folders and filters
5. **Document Detail** — 3-column resizable layout (Info | PDF | Comments)
6. **Document Editor** — Signature field placement editor
7. **Calendar** — Monthly/Week/Agenda views
8. **Archive** — Archived documents management
9. **Contacts** — Directory with department tabs
10. **Notifications** — Full notification center with preferences
11. **Templates** — Template management with preview
12. **Workflows** — Visual workflow builder
13. **Approval Chains** — Visual step progress tracker
14. **Certificates** — Compliance certificate management
15. **Team Leaderboard** — Gamification with achievements
16. **Document Expiry** — Expiry tracking and renewal
17. **Annotations** — PDF markup tools (pen, highlight, sticky notes, shapes)
18. **Document Comparison** — Side-by-side diff with AI analysis
19. **Audit Logs** — Comprehensive audit trail
20. **Reports** — Analytics with 10+ chart types
21. **Admin** — User management, departments, configuration, system health
22. **Settings** — Profile, security, notifications, API keys, integrations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (New York style) |
| **Database** | SQLite via Prisma ORM |
| **State** | Zustand (client) + TanStack Query (server) |
| **Real-time** | Socket.IO mini-service |
| **AI** | z-ai-web-dev-sdk (OCR, Summarization, Chat) |
| **PDF** | react-pdf + pdf-lib |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Auth** | Custom JWT with SSO support |

## Database Schema

17 Prisma models:

- **Users & Auth**: User, Session, ApiKey
- **Organization**: Department
- **Documents**: Document, Folder, DocumentShare, DocumentField, DocumentActivity
- **Signatures**: Signature
- **Workflows**: Workflow, ApprovalStep, WorkflowTemplate
- **Templates**: Template
- **Audit**: AuditLog
- **Notifications**: Notification
- **Comments**: Comment
- **System**: SystemConfig

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Somchit-cmd/document-sign.git
cd document-sign

# Install dependencies
bun install

# Set up the database
bun run db:push

# (Optional) Seed with demo data
bun run db:seed

# Start the development server
bun run dev
```

The application will be available at `http://localhost:3000`.

### Demo Accounts

| Account | Email | Role | Access Level |
|---------|-------|------|-------------|
| Super Admin | sarah.chen@acme.com | System Admin | Full system access |
| HR Director | michael.rodriguez@acme.com | HR Admin | HR & approvals |
| Finance | emily.watson@acme.com | Finance | Finance workflows |
| Legal | david.kim@acme.com | Legal Counsel | Legal & compliance |
| Eng Manager | lisa.thompson@acme.com | Dept Manager | Department manager |
| Employee | james.wilson@acme.com | Employee | Sign & view docs |

Password for all accounts: `demo`

### Real-time Service

The Socket.IO mini-service runs on port 3003:

```bash
cd mini-services/realtime-service
bun install
bun run dev
```

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (17 models)
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── api/               # 47+ API route handlers
│   │   │   ├── auth/          # Login, logout, sessions
│   │   │   ├── documents/     # CRUD, sign, share, comments
│   │   │   ├── workflows/     # Approval workflows
│   │   │   ├── templates/     # Document templates
│   │   │   ├── users/         # User management
│   │   │   ├── departments/   # Department hierarchy
│   │   │   ├── notifications/ # Notification management
│   │   │   ├── audit-logs/    # Audit trail & export
│   │   │   ├── ai/            # OCR, summarize, chat
│   │   │   ├── admin/         # Stats, health, activity
│   │   │   ├── folders/       # Folder management
│   │   │   └── comments/      # Comment threads
│   │   ├── globals.css        # Global styles + 55+ CSS utilities
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main SPA page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components (35+)
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── InboxPage.tsx
│   │   ├── DocumentsPage.tsx
│   │   ├── DocumentDetailPage.tsx
│   │   ├── DocumentEditorPage.tsx
│   │   ├── DocumentAnnotationsPage.tsx
│   │   ├── DocumentComparisonPage.tsx
│   │   ├── TemplatesPage.tsx
│   │   ├── WorkflowBuilderPage.tsx
│   │   ├── ApprovalChainsPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── ArchivePage.tsx
│   │   ├── CertificatePage.tsx
│   │   ├── TeamLeaderboardPage.tsx
│   │   ├── DocumentExpiryPage.tsx
│   │   ├── ContactsPage.tsx
│   │   ├── NotificationCenterPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── AuditLogsPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── AppLayout.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── AppHeader.tsx
│   │   ├── AIAssistant.tsx
│   │   ├── PDFViewer.tsx
│   │   ├── SignatureCanvas.tsx
│   │   ├── SearchDialog.tsx
│   │   ├── KeyboardShortcutsDialog.tsx
│   │   ├── OnboardingTour.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ... (47 components total)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   ├── auth.ts            # Auth utilities
│   │   ├── db.ts              # Prisma client
│   │   ├── store.ts           # Zustand store
│   │   ├── types.ts           # TypeScript types
│   │   └── utils.ts           # Utility functions
│   └── ...
├── mini-services/
│   └── realtime-service/      # Socket.IO service (port 3003)
├── db/
│   └── custom.db              # SQLite database
├── Caddyfile                  # Gateway configuration
└── package.json
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Invalidate session |
| `/api/documents` | GET/POST | List/Create documents |
| `/api/documents/[id]` | GET/PATCH/DELETE | Document operations |
| `/api/documents/[id]/sign` | POST | Sign a document |
| `/api/documents/[id]/share` | POST | Share a document |
| `/api/documents/[id]/comments` | GET/POST | Document comments |
| `/api/documents/[id]/workflow` | GET | Document workflow |
| `/api/documents/[id]/activities` | GET | Document activity log |
| `/api/workflows/[id]/step/[stepId]/approve` | POST | Approve workflow step |
| `/api/workflows/[id]/step/[stepId]/reject` | POST | Reject workflow step |
| `/api/workflows/[id]/step/[stepId]/delegate` | POST | Delegate approval |
| `/api/templates` | GET/POST | List/Create templates |
| `/api/users` | GET/POST | List/Create users |
| `/api/departments` | GET/POST | List/Create departments |
| `/api/notifications` | GET | Get notifications |
| `/api/notifications/count` | GET | Unread count |
| `/api/audit-logs` | GET | Get audit logs |
| `/api/audit-logs/export` | GET | Export audit logs |
| `/api/ai/ocr` | POST | OCR processing |
| `/api/ai/summarize` | POST | Document summarization |
| `/api/ai/chat` | POST | AI chat |
| `/api/admin/stats` | GET | Admin statistics |
| `/api/admin/system-health` | GET | System health check |
| `/api/admin/activity` | GET | Recent activity |
| `/api/admin/storage` | GET | Storage usage |
| ... | | 47+ routes total |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette / search |
| `⌘/` / `Ctrl+/` | Show keyboard shortcuts |
| `G → D` | Go to Dashboard |
| `G → I` | Go to Inbox |
| `G → O` | Go to Documents |
| `G → T` | Go to Templates |
| `G → A` | Go to Admin |
| `G → S` | Go to Settings |
| `G → L` | Go to Audit Logs |

## Styling

The platform includes 55+ custom CSS utilities for premium micro-interactions:

- **Glassmorphism**: `.glass`, `.glass-card`
- **Gradients**: `.gradient-border-hover`, `.gradient-text-animated`, `.card-gradient-top`
- **Animations**: `.animate-btn-shimmer`, `.animate-ripple`, `.animate-breathe`, `.content-reveal`
- **Cards**: `.card-shadow-premium`, `.card-hover-lift`, `.card-elevated`, `.card-tilt`
- **Status**: `.status-dot-animated`, `.animate-status-pulse`, `.badge-glow`
- **Diff**: `.diff-added-line`, `.diff-removed-line`, `.diff-modified-line`
- **Annotations**: `.annotation-highlight`, `.annotation-dot`, `.sticky-note`
- **Risk**: `.risk-high`, `.risk-medium`, `.risk-low`
- **Interactions**: `.hover-glow`, `.micro-glow`, `.check-pop`, `.success-flash`

## Role-Based Access

| Role | Capabilities |
|------|-------------|
| **System Admin** | Full system access, user management, configuration |
| **HR Admin** | HR workflows, employee document management |
| **Department Manager** | Department approvals, team management |
| **Finance** | Finance document workflows, budget approvals |
| **Legal Counsel** | Legal review, compliance checks |
| **Employee** | Sign documents, view own documents |
| **Compliance Officer** | Audit access, compliance monitoring |
| **Auditor** | Read-only audit trail access |
| **IT Admin** | System configuration, integrations |

## Security Features

- JWT-based authentication with session management
- Role-based access control (RBAC)
- Document encryption at rest
- IP address logging
- Complete audit trail
- 256-bit AES encryption indicator
- SOC 2 Type II / GDPR / HIPAA compliance indicators
- MFA support ready

## License

This project is for internal enterprise use only.

---

<p align="center">
  Built with Next.js 16 · TypeScript · Tailwind CSS · Prisma · Framer Motion
</p>
