import supabase from './db-client.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { email } = req.query;
      let q = supabase.from('profiles').select('*').order('id', { ascending: true });
      if (email) q = q.eq('email', email);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { email } = req.body;
      const { data: existing } = await supabase.from('profiles').select('*').eq('email', email);
      if (existing && existing.length > 0) return res.status(200).json(existing[0]);
      const { data, error } = await supabase.from('profiles').insert(req.body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { email, ...rest } = req.body;
      const { data, error } = await supabase.from('profiles').update(rest).eq('email', email).select();
      if (error) throw error;
      return res.status(200).json(data);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) { console.error('profiles API:', err); return res.status(500).json({ error: err.message }); }
}
