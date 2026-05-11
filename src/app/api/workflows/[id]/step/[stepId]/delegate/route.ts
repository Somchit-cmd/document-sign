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
    const { delegateToUserId, reason } = body;

    if (!delegateToUserId) {
      return NextResponse.json(
        { success: false, error: 'Delegate user ID is required' },
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
        { success: false, error: `Step cannot be delegated - current status: ${step.status}` },
        { status: 400 }
      );
    }

    // Verify delegate user exists
    const delegateUser = await db.user.findUnique({ where: { id: delegateToUserId } });
    if (!delegateUser || !delegateUser.isActive) {
      return NextResponse.json(
        { success: false, error: 'Delegate user not found or inactive' },
        { status: 404 }
      );
    }

    // Update the step with delegation
    const updatedStep = await db.approvalStep.update({
      where: { id: stepId },
      data: {
        delegatedTo: delegateToUserId,
        comments: reason ? `Delegated by ${user.name}: ${reason}` : `Delegated by ${user.name}`,
      },
    });

    // Create a new approval step for the delegate
    await db.approvalStep.create({
      data: {
        workflowId: id,
        stepOrder: step.stepOrder + 100, // Add after current step ordering
        stepType: 'approval',
        approverId: delegateToUserId,
        status: 'pending',
        dueDate: step.dueDate,
      },
    });

    // Notify delegate user
    await db.notification.create({
      data: {
        userId: delegateToUserId,
        type: 'approval_request',
        title: 'Delegated Approval Request',
        message: `${user.name} has delegated their approval of "${step.workflow.document.title}" to you`,
        link: `/documents/${step.workflow.documentId}`,
      },
    });

    await createAuditLog(user.id, 'workflow.delegate', 'workflow', id, request, `Delegated step ${step.stepOrder} to ${delegateUser.name}`);

    return NextResponse.json({
      success: true,
      data: { step: updatedStep },
    });
  } catch (error) {
    console.error('Delegate workflow step error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
