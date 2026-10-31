import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';

export async function getDeals(req: AuthRequest, res: Response) {
  const { stage, owner, search, page = '1', limit = '50' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: any = {};
  if (stage)  where.stage = stage;
  if (owner)  where.ownerId = owner;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, name: true } }, account: true, contact: true } }),
    prisma.deal.count({ where }),
  ]);
  res.json({ deals, total });
}

export async function createDeal(req: AuthRequest, res: Response) {
  const deal = await prisma.deal.create({ data: { ...req.body, ownerId: req.body.ownerId || req.user!.id } });
  res.status(201).json(deal);
}

export async function updateDeal(req: AuthRequest, res: Response) {
  const deal = await prisma.deal.update({ where: { id: req.params.id }, data: req.body });
  res.json(deal);
}

export async function deleteDeal(req: AuthRequest, res: Response) {
  await prisma.deal.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}
