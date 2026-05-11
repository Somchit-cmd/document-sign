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

    // Get the workflow step
    const step = await db.approvalStep.findUnique({
      where: { id: stepId },
      include: { workflow: { include: { document: true, steps: { orderBy: { stepOrder: 'asc' } } } } },
    });

    if (!step || step.workflowId !== id) {
      return NextResponse.json(
        { success: false, error: 'Workflow step not found' },
        { status: 404 }
      );
    }

    // Check if user is the approver
    if (step.approverId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You are not the assigned approver for this step' },
        { status: 403 }
      );
    }

    if (step.status !== 'pending' && step.status !== 'in_review') {
      return NextResponse.json(
        { success: false, error: `Step cannot be approved - current status: ${step.status}` },
        { status: 400 }
      );
    }

    // Update the step
    const updatedStep = await db.approvalStep.update({
      where: { id: stepId },
      data: {
        status: 'approved',
        comments: comments || undefined,
        actionDate: new Date(),
      },
    });

    const workflow = step.workflow;

    // Check if all steps are complete for sequential workflow
    const allSteps = await db.approvalStep.findMany({
      where: { workflowId: id },
      orderBy: { stepOrder: 'asc' },
    });

    const pendingSteps = allSteps.filter((s) => s.status === 'pending' || s.status === 'in_review');

    if (workflow.type === 'sequential') {
      // For sequential, activate next step
      const currentOrder = step.stepOrder;
      const nextStep = allSteps.find((s) => s.stepOrder > currentOrder && s.status === 'pending');

      if (nextStep) {
        // Notify next approver
        await db.notification.create({
          data: {
            userId: nextStep.approverId,
            type: 'approval_request',
            title: 'Approval Request',
            message: `You have been requested to review "${workflow.document.title}"`,
            link: `/documents/${workflow.documentId}`,
          },
        });
      }
    }

    // If no more pending steps, complete the workflow
    if (pendingSteps.length === 0) {
      await db.workflow.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() },
      });

      // Update document status based on workflow type
      const allApproved = allSteps.every((s) => s.status === 'approved');
      if (allApproved) {
        // Check if document needs signatures
        const sigCount = await db.signature.count({
          where: { documentId: workflow.documentId, status: 'pending' },
        });
        if (sigCount > 0) {
          await db.document.update({
            where: { id: workflow.documentId },
            data: { status: 'pending_signature' },
          });
        } else {
          await db.document.update({
            where: { id: workflow.documentId },
            data: { status: 'completed' },
          });
        }

        // Notify document creator
        await db.notification.create({
          data: {
            userId: workflow.document.creatorId,
            type: 'workflow_completed',
            title: 'Workflow Completed',
            message: `All approvals completed for "${workflow.document.title}"`,
            link: `/documents/${workflow.documentId}`,
          },
        });
      }
    } else if (workflow.status === 'pending') {
      // Update workflow status to in_progress
      await db.workflow.update({
        where: { id },
        data: { status: 'in_progress' },
      });
    }

    // Create document activity
    await db.documentActivity.create({
      data: {
        documentId: workflow.documentId,
        userId: user.id,
        action: 'approved',
        details: `Step ${step.stepOrder} approved by ${user.name}${comments ? ': ' + comments : ''}`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
      },
    });

    await createAuditLog(user.id, 'workflow.approve', 'workflow', id, request, `Approved step ${step.stepOrder} of workflow "${workflow.name}"`);

    return NextResponse.json({
      success: true,
      data: { step: updatedStep, workflowCompleted: pendingSteps.length === 0 },
    });
  } catch (error) {
    console.error('Approve workflow step error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
