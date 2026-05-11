import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    // Calculate storage from database
    const documents = await db.document.findMany({
      where: { status: { not: 'archived' } },
      select: { fileSize: true, category: true },
    });

    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    const maxStorage = 10 * 1024 * 1024 * 1024; // 10GB

    // Storage by category
    const storageByCategory: Record<string, number> = {};
    for (const doc of documents) {
      const cat = doc.category || 'uncategorized';
      storageByCategory[cat] = (storageByCategory[cat] || 0) + doc.fileSize;
    }

    // Count files in uploads directory
    let uploadsFileCount = 0;
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const files = await readdir(uploadsDir, { recursive: true });
      uploadsFileCount = files.length;
    } catch {
      // Directory doesn't exist yet
    }

    return NextResponse.json({
      success: true,
      data: {
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        maxStorage,
        maxStorageFormatted: formatBytes(maxStorage),
        usagePercent: (totalSize / maxStorage) * 100,
        totalFiles: documents.length,
        uploadsFileCount,
        storageByCategory: Object.entries(storageByCategory).map(([category, size]) => ({
          category,
          size,
          sizeFormatted: formatBytes(size),
        })),
      },
    });
  } catch (error) {
    console.error('Get admin storage error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
