import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, isAdmin, createAuditLog } from '@/lib/auth';

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
    const targetUser = await db.user.findUnique({
      where: { id },
      include: {
        department: true,
        managedDepartment: true,
        _count: {
          select: {
            documents: true,
            signatures: true,
            approvals: true,
            comments: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: targetUser,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Users can update their own profile, admins can update anyone
    if (user.id !== id && !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, jobTitle, phone, role, departmentId, avatarUrl, mfaEnabled } = body;

    // Only admins can change role and departmentId
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (phone !== undefined) updateData.phone = phone;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (isAdmin(user)) {
      if (role !== undefined) updateData.role = role;
      if (departmentId !== undefined) updateData.departmentId = departmentId;
    }

    if (mfaEnabled !== undefined) updateData.mfaEnabled = mfaEnabled;

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      include: { department: { select: { id: true, name: true, code: true } } },
    });

    await createAuditLog(user.id, 'user.update', 'user', id, request, `Updated user ${updatedUser.name}`);

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Soft delete - deactivate user
    const deactivated = await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Delete all sessions for this user
    await db.session.deleteMany({ where: { userId: id } });

    await createAuditLog(user.id, 'user.deactivate', 'user', id, request, `Deactivated user ${deactivated.name}`);

    return NextResponse.json({
      success: true,
      data: { message: 'User deactivated successfully' },
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
