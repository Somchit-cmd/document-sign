import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditLog } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all folders and build hierarchy
    const folders = await db.folder.findMany({
      include: {
        _count: { select: { documents: true, children: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Build tree structure
    const folderMap = new Map<string, Record<string, unknown>>();
    const rootFolders: Record<string, unknown>[] = [];

    for (const folder of folders) {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        documentCount: folder._count.documents,
        children: [],
      });
    }

    for (const folder of folders) {
      const node = folderMap.get(folder.id)!;
      if (folder.parentId && folderMap.has(folder.parentId)) {
        const parent = folderMap.get(folder.parentId)!;
        (parent.children as Record<string, unknown>[]).push(node);
      } else {
        rootFolders.push(node);
      }
    }

    return NextResponse.json({
      success: true,
      data: rootFolders,
    });
  } catch (error) {
    console.error('List folders error:', error);
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

    const body = await request.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const folder = await db.folder.create({
      data: { name, parentId: parentId || undefined },
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    await createAuditLog(user.id, 'folder.create', 'folder', folder.id, request, `Created folder: ${name}`);

    return NextResponse.json(
      { success: true, data: folder },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
