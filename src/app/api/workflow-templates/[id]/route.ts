import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, isAdmin, createAuditLog } from '@/lib/auth';

export async function PUT(
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
    const body = await request.json();
    const { name, description, type, category, steps, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (steps !== undefined) updateData.steps = typeof steps === 'string' ? steps : JSON.stringify(steps);
    if (isActive !== undefined) updateData.isActive = isActive;

    const template = await db.workflowTemplate.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog(user.id, 'workflow_template.update', 'workflow_template', id, request, `Updated workflow template: ${template.name}`);

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Update workflow template error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
