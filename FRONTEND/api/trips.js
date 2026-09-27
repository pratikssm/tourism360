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
    // ---------------------------------------------------------
    // AUTHENTICATION
    // ---------------------------------------------------------
    const user = await requireAuth(req, res);

    if (!user) {
      return;
    }

    // ---------------------------------------------------------
    // GET — only current user's trips
    // ---------------------------------------------------------
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json(data || []);
    }

    // ---------------------------------------------------------
    // POST — create trip for authenticated user
    // ---------------------------------------------------------
    if (req.method === 'POST') {
      const body = req.body || {};

      const trip = {
        ...body,
        user_id: user.id,
        user_email: user.email,
      };

      const { data, error } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json(data);
    }

    // ---------------------------------------------------------
    // PUT — update only current user's trip
    // ---------------------------------------------------------
    if (req.method === 'PUT') {
      const {
        id,
        user_id,
        user_email,
        ...rest
      } = req.body || {};

      if (!id) {
        return res.status(400).json({
          error: 'Trip id is required',
        });
      }

      const { data, error } = await supabase
        .from('trips')
        .update(rest)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({
          error: 'Trip not found',
        });
      }

      return res.status(200).json(data);
    }

    // ---------------------------------------------------------
    // DELETE — delete only current user's trip
    // ---------------------------------------------------------
    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({
          error: 'Trip id is required',
        });
      }

      const { data, error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: 'Trip not found',
        });
      }

      return res.status(200).json({
        ok: true,
      });
    }

    // ---------------------------------------------------------
    // METHOD NOT ALLOWED
    // ---------------------------------------------------------
    return res.status(405).json({
      error: 'Method not allowed',
    });
  } catch (err) {
    console.error('trips API:', err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}