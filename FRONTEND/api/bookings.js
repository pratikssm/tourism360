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
    // AUTHENTICATION
    // =========================================================
    const user = await requireAuth(req, res);

    if (!user) {
      return;
    }

    // =========================================================
    // GET
    // ADMIN / SUPER_ADMIN -> ALL BOOKINGS
    // NORMAL USER -> OWN BOOKINGS ONLY
    // =========================================================
    if (req.method === 'GET') {
      const { data: currentProfile, error: profileError } =
        await supabase
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
        currentProfile.role === 'ADMIN' ||
        currentProfile.role === 'SUPER_ADMIN';

      let query = supabase
        .from('bookings')
        .select('*')
        .order('id', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json(data || []);
    }

    // =========================================================
    // POST
    // CREATE BOOKING FOR AUTHENTICATED USER
    // =========================================================
    if (req.method === 'POST') {
      const body = req.body || {};

      // Never trust identity fields from frontend
      const {
        id,
        user_id,
        user_email,
        ...bookingData
      } = body;

      const booking = {
        ...bookingData,
        user_id: user.id,
        user_email: user.email,
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json(data);
    }

    // =========================================================
    // GET CURRENT USER ROLE FOR ADMIN OPERATIONS
    // =========================================================
    const { data: currentProfile, error: profileError } =
      await supabase
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
      currentProfile.role === 'ADMIN' ||
      currentProfile.role === 'SUPER_ADMIN';

    // =========================================================
    // PUT
    //
    // ADMIN / SUPER_ADMIN
    // -> Can update any booking
    //
    // NORMAL USER
    // -> Can update only own booking
    // =========================================================
    if (req.method === 'PUT') {
      const {
        id,
        user_id,
        user_email,
        ...rest
      } = req.body || {};

      if (!id) {
        return res.status(400).json({
          error: 'Booking id is required',
        });
      }

      let query = supabase
        .from('bookings')
        .update(rest)
        .eq('id', id);

      // Normal user can only update own booking
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({
          error: 'Booking not found',
        });
      }

      return res.status(200).json(data);
    }

    // =========================================================
    // DELETE
    //
    // ADMIN / SUPER_ADMIN
    // -> Can delete any booking
    //
    // NORMAL USER
    // -> Can delete only own booking
    // =========================================================
    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({
          error: 'Booking id is required',
        });
      }

      let query = supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      // Normal user can only delete own booking
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: 'Booking not found',
        });
      }

      return res.status(200).json({
        ok: true,
      });
    }

    // =========================================================
    // METHOD NOT ALLOWED
    // =========================================================
    return res.status(405).json({
      error: 'Method not allowed',
    });
  } catch (err) {
    console.error('bookings API:', err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}