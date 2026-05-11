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
    const document = await db.document.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true } },
        folder: { select: { id: true, name: true } },
        signatures: {
          include: { signer: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        workflow: {
          include: {
            steps: {
              include: { approver: { select: { id: true, name: true, email: true, avatarUrl: true } } },
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
        sharedWith: {
          include: {
            // If userId exists, include user info
          },
        },
        fields: {
          include: { assignee: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { comments: true, activities: true } },
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Get document error:', error);
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
    const body = await request.json();
    const { title, description, category, tags, priority, folderId, status } = body;

    // Check document exists
    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check permission - creator or admin can update
    if (existing.creatorId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (priority !== undefined) updateData.priority = priority;
    if (folderId !== undefined) updateData.folderId = folderId;
    if (status !== undefined) updateData.status = status;

    const document = await db.document.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    await createAuditLog(user.id, 'document.update', 'document', id, request, `Updated document: ${document.title}`);

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Update document error:', error);
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
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Only creator or admin can archive
    if (existing.creatorId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Soft delete - archive the document
    const document = await db.document.update({
      where: { id },
      data: { status: 'archived' },
    });

    await createAuditLog(user.id, 'document.archive', 'document', id, request, `Archived document: ${document.title}`, 'warning');

    return NextResponse.json({
      success: true,
      data: { message: 'Document archived successfully' },
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
