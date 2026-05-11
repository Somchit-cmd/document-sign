import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, isAdmin, createAuditLog } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const category = request.nextUrl.searchParams.get('category');

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;

    const templates = await db.workflowTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('List workflow templates error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, type, category, steps } = body;

    if (!name || !steps) {
      return NextResponse.json(
        { success: false, error: 'Name and steps are required' },
        { status: 400 }
      );
    }

    const template = await db.workflowTemplate.create({
      data: {
        name,
        description,
        type: type || 'sequential',
        category,
        steps: typeof steps === 'string' ? steps : JSON.stringify(steps),
      },
    });

    await createAuditLog(user.id, 'workflow_template.create', 'workflow_template', template.id, request, `Created workflow template: ${name}`);

    return NextResponse.json(
      { success: true, data: template },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create workflow template error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
