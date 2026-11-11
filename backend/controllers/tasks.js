const prisma = require('../config/db');

async function getTasks(req, res) {
  const { status, owner, leadId, dealId, page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (status)  where.status  = status;
  if (owner)   where.ownerId = owner;
  if (leadId)  where.leadId  = leadId;
  if (dealId)  where.dealId  = dealId;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({ where, skip, take: parseInt(limit), orderBy: { dueDate: 'asc' } }),
    prisma.task.count({ where }),
  ]);

  res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

async function getTask(req, res) {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
}

async function createTask(req, res) {
  const task = await prisma.task.create({ data: req.body });
  res.status(201).json(task);
}

async function updateTask(req, res) {
  const task = await prisma.task.update({ where: { id: req.params.id }, data: req.body });
  res.json(task);
}

async function deleteTask(req, res) {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
