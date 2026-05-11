import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, parsePagination, createAuditLog } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams);
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [templates, total] = await Promise.all([
      db.template.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.template.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;
    const variables = formData.get('variables') as string;
    const fields = formData.get('fields') as string;
    const isPublic = formData.get('isPublic') as string;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    let fileName = 'template';
    let filePath = '';
    let fileType = 'pdf';

    if (file) {
      fileName = file.name;
      fileType = fileName.split('.').pop() || 'pdf';

      const uploadsDir = path.join(process.cwd(), 'uploads', 'templates');
      await mkdir(uploadsDir, { recursive: true });

      const uniqueFileName = `${Date.now()}-${fileName}`;
      filePath = `/uploads/templates/${uniqueFileName}`;
      const fullPath = path.join(uploadsDir, uniqueFileName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, buffer);
    }

    const template = await db.template.create({
      data: {
        name,
        description,
        category,
        tags,
        filePath,
        fileName,
        fileType,
        variables,
        fields,
        isPublic: isPublic === 'true',
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    await createAuditLog(user.id, 'template.create', 'template', template.id, request, `Created template: ${name}`);

    return NextResponse.json(
      { success: true, data: template },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
