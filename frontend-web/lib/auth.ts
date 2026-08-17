import { NextRequest } from 'next/server';
import { User as AuthUser } from '@supabase/supabase-js';
import { getAdminClient } from './supabase-admin';

export async function getUserFromToken(request: NextRequest): Promise<AuthUser> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    throw new Error('No token provided');
  }

  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid token');
  }

  return user;
}

export async function getOptionalUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    return await getUserFromToken(request);
  } catch {
    return null;
  }
}

export function unauthorized(message = 'Sign in to continue') {
  return Response.json({ error: message, code: 'AUTH_REQUIRED' }, { status: 401 });
}
