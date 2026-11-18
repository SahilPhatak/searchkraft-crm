require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

// ── Route imports ──────────────────────────────────────────────
const leadsRouter             = require('./routes/leads');
const contactsRouter          = require('./routes/contacts');
const companiesRouter         = require('./routes/companies');
const dealsRouter             = require('./routes/deals');
const tasksRouter             = require('./routes/tasks');
const activitiesRouter        = require('./routes/activities');
const documentsRouter         = require('./routes/documents');
const businessOnboardedRouter = require('./routes/businessOnboarded');
const profilesRouter          = require('./routes/profiles');
const auditRouter             = require('./routes/audit');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security middleware ─────────────────────────────────────────
app.use(helmet());

// CORS — allow frontend origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',  // Vite dev
  'http://localhost:3001',  // local frontend
  'https://searchkraft-crm.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — 200 req/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check (no auth required) ───────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/leads',              leadsRouter);
app.use('/api/contacts',           contactsRouter);
app.use('/api/companies',          companiesRouter);
app.use('/api/deals',              dealsRouter);
app.use('/api/tasks',              tasksRouter);
app.use('/api/activities',         activitiesRouter);
app.use('/api/documents',          documentsRouter);
app.use('/api/business-onboarded', businessOnboardedRouter);
app.use('/api/profiles',           profilesRouter);
app.use('/api/audit',              auditRouter);

// ── 404 handler ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ───────────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ SearchKraft CRM API running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
