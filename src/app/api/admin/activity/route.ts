import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, isAdmin, parsePagination } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams);

    // Get recent activities from audit logs and document activities
    const [auditLogs, documentActivities] = await Promise.all([
      db.auditLog.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.documentActivity.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          document: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Merge and sort by date
    const activities = [
      ...auditLogs.map((log) => ({
        id: log.id,
        type: 'audit' as const,
        action: log.action,
        user: log.user,
        details: log.details,
        resource: log.resource,
        resourceId: log.resourceId,
        severity: log.severity,
        createdAt: log.createdAt,
      })),
      ...documentActivities.map((act) => ({
        id: act.id,
        type: 'document' as const,
        action: act.action,
        user: act.user,
        details: act.details,
        document: act.document,
        severity: 'info' as const,
        createdAt: act.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total: auditLogs.length + documentActivities.length,
          totalPages: Math.ceil((auditLogs.length + documentActivities.length) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get admin activity error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
