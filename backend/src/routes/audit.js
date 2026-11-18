const express = require('express');
const router  = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// GET /api/audit — recent 200 audit log entries
router.get('/', requireAuth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 200;
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/audit — log an audit entry
router.post('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .insert(req.body)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/audit/user/:userId — delete all audit logs for a user (used before deleting a user)
router.delete('/user/:userId', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('audit_logs')
    .delete()
    .eq('user_id', req.params.userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
