import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditLog } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, stepId } = await params;
    const body = await request.json();
    const { comments } = body;

    if (!comments) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const step = await db.approvalStep.findUnique({
      where: { id: stepId },
      include: { workflow: { include: { document: true } } },
    });

    if (!step || step.workflowId !== id) {
      return NextResponse.json(
        { success: false, error: 'Workflow step not found' },
        { status: 404 }
      );
    }

    if (step.approverId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You are not the assigned approver for this step' },
        { status: 403 }
      );
    }

    if (step.status !== 'pending' && step.status !== 'in_review') {
      return NextResponse.json(
        { success: false, error: `Step cannot be rejected - current status: ${step.status}` },
        { status: 400 }
      );
    }

    // Update the step
    const updatedStep = await db.approvalStep.update({
      where: { id: stepId },
      data: {
        status: 'rejected',
        comments,
        actionDate: new Date(),
      },
    });

    // Reject the workflow
    await db.workflow.update({
      where: { id },
      data: { status: 'rejected' },
    });

    // Reject all remaining pending steps
    await db.approvalStep.updateMany({
      where: { workflowId: id, status: 'pending' },
      data: { status: 'rejected' },
    });
    await db.approvalStep.updateMany({
      where: { workflowId: id, status: 'in_review' },
      data: { status: 'rejected' },
    });

    // Update document status
    await db.document.update({
      where: { id: step.workflow.documentId },
      data: { status: 'rejected' },
    });

    // Notify document creator
    await db.notification.create({
      data: {
        userId: step.workflow.document.creatorId,
        type: 'document_rejected',
        title: 'Document Rejected',
        message: `"${step.workflow.document.title}" has been rejected at approval step ${step.stepOrder}`,
        link: `/documents/${step.workflow.documentId}`,
      },
    });

    // Create document activity
    await db.documentActivity.create({
      data: {
        documentId: step.workflow.documentId,
        userId: user.id,
        action: 'rejected',
        details: `Step ${step.stepOrder} rejected by ${user.name}: ${comments}`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
      },
    });

    await createAuditLog(user.id, 'workflow.reject', 'workflow', id, request, `Rejected step ${step.stepOrder} of workflow "${step.workflow.name}": ${comments}`, 'warning');

    return NextResponse.json({
      success: true,
      data: { step: updatedStep },
    });
  } catch (error) {
    console.error('Reject workflow step error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
