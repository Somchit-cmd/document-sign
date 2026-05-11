import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, parsePagination } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams);

    const [members, total] = await Promise.all([
      db.user.findMany({
        where: { departmentId: id, isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          jobTitle: true,
          phone: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.user.count({ where: { departmentId: id, isActive: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        members,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get department members error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
