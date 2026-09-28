import { createClient } from '@supabase/supabase-js';
import { triggerRestore } from './db-wake.js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing server Supabase configuration. Set SUPABASE_URL and SUPABASE_SECRET_KEY.'
  );
}

// Temporary diagnostic logging.
// The secret key itself is NEVER printed.
console.log('[Supabase Config]', {
  url: supabaseUrl,
  hasKey: Boolean(supabaseKey),
  keyLength: supabaseKey?.length || 0,
});

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    global: {
      fetch: async (url, options) => {
        const res = await fetch(url, options);

        if (!res.ok && res.status >= 500) {
          triggerRestore();
        }

        return res;
      },
    },
  }
);

export default supabase;