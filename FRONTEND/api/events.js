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
    // Anyone can view active events.
    // Login is NOT required.
    // =========================================================
    if (req.method === 'GET') {
      const { city, search } = req.query;

      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('id', { ascending: true });

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      let out = data || [];

      if (search) {
        const s = String(search).toLowerCase();

        out = out.filter((event) =>
          [
            event.title,
            event.city,
            event.venue,
            event.description,
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
    // Authentication required from this point.
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
        .from('events')
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
          error: 'Event id is required',
        });
      }

      const { data, error } = await supabase
        .from('events')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({
          error: 'Event not found',
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
          error: 'Event id is required',
        });
      }

      const { data, error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: 'Event not found',
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
    console.error('events API:', err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}