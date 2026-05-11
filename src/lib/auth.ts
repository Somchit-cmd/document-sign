import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId: string | null;
  jobTitle: string | null;
  isActive: boolean;
}

/**
 * Extract and validate Bearer token from Authorization header.
 * Returns the user if valid, null otherwise.
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) return null;

    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.user || !session.user.isActive) {
      return null;
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      await db.session.delete({ where: { id: session.id } });
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      departmentId: session.user.departmentId,
      jobTitle: session.user.jobTitle,
      isActive: session.user.isActive,
    };
  } catch {
    return null;
  }
}

/**
 * Create a new session for a user.
 */
export async function createSession(
  userId: string,
  request: Request
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Parse device info from request
  const userAgent = request.headers.get('user-agent') || undefined;
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    request.headers.get('x-real-ip') || undefined;

  let device = 'Unknown';
  let browser = 'Unknown';
  if (userAgent) {
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Mobile')) device = 'Mobile';
    else if (userAgent.includes('Tablet')) device = 'Tablet';
    else device = 'Desktop';
  }

  await db.session.create({
    data: {
      userId,
      token,
      device,
      browser,
      ipAddress,
      expiresAt,
    },
  });

  // Update user last login
  await db.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    },
  });

  return { token, expiresAt };
}

/**
 * Create an audit log entry.
 */
export async function createAuditLog(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string,
  request: Request,
  details?: string,
  severity: string = 'info'
): Promise<void> {
  try {
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      request.headers.get('x-real-ip') || undefined;

    await db.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        severity,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Check if user has required role.
 */
export function hasRole(user: AuthUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if user is admin (super_admin or system_admin).
 */
export function isAdmin(user: AuthUser): boolean {
  return ['super_admin', 'system_admin'].includes(user.role);
}

/**
 * Parse pagination params from URL search params.
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
