import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, parsePagination } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams);
    const status = request.nextUrl.searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [workflows, total] = await Promise.all([
      db.workflow.findMany({
        where,
        include: {
          document: { select: { id: true, title: true, status: true } },
          steps: {
            include: { approver: { select: { id: true, name: true, email: true, avatarUrl: true } } },
            orderBy: { stepOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.workflow.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        workflows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('List workflows error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
