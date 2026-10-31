# SearchKraft CRM

A full-stack CRM built for recruitment teams of 10–30 employees.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML, CSS, JavaScript | CRM interface |
| Frontend Hosting | Vercel | Deploy website |
| Backend | Node.js + Express.js | Business logic and APIs |
| Database | PostgreSQL (Neon) | All CRM records |
| ORM | Prisma | Database queries and migrations |
| Authentication | Supabase Auth | Employee login |
| File Storage | Supabase Storage | Resumes and documents |
| API Security | JWT + role-based permissions | Secure access |
| Version Control | GitHub | Source code management |

## Project Structure

```
searchkraft-crm/
├── frontend/          # Static HTML/CSS/JS CRM interface
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── config/        # DB, Supabase, env config
│   │   ├── middleware/    # Auth, RBAC, error handling
│   │   ├── controllers/   # Route handlers
│   │   ├── routes/        # Express routers
│   │   ├── services/      # Business logic
│   │   ├── validators/    # Request validation
│   │   └── utils/         # Helpers, formatting
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (Neon account)
- Supabase account

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your Neon DATABASE_URL and Supabase keys
npx prisma migrate dev
npm run dev
```

### Frontend
Open `frontend/index.html` in a browser, or deploy to Vercel.

## Environment Variables

```env
DATABASE_URL=postgresql://...        # Neon PostgreSQL connection string
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
PORT=4000
NODE_ENV=development
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Employee login |
| GET | /api/leads | List leads |
| POST | /api/leads | Create lead |
| GET | /api/contacts | List contacts |
| POST | /api/contacts | Create contact |
| GET | /api/deals | List deals |
| POST | /api/deals | Create deal |
| GET | /api/accounts | List accounts |
| GET | /api/users | List users (admin) |
| GET | /api/reports/dashboard | Dashboard KPIs |
