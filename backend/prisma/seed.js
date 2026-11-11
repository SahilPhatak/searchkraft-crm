// npx prisma db seed
// Seeds initial team members into Supabase auth + profiles table
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma   = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEAM = [
  { name: 'Vikram Singh',    email: 'vikram@searchkraft.in',    role: 'Admin',       title: 'Director' },
  { name: 'Samyadeep Das',   email: 'samyadeep@searchkraft.in', role: 'Manager',     title: 'Team Lead' },
  { name: 'Sahil Phatak',    email: 'sahil@searchkraft.in',     role: 'User',        title: 'Recruiter' },
  { name: 'Urmila Sharma',   email: 'urmila@searchkraft.in',    role: 'User',        title: 'Recruiter' },
];

async function main() {
  console.log('Seeding team members in Supabase…');

  for (const m of TEAM) {
    // Create Supabase Auth user (profile row is auto-created by DB trigger)
    const { data, error } = await supabase.auth.admin.createUser({
      email: m.email,
      password: 'Change@123',
      email_confirm: true,
      user_metadata: { name: m.name, role: m.role },
    });

    if (error && !error.message.includes('already been registered')) {
      console.error(`  ❌ ${m.name}: ${error.message}`);
      continue;
    }

    // Update the profile row (the trigger creates it, we enrich it)
    if (data?.user?.id) {
      await prisma.profile.upsert({
        where: { id: data.user.id },
        update: { name: m.name, role: m.role, title: m.title, status: 'active' },
        create: { id: data.user.id, name: m.name, email: m.email, role: m.role, title: m.title, status: 'active' },
      });
    }

    console.log(`  ✅ ${m.name} (${m.role})`);
  }

  console.log('Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
