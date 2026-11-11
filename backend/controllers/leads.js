const prisma = require('../config/db');

// GET /api/leads
async function getLeads(req, res) {
  const { stage, owner, search, page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (stage)  where.stage  = stage;
  if (owner)  where.ownerId = owner;
  if (search) where.OR = [
    { name:      { contains: search, mode: 'insensitive' } },
    { firstName: { contains: search, mode: 'insensitive' } },
    { lastName:  { contains: search, mode: 'insensitive' } },
    { email:     { contains: search, mode: 'insensitive' } },
    { company:   { contains: search, mode: 'insensitive' } },
  ];

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.lead.count({ where }),
  ]);

  res.json({ leads, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

// GET /api/leads/:id
async function getLead(req, res) {
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
}

// POST /api/leads
async function createLead(req, res) {
  const lead = await prisma.lead.create({
    data: { ...req.body, ownerId: req.body.ownerId || req.user.id },
  });
  res.status(201).json(lead);
}

// PUT /api/leads/:id
async function updateLead(req, res) {
  const lead = await prisma.lead.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(lead);
}

// DELETE /api/leads/:id
async function deleteLead(req, res) {
  await prisma.lead.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { getLeads, getLead, createLead, updateLead, deleteLead };
