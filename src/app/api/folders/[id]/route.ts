import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditLog } from '@/lib/auth';

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
    const body = await request.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const folder = await db.folder.findUnique({ where: { id } });
    if (!folder) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Prevent circular reference
    if (parentId === id) {
      return NextResponse.json(
        { success: false, error: 'Folder cannot be its own parent' },
        { status: 400 }
      );
    }

    const updated = await db.folder.update({
      where: { id },
      data: {
        name,
        parentId: parentId !== undefined ? parentId : folder.parentId,
      },
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    await createAuditLog(user.id, 'folder.update', 'folder', id, request, `Updated folder: ${name}`);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update folder error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
