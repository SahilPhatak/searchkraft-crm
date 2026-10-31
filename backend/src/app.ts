import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';
import contactsRoutes from './routes/contacts';
import accountsRoutes from './routes/accounts';
import dealsRoutes from './routes/deals';
import tasksRoutes from './routes/tasks';
import activitiesRoutes from './routes/activities';
import usersRoutes from './routes/users';
import reportsRoutes from './routes/reports';

const app = express();
const PORT = process.env.PORT || 4000;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth',       authRoutes);
app.use('/api/leads',      leadsRoutes);
app.use('/api/contacts',   contactsRoutes);
app.use('/api/accounts',   accountsRoutes);
app.use('/api/deals',      dealsRoutes);
app.use('/api/tasks',      tasksRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/users',      usersRoutes);
app.use('/api/reports',    reportsRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 SearchKraft CRM API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
});

export default app;
