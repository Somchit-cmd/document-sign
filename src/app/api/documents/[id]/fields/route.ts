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
    const { fields } = body;

    if (!fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { success: false, error: 'Fields array is required' },
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

    // Batch upsert fields
    const results = [];
    for (const field of fields) {
      if (field.id) {
        // Update existing field
        const updated = await db.documentField.update({
          where: { id: field.id },
          data: {
            type: field.type,
            label: field.label,
            required: field.required,
            page: field.page,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            value: field.value,
            options: field.options,
            assigneeId: field.assigneeId,
            fontSize: field.fontSize,
            fontFamily: field.fontFamily,
          },
        });
        results.push(updated);
      } else {
        // Create new field
        const created = await db.documentField.create({
          data: {
            documentId: id,
            type: field.type,
            label: field.label,
            required: field.required ?? true,
            page: field.page ?? 1,
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            value: field.value,
            options: field.options,
            assigneeId: field.assigneeId,
            fontSize: field.fontSize,
            fontFamily: field.fontFamily,
          },
        });
        results.push(created);
      }
    }

    await createAuditLog(user.id, 'document.fields', 'document', id, request, `Updated ${results.length} fields on document "${document.title}"`);

    return NextResponse.json({
      success: true,
      data: { fields: results },
    });
  } catch (error) {
    console.error('Update document fields error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
