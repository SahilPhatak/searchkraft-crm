import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';

export async function getDashboardKPIs(req: AuthRequest, res: Response) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Last quarter
  const q = Math.floor(now.getMonth() / 3);
  const lastQStart = new Date(now.getFullYear(), (q - 1) * 3, 1);
  const lastQEnd   = new Date(now.getFullYear(), q * 3, 0, 23, 59, 59);

  const [
    dealsThisMonth,
    revenueThisMonth,
    overdueTasks,
    lastQDeals,
    lastQLeads,
    totalPipeline,
    dealsByStage,
  ] = await Promise.all([
    // Deals created this month
    prisma.deal.count({ where: { createdAt: { gte: thisMonthStart, lte: thisMonthEnd } } }),

    // Revenue this month (Closed Won)
    prisma.deal.aggregate({
      where: { stage: 'CLOSED_WON', wonAt: { gte: thisMonthStart, lte: thisMonthEnd } },
      _sum: { amount: true },
    }),

    // Overdue tasks
    prisma.task.count({
      where: { status: { not: 'DONE' }, dueDate: { lt: now } },
    }),

    // Last quarter deals (for performance)
    prisma.deal.findMany({
      where: { createdAt: { gte: lastQStart, lte: lastQEnd } },
      select: { stage: true, amount: true, createdAt: true },
    }),

    // Last quarter leads
    prisma.lead.count({ where: { createdAt: { gte: lastQStart, lte: lastQEnd } } }),

    // Total pipeline value (open deals)
    prisma.deal.aggregate({
      where: { stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      _sum: { amount: true },
    }),

    // Deals by stage (pipeline)
    prisma.deal.groupBy({ by: ['stage'], _count: true, _sum: { amount: true } }),
  ]);

  const lastQRevenue = lastQDeals
    .filter(d => d.stage === 'CLOSED_WON')
    .reduce((a, d) => a + Number(d.amount || 0), 0);

  res.json({
    dealsCreatedThisMonth: dealsThisMonth,
    revenueThisMonth: Number(revenueThisMonth._sum.amount || 0),
    overdueTasks,
    totalPipelineValue: Number(totalPipeline._sum.amount || 0),
    lastQuarter: {
      dealsCreated: lastQDeals.length,
      dealsWon: lastQDeals.filter(d => d.stage === 'CLOSED_WON').length,
      dealsLost: lastQDeals.filter(d => d.stage === 'CLOSED_LOST').length,
      leadsCreated: lastQLeads,
      revenue: lastQRevenue,
      winRate: lastQDeals.length
        ? Math.round((lastQDeals.filter(d => d.stage === 'CLOSED_WON').length / lastQDeals.length) * 100)
        : 0,
    },
    pipelineByStage: dealsByStage.map(s => ({
      stage: s.stage,
      count: s._count,
      value: Number(s._sum.amount || 0),
    })),
  });
}
