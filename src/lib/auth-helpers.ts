import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Retrieve the current session user, or `null` if unauthenticated.
 */
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

/**
 * Require an authenticated user. Returns a discriminated union:
 * - `{ error: NextResponse, user: null }` on failure (401)
 * - `{ error: null, user }` on success
 */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    };
  }
  return { error: null, user };
}

/**
 * Require an authenticated user with a specific role. Returns 401 if not
 * authenticated, 403 if the role does not match.
 */
export async function requireRole(requiredRole: string) {
  const { error, user } = await requireAuth();
  if (error) return { error, user: null };

  if (user!.role !== requiredRole) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      user: null,
    };
  }
  return { error: null, user: user! };
}

/**
 * Convenience helper — returns the current user's clinicId, or `null`.
 */
export async function getClinicId() {
  const user = await getSessionUser();
  return user?.clinicId || null;
}
