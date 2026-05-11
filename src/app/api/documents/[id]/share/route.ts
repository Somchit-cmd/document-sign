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
    const { userId, email, permission } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'Either userId or email is required' },
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

    // Check if already shared
    const existingShare = await db.documentShare.findFirst({
      where: { documentId: id, OR: [{ userId: userId || undefined }, { email: email || undefined }] },
    });

    if (existingShare) {
      return NextResponse.json(
        { success: false, error: 'Document already shared with this user/email' },
        { status: 409 }
      );
    }

    const share = await db.documentShare.create({
      data: {
        documentId: id,
        userId: userId || undefined,
        email: email || undefined,
        permission: permission || 'view',
      },
    });

    // Create notification for shared user
    if (userId) {
      await db.notification.create({
        data: {
          userId,
          type: 'document_shared',
          title: 'Document Shared With You',
          message: `"${document.title}" has been shared with you`,
          link: `/documents/${id}`,
        },
      });
    }

    // Create document activity
    await db.documentActivity.create({
      data: {
        documentId: id,
        userId: user.id,
        action: 'shared',
        details: `Document shared with ${email || userId}`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
      },
    });

    await createAuditLog(user.id, 'document.share', 'document', id, request, `Shared document "${document.title}"`);

    return NextResponse.json(
      { success: true, data: share },
      { status: 201 }
    );
  } catch (error) {
    console.error('Share document error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
