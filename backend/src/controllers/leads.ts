import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';

export async function getLeads(req: AuthRequest, res: Response) {
  const { stage, owner, search, page = '1', limit = '50' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: any = {};
  if (stage)  where.stage = stage;
  if (owner)  where.ownerId = owner;
  if (search) where.OR = [
    { firstName: { contains: search, mode: 'insensitive' } },
    { lastName:  { contains: search, mode: 'insensitive' } },
    { email:     { contains: search, mode: 'insensitive' } },
    { company:   { contains: search, mode: 'insensitive' } },
  ];

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, include: { owner: { select: { id: true, name: true } } } }),
    prisma.lead.count({ where }),
  ]);
  res.json({ leads, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

export async function createLead(req: AuthRequest, res: Response) {
  const data = req.body;
  const lead = await prisma.lead.create({
    data: { ...data, ownerId: data.ownerId || req.user!.id },
  });
  res.status(201).json(lead);
}

export async function updateLead(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const lead = await prisma.lead.update({ where: { id }, data: req.body });
  res.json(lead);
}

export async function deleteLead(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.lead.delete({ where: { id } });
  res.json({ success: true });
}
