/* Tourism360 service layer — REST /api ready, Axios-compatible fetch wrappers */

import { PREVIEW_DATA } from './preview-data';
import supabase from './supabase';

const BASE = '/api';

let localDatabaseFallbackUsed = false;

export const isUsingLocalDatabaseFallback = () => localDatabaseFallbackUsed;

function getLocalPreview(path: string) {
  const url = new URL(path, 'http://localhost');
  const resource = url.pathname.split('/').filter(Boolean).pop();
  const params = url.searchParams;
  const search = (params.get('search') || '').toLowerCase();

  if (resource === 'destinations') {
    const slug = params.get('slug');

    return PREVIEW_DATA.destinations.filter(
      (item) =>
        (!slug || item.slug === slug) &&
        (!search ||
          `${item.name} ${item.state} ${item.country}`
            .toLowerCase()
            .includes(search))
    );
  }

  if (resource === 'listings') {
    return PREVIEW_DATA.listings.filter(
      (item) =>
        (!params.has('category') ||
          item.category === params.get('category')) &&
        (!params.has('city') || item.city === params.get('city')) &&
        (!params.has('destination_slug') ||
          item.destination_slug === params.get('destination_slug')) &&
        (!search ||
          `${item.title} ${item.city} ${item.description}`
            .toLowerCase()
            .includes(search))
    );
  }

  if (resource === 'events') {
    return PREVIEW_DATA.events.filter(
      (item) =>
        (!params.has('city') || item.city === params.get('city')) &&
        (!search ||
          `${item.title} ${item.city} ${item.venue} ${item.description}`
            .toLowerCase()
            .includes(search))
    );
  }

  if (
    [
      'bookings',
      'contacts',
      'favorites',
      'profiles',
      'reviews',
      'trips',
    ].includes(resource || '')
  ) {
    return [];
  }

  return undefined;
}

async function requestSupabase(path: string, opts?: RequestInit) {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured for local database access.'
    );
  }

  const url = new URL(path, 'http://localhost');
  const table = url.pathname.split('/').filter(Boolean).pop();

  if (!table) {
    throw new Error(`Invalid database API path: ${path}`);
  }

  const method = (opts?.method || 'GET').toUpperCase();

  const body = opts?.body
    ? (JSON.parse(String(opts.body)) as Record<string, unknown>)
    : {};

  if (method === 'GET') {
    let query = supabase.from(table).select('*');

    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'search') {
        query = query.eq(key, value);
      }
    }

    if (table === 'destinations') {
      query = query.order('name', { ascending: true });
    }

    if (table === 'trips') {
      query = query.order('id', { ascending: false });
    }

    if (['listings', 'events'].includes(table)) {
      query = query.order('id', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const search = (url.searchParams.get('search') || '').toLowerCase();

    if (!search) {
      return data || [];
    }

    return (data || []).filter((record) =>
      Object.values(record).some((value) =>
        String(value ?? '').toLowerCase().includes(search)
      )
    );
  }

  if (method === 'POST') {
    const { data, error } = await supabase
      .from(table)
      .insert(body)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  if (method === 'PUT') {
    const key = table === 'profiles' ? 'email' : 'id';

    const { [key]: id, ...values } = body;

    const { data, error } = await supabase
      .from(table)
      .update(values)
      .eq(key, id)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  if (method === 'DELETE') {
    let query = supabase.from(table).delete();

    const keyFields =
      table === 'favorites'
        ? ['user_email', 'item_type', 'item_id']
        : ['id'];

    for (const key of keyFields) {
      if (body[key] !== undefined) {
        query = query.eq(key, body[key]);
      }
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return { ok: true };
  }

  throw new Error(`Unsupported database API method: ${method}`);
}

/**
 * Main API request wrapper.
 *
 * Supabase Auth access token is automatically attached
 * to every REST API request when a logged-in session exists.
 */
async function req(path: string, opts?: RequestInit) {
  const method = (opts?.method || 'GET').toUpperCase();

  const headers = new Headers(opts?.headers);

  headers.set('Content-Type', 'application/json');

  /*
   * Get current Supabase Auth session.
   *
   * The access token is then forwarded to the Vercel/serverless
   * API so the backend can verify the actual logged-in user.
   */
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.set(
        'Authorization',
        `Bearer ${session.access_token}`
      );
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';

  /*
   * Development fallback:
   *
   * If Vercel API is not running locally, use direct Supabase
   * access in development.
   */
  if (!contentType.includes('application/json')) {
    if (import.meta.env.DEV && supabase) {
      localDatabaseFallbackUsed = true;

      return requestSupabase(path, opts);
    }

    if (import.meta.env.DEV && method === 'GET') {
      const preview = getLocalPreview(path);

      if (preview !== undefined) {
        return preview;
      }
    }

    throw new Error(
      `Expected JSON from ${path}; start the Vercel API runtime for live database data.`
    );
  }

  return res.json();
}

const q = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();

  Object.entries(o).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== '' &&
      value !== null
    ) {
      p.set(key, String(value));
    }
  });

  const s = p.toString();

  return s ? `?${s}` : '';
};

