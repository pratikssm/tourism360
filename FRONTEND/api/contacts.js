import supabase from './db-client.js';
import { requireAuth } from './auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // =========================================================
    // POST — PUBLIC CONTACT FORM
    // Login is NOT required.
    // =========================================================
    if (req.method === 'POST') {
      const body = req.body || {};

      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const message = String(body.message || '').trim();

      if (!name) {
        return res.status(400).json({
          error: 'Name is required',
        });
      }

      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
        });
      }

      if (!message) {
        return res.status(400).json({
          error: 'Message is required',
        });
      }

      const contact = {
        name,
        email,
        message,
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json({
        ok: true,
        message: 'Your message has been sent successfully.',
        data,
      });
    }

    // =========================================================
    // AUTHENTICATION
    // Required from this point for admin operations.
    // =========================================================
    const user = await requireAuth(req, res);

    if (!user) {
      return;
    }

    // =========================================================
    // GET — ADMIN ONLY
    // =========================================================
    if (req.method === 'GET') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
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

      const isAdmin =
        profile.role === 'ADMIN' ||
        profile.role === 'SUPER_ADMIN';

      if (!isAdmin) {
        return res.status(403).json({
          error: 'Admin access required',
        });
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('id', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      return res.status(200).json(data || []);
    }

    // =========================================================
    // METHOD NOT ALLOWED
    // =========================================================
    return res.status(405).json({
      error: 'Method not allowed',
    });
  } catch (err) {
    console.error('contacts API:', err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}