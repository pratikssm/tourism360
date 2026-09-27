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
    //
    // ADMIN / SUPER_ADMIN -> ALL REVIEWS
    // NORMAL USER -> APPROVED REVIEWS + OWN REVIEW
    // =========================================================
    if (req.method === 'GET') {
      const { item_type, item_title } = req.query;

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
        .from('reviews')
        .select('*')
        .order('id', { ascending: false });

      if (item_type) {
        query = query.eq('item_type', item_type);
      }

      if (item_title) {
        query = query.eq('item_title', item_title);
      }

      const { data: reviews, error } = await query;

      if (error) {
        throw error;
      }

      // Admin can see all reviews.
      if (isAdmin) {
        return res.status(200).json(reviews || []);
      }

      // Normal users can see approved reviews
      // and their own review.
      const filteredReviews = (reviews || []).filter(
        (review) =>
          review.moderation_status === 'APPROVED' ||
          review.user_id === user.id
      );

      return res.status(200).json(filteredReviews);
    }

    // =========================================================
    // POST
    // CREATE REVIEW FOR AUTHENTICATED USER
    // =========================================================
    if (req.method === 'POST') {
      const body = req.body || {};

      // Never trust identity or moderation fields
      // from the frontend.
      const {
        id,
        user_id,
        user_email,
        moderation_status,
        verified_booking,
        ...reviewData
      } = body;

      const review = {
        ...reviewData,
        user_id: user.id,
        user_email: user.email,
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json(data);
    }

    // =========================================================
    // GET CURRENT USER ROLE
    // REQUIRED FOR PUT / DELETE
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
    // -> Can update any review
    // -> Can update moderation fields
    //
    // NORMAL USER
    // -> Can update only own review
    // -> Cannot update moderation fields
    // =========================================================
    if (req.method === 'PUT') {
      const body = req.body || {};

      const {
        id,
        user_id,
        user_email,
        ...incomingData
      } = body;

      if (!id) {
        return res.status(400).json({
          error: 'Review id is required',
        });
      }

      let updateData;

      if (isAdmin) {
        // Admin can manage review and moderation fields.
        updateData = {
          ...incomingData,
        };
      } else {
        // Normal user cannot modify moderation/security fields.
        const {
          moderation_status,
          verified_booking,
          ...userUpdates
        } = incomingData;

        updateData = userUpdates;
      }

      let query = supabase
        .from('reviews')
        .update(updateData)
        .eq('id', id);

      // Normal user can update only own review.
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
          error: 'Review not found',
        });
      }

      return res.status(200).json({
        ok: true,
        data,
      });
    }

    // =========================================================
    // DELETE
    //
    // ADMIN / SUPER_ADMIN
    // -> Can delete any review
    //
    // NORMAL USER
    // -> Can delete only own review
    // =========================================================
    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({
          error: 'Review id is required',
        });
      }

      let query = supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      // Normal user can delete only own review.
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: 'Review not found',
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
    console.error('reviews API:', err);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}