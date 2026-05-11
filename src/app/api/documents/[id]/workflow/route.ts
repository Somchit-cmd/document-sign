import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, parsePagination, createAuditLog } from '@/lib/auth';

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
    const workflow = await db.workflow.findUnique({
      where: { documentId: id },
      include: {
        steps: {
          include: { approver: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { stepOrder: 'asc' },
        },
        document: { select: { id: true, title: true, status: true } },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'No workflow found for this document' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Get document workflow error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { name, type, steps } = body;

    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name and steps array are required' },
        { status: 400 }
      );
    }

    // Check document exists
    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if workflow already exists
    const existingWorkflow = await db.workflow.findUnique({ where: { documentId: id } });
    if (existingWorkflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow already exists for this document' },
        { status: 409 }
      );
    }

    // Create workflow with steps
    const workflow = await db.workflow.create({
      data: {
        documentId: id,
        name,
        type: type || 'sequential',
        status: 'pending',
        steps: {
          create: steps.map((step: { stepOrder: number; stepType: string; approverId: string; dueDate?: string }) => ({
            stepOrder: step.stepOrder,
            stepType: step.stepType || 'approval',
            approverId: step.approverId,
            dueDate: step.dueDate ? new Date(step.dueDate) : undefined,
          })),
        },
      },
      include: {
        steps: {
          include: { approver: { select: { id: true, name: true, email: true } } },
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    // Update document status
    await db.document.update({
      where: { id },
      data: { status: 'pending_approval' },
    });

    // Notify first step approver
    if (workflow.steps.length > 0) {
      const firstStep = workflow.steps[0];
      await db.notification.create({
        data: {
          userId: firstStep.approverId,
          type: 'approval_request',
          title: 'Approval Request',
          message: `You have been requested to review "${document.title}"`,
          link: `/documents/${id}`,
        },
      });
    }

    await createAuditLog(user.id, 'workflow.create', 'workflow', workflow.id, request, `Created workflow "${name}" for document "${document.title}"`);

    return NextResponse.json(
      { success: true, data: workflow },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create document workflow error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
