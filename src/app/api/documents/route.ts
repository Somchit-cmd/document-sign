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
    const status = request.nextUrl.searchParams.get('status');
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');
    const sort = request.nextUrl.searchParams.get('sort') || 'createdAt';
    const order = request.nextUrl.searchParams.get('order') || 'desc';
    const folderId = request.nextUrl.searchParams.get('folderId');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    } else {
      // By default, exclude archived documents
      where.status = { not: 'archived' };
    }

    if (category) {
      where.category = category;
    }

    if (folderId) {
      where.folderId = folderId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { fileName: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> = {};
    orderBy[sort] = order;

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
          folder: { select: { id: true, name: true } },
          signatures: { select: { id: true, status: true, signerId: true, signer: { select: { id: true, name: true } } } },
          workflow: { select: { id: true, status: true, name: true } },
          _count: { select: { comments: true, sharedWith: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.document.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        documents,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('List documents error:', error);
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
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;
    const priority = formData.get('priority') as string;
    const folderId = formData.get('folderId') as string;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    let fileName = 'untitled';
    let filePath = '';
    let fileSize = 0;
    let fileType = '';
    let mimeType = '';

    if (file) {
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;
      fileType = fileName.split('.').pop() || '';

      // Save file to uploads directory
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const uniqueFileName = `${Date.now()}-${fileName}`;
      filePath = `/uploads/${uniqueFileName}`;
      const fullPath = path.join(uploadsDir, uniqueFileName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, buffer);
    }

    const document = await db.document.create({
      data: {
        title,
        description,
        fileName,
        filePath,
        fileSize,
        fileType,
        mimeType,
        category,
        tags,
        priority: priority || 'normal',
        folderId,
        creatorId: user.id,
        status: 'draft',
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    // Create document activity
    await db.documentActivity.create({
      data: {
        documentId: document.id,
        userId: user.id,
        action: 'created',
        details: `Document "${title}" created`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    await createAuditLog(user.id, 'document.create', 'document', document.id, request, `Created document: ${title}`);

    return NextResponse.json(
      { success: true, data: document },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create document error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
