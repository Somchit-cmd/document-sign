# Task 4 - Frontend Integration Developer

## Summary
Updated all frontend components to use real API data instead of mock data via TanStack Query (React Query).

## Files Modified
1. `src/lib/api.ts` - Major rewrite: added type mapping functions, fixed API endpoints, added new methods
2. `src/components/DashboardPage.tsx` - Added useQuery for stats, activity, pending docs
3. `src/components/DocumentsPage.tsx` - Added useQuery for documents with filters
4. `src/components/DocumentDetailPage.tsx` - Added useQuery for document + comments
5. `src/components/InboxPage.tsx` - Added useQuery for pending docs, useMutation for actions
6. `src/components/TemplatesPage.tsx` - Added useQuery for templates
7. `src/components/AuditLogsPage.tsx` - Added useQuery for audit logs, export
8. `src/components/AdminPage.tsx` - Added useQuery for users, departments, workflows, health
9. `src/components/SettingsPage.tsx` - Added useMutation for profile update

## Key Decisions
- Mock data kept as fallback for graceful degradation
- DB status mapping: pending_approval/pending_signature → sent
- creator → owner mapping for documents
- All API calls use Bearer token from localStorage
- TanStack Query with staleTime for caching
- Skeleton loading states for all data views
