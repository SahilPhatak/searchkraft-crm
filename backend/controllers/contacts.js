const prisma = require('../config/db');

async function getContacts(req, res) {
  const { search, company, page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (company) where.company = { contains: company, mode: 'insensitive' };
  if (search) where.OR = [
    { name:  { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search, mode: 'insensitive' } },
  ];

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
    prisma.contact.count({ where }),
  ]);

  res.json({ contacts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

async function getContact(req, res) {
  const contact = await prisma.contact.findUnique({ where: { id: req.params.id } });
  if (!contact) return res.status(404).json({ error: 'Contact not found' });
  res.json(contact);
}

async function createContact(req, res) {
  const contact = await prisma.contact.create({ data: req.body });
  res.status(201).json(contact);
}

async function updateContact(req, res) {
  const contact = await prisma.contact.update({ where: { id: req.params.id }, data: req.body });
  res.json(contact);
}

async function deleteContact(req, res) {
  await prisma.contact.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { getContacts, getContact, createContact, updateContact, deleteContact };
