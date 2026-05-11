import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      activeUsers,
      totalDocuments,
      pendingApprovals,
      pendingSignatures,
      completedDocuments,
      rejectedDocuments,
      draftDocuments,
      totalWorkflows,
      activeWorkflows,
      totalDepartments,
      totalTemplates,
      recentSignatures,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.document.count({ where: { status: { not: 'archived' } } }),
      db.document.count({ where: { status: 'pending_approval' } }),
      db.document.count({ where: { status: 'pending_signature' } }),
      db.document.count({ where: { status: { in: ['completed', 'signed'] } } }),
      db.document.count({ where: { status: 'rejected' } }),
      db.document.count({ where: { status: 'draft' } }),
      db.workflow.count(),
      db.workflow.count({ where: { status: { in: ['pending', 'in_progress'] } } }),
      db.department.count(),
      db.template.count(),
      db.signature.count({ where: { signedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]);

    // Documents by status
    const documentsByStatus = {
      draft: draftDocuments,
      pending_approval: pendingApprovals,
      pending_signature: pendingSignatures,
      completed: completedDocuments,
      rejected: rejectedDocuments,
    };

    // Documents by category
    const documentsByCategory = await db.document.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { status: { not: 'archived' } },
    });

    return NextResponse.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        documents: {
          total: totalDocuments,
          byStatus: documentsByStatus,
          byCategory: documentsByCategory.map((c) => ({
            category: c.category || 'uncategorized',
            count: c._count.id,
          })),
        },
        workflows: { total: totalWorkflows, active: activeWorkflows },
        signatures: { recentLast30Days: recentSignatures },
        departments: totalDepartments,
        templates: totalTemplates,
        pendingActions: pendingApprovals + pendingSignatures,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
