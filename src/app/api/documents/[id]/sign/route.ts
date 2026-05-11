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
    const { signatureData, signatureType, fieldId, reason } = body;

    // Check document exists and is signable
    const document = await db.document.findUnique({
      where: { id },
      include: { signatures: true },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.status === 'archived' || document.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Document cannot be signed in current status' },
        { status: 400 }
      );
    }

    // Find the pending signature for this user
    const signature = await db.signature.findFirst({
      where: {
        documentId: id,
        signerId: user.id,
        status: 'pending',
      },
    });

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'No pending signature found for this user on this document' },
        { status: 404 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Update the signature
    const updatedSignature = await db.signature.update({
      where: { id: signature.id },
      data: {
        status: 'signed',
        signatureData: signatureData || 'electronic',
        type: signatureType || 'electronic',
        ipAddress,
        userAgent,
        signedAt: new Date(),
        reason: reason || undefined,
        fieldId: fieldId || undefined,
      },
    });

    // Create document activity
    await db.documentActivity.create({
      data: {
        documentId: id,
        userId: user.id,
        action: 'signed',
        details: `Document signed by ${user.name}`,
        ipAddress,
        userAgent,
      },
    });

    // Check if all signatures are now complete
    const allSignatures = await db.signature.findMany({
      where: { documentId: id },
    });

    const allSigned = allSignatures.every((s) => s.status === 'signed');

    if (allSigned) {
      // Update document status
      await db.document.update({
        where: { id },
        data: { status: 'signed' },
      });

      // Also complete the workflow if exists
      const workflow = await db.workflow.findUnique({ where: { documentId: id } });
      if (workflow && workflow.status !== 'completed') {
        await db.workflow.update({
          where: { id: workflow.id },
          data: { status: 'completed', completedAt: new Date() },
        });
      }

      // Notify document creator
      await db.notification.create({
        data: {
          userId: document.creatorId,
          type: 'document_signed',
          title: 'Document Fully Signed',
          message: `"${document.title}" has been signed by all parties`,
          link: `/documents/${id}`,
        },
      });
    } else {
      // Notify next signer or just update document status
      await db.document.update({
        where: { id },
        data: { status: 'pending_signature' },
      });
    }

    await createAuditLog(user.id, 'document.sign', 'document', id, request, `Signed document: ${document.title}`);

    return NextResponse.json({
      success: true,
      data: {
        signature: updatedSignature,
        allSigned,
      },
    });
  } catch (error) {
    console.error('Sign document error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
