import supabase from './db-client.js';
import { requireAuth } from './auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, DELETE, OPTIONS'
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
    // GET — only current user's favorites
    // ---------------------------------------------------------
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json(data || []);
    }

    // ---------------------------------------------------------
    // POST — create favorite for authenticated user
    // ---------------------------------------------------------
    if (req.method === 'POST') {
      const body = req.body || {};

      const favorite = {
        ...body,
        user_id: user.id,
        user_email: user.email,
      };

      const { data, error } = await supabase
        .from('favorites')
        .insert(favorite)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json(data);
    }

    // ---------------------------------------------------------
    // DELETE — delete only current user's favorite
    // ---------------------------------------------------------
    if (req.method === 'DELETE') {
      const {
        id,
        item_type,
        item_id,
      } = req.body || {};

      let query = supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id);

      if (id) {
        query = query.eq('id', id);
      } else {
        if (!item_type || item_id === undefined || item_id === null) {
          return res.status(400).json({
            error: 'Favorite id or item details are required',
          });
        }

        query = query
          .eq('item_type', item_type)
          .eq('item_id', String(item_id));
      }

      const { data, error } = await query.select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: 'Favorite not found',
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
    console.error('favorites API:', err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}