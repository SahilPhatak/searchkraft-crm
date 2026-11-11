const prisma = require('../config/db');
const { fyStartYear } = require('../utils/format');

// Helper: Indian FY quarter boundaries
function fyQuarters(year) {
  return [
    { label: 'Q1', start: new Date(`${year}-04-01`),     end: new Date(`${year}-06-30`) },
    { label: 'Q2', start: new Date(`${year}-07-01`),     end: new Date(`${year}-09-30`) },
    { label: 'Q3', start: new Date(`${year}-10-01`),     end: new Date(`${year+1}-12-31`) },
    { label: 'Q4', start: new Date(`${year+1}-01-01`),   end: new Date(`${year+1}-03-31`) },
  ];
}

// GET /api/reports/dashboard
async function getDashboard(req, res) {
  const now    = new Date();
  const fyYear = fyStartYear(now);
  const fyStart = new Date(`${fyYear}-04-01`);
  const fyEnd   = new Date(`${fyYear + 1}-03-31`);

  // Month boundaries
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalLeads,
    leadsThisMonth,
    dealsWon,
    dealsWonThisMonth,
    openDeals,
    tasks,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: mStart, lte: mEnd } } }),
    prisma.deal.aggregate({ where: { stage: 'CLOSED_WON', closeDate: { gte: fyStart, lte: fyEnd } }, _sum: { amount: true }, _count: true }),
    prisma.deal.aggregate({ where: { stage: 'CLOSED_WON', closeDate: { gte: mStart, lte: mEnd } }, _sum: { amount: true }, _count: true }),
    prisma.deal.count({ where: { stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } }),
    prisma.task.groupBy({ by: ['status'], _count: true }),
  ]);

  // Quarter breakdown
  const quarters = fyQuarters(fyYear);
  const qData = await Promise.all(quarters.map(async (q) => {
    const agg = await prisma.deal.aggregate({
      where: { stage: 'CLOSED_WON', closeDate: { gte: q.start, lte: q.end } },
      _sum: { amount: true }, _count: true,
    });
    return { label: q.label, revenue: agg._sum.amount || 0, deals: agg._count };
  }));

  res.json({
    totalLeads,
    leadsThisMonth,
    revenueThisFY:   dealsWon._sum.amount || 0,
    dealsWonThisFY:  dealsWon._count,
    revenueThisMonth: dealsWonThisMonth._sum.amount || 0,
    dealsWonThisMonth: dealsWonThisMonth._count,
    openDeals,
    tasks,
    quarters: qData,
  });
}

// GET /api/reports/leaderboard?fy=2024
async function getLeaderboard(req, res) {
  const year    = parseInt(req.query.fy) || fyStartYear();
  const fyStart = new Date(`${year}-04-01`);
  const fyEnd   = new Date(`${year + 1}-03-31`);

  const rows = await prisma.deal.groupBy({
    by: ['ownerId'],
    where: { stage: 'CLOSED_WON', closeDate: { gte: fyStart, lte: fyEnd } },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  // Attach names
  const userIds = rows.map(r => r.ownerId);
  const users   = await prisma.profile.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  res.json(rows.map(r => ({
    userId:  r.ownerId,
    name:    userMap[r.ownerId] || 'Unknown',
    revenue: r._sum.amount || 0,
    deals:   r._count,
  })));
}

// GET /api/reports/anomaly?type=leads|deals
async function getAnomaly(req, res) {
  const type   = req.query.type || 'leads';
  const now    = new Date();
  const fyYear = fyStartYear(now);

  // Current quarter
  const quarters = fyQuarters(fyYear);
  const qIndex   = quarters.findIndex(q => now >= q.start && now <= q.end);
  const q        = quarters[qIndex >= 0 ? qIndex : 0];

  // Build day-by-day array
  const days = [];
  const cur  = new Date(q.start);
  while (cur <= q.end && cur <= now) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }

  let values;
  if (type === 'leads') {
    const rows = await prisma.$queryRaw`
      SELECT DATE("createdAt") as day, COUNT(*)::int as cnt
      FROM leads
      WHERE "createdAt" >= ${q.start} AND "createdAt" <= ${q.end}
      GROUP BY day ORDER BY day
    `;
    const map = Object.fromEntries(rows.map(r => [r.day.toISOString().slice(0, 10), r.cnt]));
    values = days.map(d => map[d] || 0);
  } else {
    const rows = await prisma.$queryRaw`
      SELECT DATE("closeDate") as day, SUM(value)::float as total
      FROM deals
      WHERE stage = 'CLOSED_WON' AND "closeDate" >= ${q.start} AND "closeDate" <= ${q.end}
      GROUP BY day ORDER BY day
    `;
    const map = Object.fromEntries(rows.map(r => [r.day.toISOString().slice(0, 10), r.total]));
    values = days.map(d => map[d] || 0);
  }

  res.json({ days, values, quarter: quarters[qIndex >= 0 ? qIndex : 0].label });
}

module.exports = { getDashboard, getLeaderboard, getAnomaly };
