const express = require('express');
const router  = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/leads — fetch all leads
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/leads/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// POST /api/leads — create
router.post('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('leads')
    .upsert(req.body, { onConflict: 'id' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/leads/:id — update
router.put('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('leads')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/leads/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
