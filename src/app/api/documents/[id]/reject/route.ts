import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditLog } from '@/lib/auth';

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
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
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

    // Update document status
    await db.document.update({
      where: { id },
      data: { status: 'rejected' },
    });

    // Update pending signatures
    await db.signature.updateMany({
      where: { documentId: id, status: 'pending' },
      data: { status: 'declined', reason },
    });

    // Update workflow if exists
    const workflow = await db.workflow.findUnique({ where: { documentId: id } });
    if (workflow) {
      await db.workflow.update({
        where: { id: workflow.id },
        data: { status: 'rejected' },
      });
      // Update pending approval steps
      await db.approvalStep.updateMany({
        where: { workflowId: workflow.id, status: 'pending' },
        data: { status: 'rejected', comments: reason, actionDate: new Date() },
      });
      await db.approvalStep.updateMany({
        where: { workflowId: workflow.id, status: 'in_review' },
        data: { status: 'rejected', comments: reason, actionDate: new Date() },
      });
    }

    // Create document activity
    await db.documentActivity.create({
      data: {
        documentId: id,
        userId: user.id,
        action: 'rejected',
        details: `Document rejected by ${user.name}: ${reason}`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
      },
    });

    // Notify document creator
    await db.notification.create({
      data: {
        userId: document.creatorId,
        type: 'document_rejected',
        title: 'Document Rejected',
        message: `"${document.title}" has been rejected by ${user.name}`,
        link: `/documents/${id}`,
      },
    });

    await createAuditLog(user.id, 'document.reject', 'document', id, request, `Rejected document "${document.title}": ${reason}`, 'warning');

    return NextResponse.json({
      success: true,
      data: { message: 'Document rejected successfully' },
    });
  } catch (error) {
    console.error('Reject document error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
