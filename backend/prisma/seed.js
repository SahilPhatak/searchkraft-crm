// npx prisma db seed
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma   = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEAM = [
  { name: 'Vikram Singh',   email: 'vikram@searchkraft.in',   role: 'ADMIN',   title: 'Director' },
  { name: 'Samyadeep Das',  email: 'samyadeep@searchkraft.in', role: 'MANAGER', title: 'Team Lead' },
  { name: 'Sahil Phatak',   email: 'sahil@searchkraft.in',    role: 'USER',    title: 'Recruiter' },
  { name: 'Urmila Sharma',  email: 'urmila@searchkraft.in',   role: 'USER',    title: 'Recruiter' },
];

async function main() {
  console.log('Seeding users…');
  for (let i = 0; i < TEAM.length; i++) {
    const m = TEAM[i];
    // Create auth user (idempotent — Supabase won't duplicate)
    const { data, error } = await supabase.auth.admin.createUser({
      email: m.email,
      password: 'Change@123',
      email_confirm: true,
      user_metadata: { name: m.name },
    });

    const uid = `SK-${String(i + 1).padStart(4, '0')}`;

    await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        supabaseId: data?.user?.id || `placeholder-${i}`,
        uid,
        email: m.email,
        name:  m.name,
        firstName: m.name.split(' ')[0],
        lastName:  m.name.split(' ')[1] || '',
        role:  m.role,
        title: m.title,
        isActive: true,
      },
    });

    console.log(`  ✅ ${m.name} (${uid})`);
  }
  console.log('Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
