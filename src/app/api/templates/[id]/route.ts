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
    const template = await db.template.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Get template error:', error);
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
    const { name, description, category, tags, variables, fields, isPublic } = body;

    const template = await db.template.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Only creator or admin can update
    if (template.creatorId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (variables !== undefined) updateData.variables = variables;
    if (fields !== undefined) updateData.fields = fields;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updated = await db.template.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    await createAuditLog(user.id, 'template.update', 'template', id, request, `Updated template: ${updated.name}`);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
