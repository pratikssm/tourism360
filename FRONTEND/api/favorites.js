import supabase from './db-client.js';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { user_email } = req.query;
      let q = supabase.from('favorites').select('*').order('id', { ascending: false });
      if (user_email) q = q.eq('user_email', user_email);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const { data, error } = await supabase.from('favorites').insert(req.body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id, user_email, item_type, item_id } = req.body;
      let q = supabase.from('favorites').delete();
      if (id) q = q.eq('id', id);
      else q = q.eq('user_email', user_email).eq('item_type', item_type).eq('item_id', String(item_id));
      const { error } = await q;
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) { console.error('favorites API:', err); return res.status(500).json({ error: err.message }); }
}
