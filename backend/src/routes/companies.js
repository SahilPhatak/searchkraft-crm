const express = require('express');
const router  = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { sendAccountAssignedEmail } = require('../services/emailService');

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAuth, async (req, res) => {
  const body = { ...req.body }
  const { data, error } = await supabase.from('companies').insert(body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
  // Fire-and-forget: notify delivery pillar if assigned on new account
  if (data && (data.delivery_pillar_id || data.delivery_pillar)) {
    sendAccountAssignedEmail(data).catch(() => {});
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  // Fetch existing record first to detect newly assigned delivery pillar
  const { data: existing } = await supabase
    .from('companies').select('delivery_pillar_id, delivery_pillar').eq('id', req.params.id).single();

  const { data, error } = await supabase
    .from('companies')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);

  // Fire-and-forget: notify delivery pillar only if it was newly assigned (not already set before)
  const wasUnassigned = !existing?.delivery_pillar_id && !existing?.delivery_pillar;
  const nowAssigned = data && (data.delivery_pillar_id || data.delivery_pillar);
  if (wasUnassigned && nowAssigned) {
    sendAccountAssignedEmail(data).catch(() => {});
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
