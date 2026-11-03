const prisma = require('../config/db');

async function getActivities(req, res) {
  const { leadId, dealId, type, page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (leadId) where.leadId = leadId;
  if (dealId) where.dealId = dealId;
  if (type)   where.type   = type;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.activity.count({ where }),
  ]);

  res.json({ activities, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

async function createActivity(req, res) {
  const activity = await prisma.activity.create({
    data: { ...req.body, userId: req.user.id },
  });
  res.status(201).json(activity);
}

async function deleteActivity(req, res) {
  const activity = await prisma.activity.findUnique({ where: { id: req.params.id } });
  if (!activity) return res.status(404).json({ error: 'Activity not found' });
  if (activity.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Not allowed' });
  }
  await prisma.activity.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { getActivities, createActivity, deleteActivity };