export const api = {
  // -------------------------------------------------------
  // DESTINATIONS
  // -------------------------------------------------------

  destinations: (filters: Record<string, unknown> = {}) =>
    req(`/destinations${q(filters)}`),

  destinationBySlug: async (slug: string) => {
    const data = await req(
      `/destinations${q({ slug })}`
    );

    return Array.isArray(data) ? data[0] : data;
  },

  saveDestination: (body: unknown) =>
    req('/destinations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // -------------------------------------------------------
  // LISTINGS
  // -------------------------------------------------------

  listings: (filters: Record<string, unknown> = {}) =>
    req(`/listings${q(filters)}`),

  saveListing: (body: unknown) =>
    req('/listings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteListing: (id: number) =>
    req('/listings', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),

  // -------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------

  events: (filters: Record<string, unknown> = {}) =>
    req(`/events${q(filters)}`),

  saveEvent: (body: unknown) =>
    req('/events', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // -------------------------------------------------------
  // TRIPS
  // -------------------------------------------------------

  trips: (email?: string) =>
    req(
      `/trips${q({
        user_email: email || '',
      })}`
    ),

  saveTrip: (body: unknown) =>
    req('/trips', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteTrip: (id: number) =>
    req('/trips', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),

  // -------------------------------------------------------
  // FAVORITES
  // -------------------------------------------------------

  favorites: (email: string) =>
    req(
      `/favorites${q({
        user_email: email,
      })}`
    ),

  addFavorite: (body: unknown) =>
    req('/favorites', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  removeFavorite: (body: unknown) =>
    req('/favorites', {
      method: 'DELETE',
      body: JSON.stringify(body),
    }),

  // -------------------------------------------------------
  // BOOKINGS
  // -------------------------------------------------------

  bookings: (email?: string) =>
    req(
      `/bookings${q({
        user_email: email || '',
      })}`
    ),

  saveBooking: (body: unknown) =>
    req('/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateBooking: (body: unknown) =>
    req('/bookings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteBooking: (id: number) =>
    req('/bookings', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),

  // -------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------

  reviews: (filters: Record<string, unknown> = {}) =>
    req(`/reviews${q(filters)}`),

  saveReview: (body: unknown) =>
    req('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteReview: (id: number) =>
    req('/reviews', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),

  // -------------------------------------------------------
  // PROFILES
  // -------------------------------------------------------

  profile: (email: string) =>
    req(
      `/profiles${q({
        email,
      })}`
    ),

  saveProfile: (body: unknown) =>
    req('/profiles', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  profiles: () => req('/profiles'),

  // -------------------------------------------------------
  // CONTACTS
  // -------------------------------------------------------

  contact: (body: unknown) =>
    req('/contacts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  contacts: () => req('/contacts'),
};

export default api;