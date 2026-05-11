import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    // Check database connectivity
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    try {
      const start = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - start;
    } catch {
      dbStatus = 'unhealthy';
    }

    // Get some quick stats
    const activeSessions = await db.session.count({
      where: { expiresAt: { gt: new Date() } },
    });

    const uptime = process.uptime();

    return NextResponse.json({
      success: true,
      data: {
        status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(uptime),
          formatted: formatUptime(uptime),
        },
        database: {
          status: dbStatus,
          responseTimeMs: dbResponseTime,
        },
        memory: {
          rss: formatBytes(process.memoryUsage().rss),
          heapUsed: formatBytes(process.memoryUsage().heapUsed),
          heapTotal: formatBytes(process.memoryUsage().heapTotal),
        },
        sessions: {
          active: activeSessions,
        },
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('Get system health error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
