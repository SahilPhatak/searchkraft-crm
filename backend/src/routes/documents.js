const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// Use memory storage — we stream directly to Supabase Storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB max

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAuth, async (req, res) => {
  const body = { ...req.body }
  const { data, error } = await supabase.from('documents').insert(body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('documents')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/documents/upload — upload file to Supabase Storage via backend
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `documents/${timestamp}_${safeName}`;

    const { data, error } = await supabase.storage
      .from('crm-documents')
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) return res.status(500).json({ error: error.message });

    const { data: urlData } = supabase.storage
      .from('crm-documents')
      .getPublicUrl(path);

    res.json({ url: urlData.publicUrl, path, size: req.file.size, name: req.file.originalname });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
