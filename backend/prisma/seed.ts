import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create initial users
  const users = [
    {
      uid: 'SK-0001',
      email: 'vikram@searchkraft.in',
      name: 'Vikram Singh',
      firstName: 'Vikram',
      lastName: 'Singh',
      role: 'SUPER_ADMIN' as const,
      title: 'CEO',
      department: 'Leadership',
      isActive: true,
    },
    {
      uid: 'SK-0002',
      email: 'sahil@searchkraft.in',
      name: 'Sahil Phatak',
      firstName: 'Sahil',
      lastName: 'Phatak',
      role: 'SUPER_ADMIN' as const,
      title: 'Founder',
      department: 'Leadership',
      isActive: true,
    },
    {
      uid: 'SK-0003',
      email: 'priya@searchkraft.in',
      name: 'Priya Sharma',
      firstName: 'Priya',
      lastName: 'Sharma',
      role: 'MANAGER' as const,
      title: 'Sales Manager',
      department: 'Sales',
      isActive: true,
    },
    {
      uid: 'SK-0004',
      email: 'arjun@searchkraft.in',
      name: 'Arjun Mehta',
      firstName: 'Arjun',
      lastName: 'Mehta',
      role: 'USER' as const,
      title: 'BDE',
      department: 'Sales',
      isActive: true,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`  ✓ ${user.name} (${user.email})`);
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
