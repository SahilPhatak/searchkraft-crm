const prisma = require('../config/db');

// GET /api/deals
async function getDeals(req, res) {
  const { stage, owner, search, page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (stage) where.stage = stage;
  if (owner) where.ownerId = owner;
  if (search) where.OR = [
    { title:   { contains: search, mode: 'insensitive' } },
    { company: { contains: search, mode: 'insensitive' } },
  ];

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, name: true } } },
    }),
    prisma.deal.count({ where }),
  ]);

  res.json({ deals, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

// GET /api/deals/:id
async function getDeal(req, res) {
  const deal = await prisma.deal.findUnique({
    where: { id: req.params.id },
    include: { owner: { select: { id: true, name: true } }, tasks: true, activities: true },
  });
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json(deal);
}

// POST /api/deals
async function createDeal(req, res) {
  const deal = await prisma.deal.create({
    data: { ...req.body, ownerId: req.body.ownerId || req.user.id },
  });
  res.status(201).json(deal);
}

// PUT /api/deals/:id
async function updateDeal(req, res) {
  const deal = await prisma.deal.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(deal);
}

// DELETE /api/deals/:id
async function deleteDeal(req, res) {
  await prisma.deal.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { getDeals, getDeal, createDeal, updateDeal, deleteDeal };
