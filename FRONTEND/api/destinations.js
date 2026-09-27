import supabase from './db-client.js';
import { requireAuth } from './auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
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
    // GET — PUBLIC
    // Login is NOT required for reading destinations.
    // =========================================================
    if (req.method === 'GET') {
      const { slug, search } = req.query;

      let query = supabase
        .from('destinations')
        .select('*')
        .order('name', { ascending: true });

      if (slug) {
        query = query.eq('slug', slug);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      let out = data || [];

      if (search) {
        const s = String(search).toLowerCase();

        out = out.filter((destination) =>
          [
            destination.name,
            destination.state,
            destination.country,
            destination.description,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(s)
        );
      }

      return res.status(200).json(out);
    }

    // =========================================================
    // POST / PUT / DELETE
    // Everything below this point requires authentication.
    // =========================================================
    const user = await requireAuth(req, res);

    if (!user) {
      return;
    }

    // =========================================================
    // ADMIN CHECK
    // =========================================================
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
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

    // =========================================================
    // POST — ADMIN ONLY
    // =========================================================
    if (req.method === 'POST') {
      const body = req.body || {};

      const { data, error } = await supabase
        .from('destinations')
        .insert(body)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json(data);
    }

    // =========================================================
    // PUT — ADMIN ONLY
    // =========================================================
    if (req.method === 'PUT') {
      const {
        id,
        ...rest
      } = req.body || {};

      if (!id) {
        return res.status(400).json({
          error: 'Destination id is required',
        });
      }

      const { data, error } = await supabase
        .from('destinations')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({
          error: 'Destination not found',
        });
      }

      return res.status(200).json(data);
    }

    // =========================================================
    // DELETE — ADMIN ONLY
    // =========================================================
    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({
          error: 'Destination id is required',
        });
      }

      const { data, error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: 'Destination not found',
        });
      }

      return res.status(200).json({
        ok: true,
      });
    }

    return res.status(405).json({
      error: 'Method not allowed',
    });
  } catch (err) {
    console.error('destinations API:', err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}