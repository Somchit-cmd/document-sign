import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditLog } from '@/lib/auth';
import { mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

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
    const { title, description, folderId } = body;

    // Get template
    const template = await db.template.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create document from template
    const documentTitle = title || `${template.name} - Copy`;

    // Copy the file if it exists
    let filePath = template.filePath;
    let fileName = template.fileName;
    let fileSize = 0;

    try {
      const sourcePath = path.join(process.cwd(), template.filePath);
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await mkdir(uploadsDir, { recursive: true });
      const uniqueFileName = `${Date.now()}-${fileName}`;
      const destPath = path.join(uploadsDir, uniqueFileName);
      
      if (existsSync(sourcePath)) {
        await copyFile(sourcePath, destPath);
        filePath = `/uploads/${uniqueFileName}`;
      }
    } catch {
      // File copy failed, use template path
    }

    const document = await db.document.create({
      data: {
        title: documentTitle,
        description: description || template.description,
        fileName,
        filePath,
        fileSize,
        fileType: template.fileType,
        mimeType: 'application/pdf',
        category: template.category,
        tags: template.tags,
        status: 'draft',
        creatorId: user.id,
        folderId: folderId || null,
        isTemplate: false,
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Create fields from template
    if (template.fields) {
      try {
        const templateFields = JSON.parse(template.fields);
        if (Array.isArray(templateFields)) {
          for (const field of templateFields) {
            await db.documentField.create({
              data: {
                documentId: document.id,
                type: field.type,
                label: field.label,
                required: field.required ?? true,
                page: field.page ?? 1,
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
                options: field.options ? JSON.stringify(field.options) : undefined,
                fontSize: field.fontSize,
                fontFamily: field.fontFamily,
              },
            });
          }
        }
      } catch {
        // Invalid JSON fields, skip
      }
    }

    // Update template usage count
    await db.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    // Create document activity
    await db.documentActivity.create({
      data: {
        documentId: document.id,
        userId: user.id,
        action: 'created',
        details: `Document created from template "${template.name}"`,
      },
    });

    await createAuditLog(user.id, 'template.use', 'template', id, request, `Created document from template: ${template.name}`);

    return NextResponse.json(
      { success: true, data: document },
      { status: 201 }
    );
  } catch (error) {
    console.error('Use template error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
