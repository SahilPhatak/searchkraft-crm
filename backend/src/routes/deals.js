const express = require('express');
const router  = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { sendDealCreatedEmail, sendDealWonEmail } = require('../services/emailService');

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// GET email notifications for a deal
router.get('/:id/notifications', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('email_notifications')
    .select('*')
    .eq('deal_id', req.params.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

router.post('/', requireAuth, async (req, res) => {
  const body = { ...req.body }
  // Always use insert on POST — the frontend may send a client-generated id
  // but upsert can return multiple rows if the id already exists, breaking .single()
  // Strip the id so Supabase generates a fresh one (or keep it if truly desired)
  // We keep the id so the frontend local DB stays in sync, but force insert not upsert
  const { data, error } = await supabase.from('deals').insert(body).select().single();
  if (error) return res.status(400).json({ error: error.message });

  // Send emails BEFORE responding — Render free tier kills async work after response
  try { await sendDealCreatedEmail(data); } catch(err) { console.error('[Email] sendDealCreatedEmail failed:', err.message); }
  if (data.stage === 'Won' && (data.delivery_pillar_id || data.delivery_pillar)) {
    try { await sendDealWonEmail(data); } catch(err) { console.error('[Email] sendDealWonEmail failed:', err.message); }
  }

  res.status(201).json(data);
});

router.put('/:id', requireAuth, async (req, res) => {
  // Fetch existing deal to compare stage/delivery_pillar before update
  const { data: existing } = await supabase
    .from('deals').select('stage, delivery_pillar_id, delivery_pillar').eq('id', req.params.id).single();

  const { data, error } = await supabase
    .from('deals')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);

  // Check if deal_won_delivery trigger conditions are now met
  const wasWon = existing?.stage === 'Won';
  const isNowWon = data.stage === 'Won';
  const hadDelivery = !!(existing?.delivery_pillar_id || existing?.delivery_pillar);
  const hasDelivery = !!(data.delivery_pillar_id || data.delivery_pillar);

  const triggerWonEmail = isNowWon && hasDelivery && (!wasWon || !hadDelivery);
  if (triggerWonEmail) {
    sendDealWonEmail(data).catch(() => {});
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// POST retry a failed notification (admin)
router.post('/notifications/:notifId/retry', requireAuth, async (req, res) => {
  try {
    const { retryNotification } = require('../services/emailService');
    await retryNotification(req.params.notifId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
