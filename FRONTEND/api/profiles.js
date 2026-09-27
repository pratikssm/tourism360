import supabase from './db-client.js';
import { requireAuth } from './auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // ---------------------------------------------------------
    // AUTHENTICATION
    // ---------------------------------------------------------
    const user = await requireAuth(req, res);

    if (!user) {
      return;
    }

    // ---------------------------------------------------------
    // GET
    // ADMIN / SUPER_ADMIN -> all profiles
    // NORMAL USER -> current user's profile
    // ---------------------------------------------------------
    if (req.method === 'GET') {
      // Get the authenticated user's profile first
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Profile not found',
          });
        }

        throw profileError;
      }

      // -------------------------------------------------------
      // ADMIN USER LIST
      // -------------------------------------------------------
      if (
        currentProfile.role === 'ADMIN' ||
        currentProfile.role === 'SUPER_ADMIN'
      ) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        return res.status(200).json(data || []);
      }

      // -------------------------------------------------------
      // NORMAL USER
      // -------------------------------------------------------
      return res.status(200).json(currentProfile);
    }

    // ---------------------------------------------------------
    // POST — create/update current user's profile
    // ---------------------------------------------------------
    if (req.method === 'POST') {
      const body = req.body || {};

      // Never trust identity/security fields from frontend
      const {
        id,
        email,
        role,
        status,
        ...profileData
      } = body;

      const profile = {
        ...profileData,
        id: user.id,
        email: user.email,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(200).json(data);
    }

    // ---------------------------------------------------------
    // PUT — update current user's profile
    // ---------------------------------------------------------
    if (req.method === 'PUT') {
      const body = req.body || {};

      // These fields must not be changed by normal users
      const {
        id,
        email,
        role,
        status,
        ...updates
      } = body;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({
          error: 'Profile not found',
        });
      }

      return res.status(200).json(data);
    }

    // ---------------------------------------------------------
    // METHOD NOT ALLOWED
    // ---------------------------------------------------------
    return res.status(405).json({
      error: 'Method not allowed',
    });
  } catch (err) {
    console.error('profiles API:', err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}