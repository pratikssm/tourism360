import supabase from './db-client.js';

/**
 * Verify the Supabase access token sent by the frontend.
 *
 * Usage:
 * const user = await requireAuth(req, res);
 * if (!user) return;
 *
 * user.id
 * user.email
 * user.user_metadata
 */
export async function requireAuth(req, res) {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required',
    });
    return null;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    res.status(401).json({
      error: 'Authentication token missing',
    });
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Invalid or expired authentication token',
      });
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth verification error:', error);

    res.status(401).json({
      error: 'Authentication verification failed',
    });

    return null;
  }
}