import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { slug, search } = req.query;
      let q = supabase.from('destinations').select('*').order('name', { ascending: true });
      if (slug) q = supabase.from('destinations').select('*').eq('slug', slug);
      const { data, error } = await q;
      if (error) throw error;
      let out = data || [];
      if (search) {
        const s = String(search).toLowerCase();
        out = out.filter((d) => [d.name, d.state, d.country, d.description].join(' ').toLowerCase().includes(s));
      }
      return res.status(200).json(out);
    }
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('destinations').insert(req.body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...rest } = req.body;
      const { data, error } = await supabase.from('destinations').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('destinations').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('destinations API:', err);
    return res.status(500).json({ error: err.message });
  }
}
