import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get full user details
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        department: true,
        managedDepartment: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        role: fullUser.role,
        avatarUrl: fullUser.avatarUrl,
        departmentId: fullUser.departmentId,
        jobTitle: fullUser.jobTitle,
        phone: fullUser.phone,
        isActive: fullUser.isActive,
        mfaEnabled: fullUser.mfaEnabled,
        lastLoginAt: fullUser.lastLoginAt,
        createdAt: fullUser.createdAt,
        department: fullUser.department ? { id: fullUser.department.id, name: fullUser.department.name, code: fullUser.department.code } : null,
        managedDepartment: fullUser.managedDepartment ? { id: fullUser.managedDepartment.id, name: fullUser.managedDepartment.name, code: fullUser.managedDepartment.code } : null,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
