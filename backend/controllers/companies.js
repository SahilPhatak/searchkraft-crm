const prisma = require('../config/db');

async function getCompanies(req, res) {
  const { search, page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = search
    ? { name: { contains: search, mode: 'insensitive' } }
    : {};

  const [companies, total] = await Promise.all([
    prisma.company.findMany({ where, skip, take: parseInt(limit), orderBy: { name: 'asc' } }),
    prisma.company.count({ where }),
  ]);

  res.json({ companies, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

async function getCompany(req, res) {
  const company = await prisma.company.findUnique({
    where: { id: req.params.id },
    // No relations defined in schema — contacts/deals linked via companyId
  });
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json(company);
}

async function createCompany(req, res) {
  const company = await prisma.company.create({ data: req.body });
  res.status(201).json(company);
}

async function updateCompany(req, res) {
  const company = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
  res.json(company);
}

async function deleteCompany(req, res) {
  await prisma.company.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}

module.exports = { getCompanies, getCompany, createCompany, updateCompany, deleteCompany };
