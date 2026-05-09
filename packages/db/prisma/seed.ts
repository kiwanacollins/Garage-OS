import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Seeding database...');

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@garageos.local' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@garageos.local',
      phone: '+256700000001',
      passwordHash: adminPassword,
      role: 'admin',
      isActive: true,
    },
  });
  console.info(`  ✅ Admin user: ${admin.email} (${admin.id})`);

  // ── Front Desk User ────────────────────────────────────────────────────────
  const frontDeskPassword = await bcrypt.hash('FrontDesk@1234', 12);
  const frontDesk = await prisma.user.upsert({
    where: { email: 'frontdesk@garageos.local' },
    update: {},
    create: {
      name: 'Jane Receptionist',
      email: 'frontdesk@garageos.local',
      phone: '+256700000002',
      passwordHash: frontDeskPassword,
      role: 'front_desk',
      isActive: true,
    },
  });
  console.info(`  ✅ Front desk user: ${frontDesk.email} (${frontDesk.id})`);

  // ── Mechanic User ──────────────────────────────────────────────────────────
  const mechanicPassword = await bcrypt.hash('Mechanic@1234', 12);
  const mechanic = await prisma.user.upsert({
    where: { email: 'mechanic@garageos.local' },
    update: {},
    create: {
      name: 'John Mechanic',
      email: 'mechanic@garageos.local',
      phone: '+256700000003',
      passwordHash: mechanicPassword,
      role: 'mechanic',
      isActive: true,
    },
  });
  console.info(`  ✅ Mechanic user: ${mechanic.email} (${mechanic.id})`);

  // ── Test Customer ──────────────────────────────────────────────────────────
  const customerPassword = await bcrypt.hash('Customer@1234', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'Alice Customer',
      email: 'customer@example.com',
      phone: '+256700000004',
      passwordHash: customerPassword,
      role: 'customer',
      isActive: true,
      customerProfile: {
        create: {
          address: '123 Kampala Road, Kampala',
          preferredContact: 'whatsapp',
        },
      },
    },
  });
  console.info(`  ✅ Customer user: ${customer.email} (${customer.id})`);

  // ── Get the customer profile for vehicle linking ───────────────────────────
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: customer.id },
  });

  if (profile) {
    // ── Test Vehicle ─────────────────────────────────────────────────────────
    const vehicle = await prisma.vehicle.upsert({
      where: { registrationPlate: 'UAX 123B' },
      update: {},
      create: {
        customerId: profile.id,
        make: 'Toyota',
        model: 'Corolla',
        year: 2019,
        colour: 'Silver',
        registrationPlate: 'UAX 123B',
        odometerReading: 45000,
      },
    });
    console.info(`  ✅ Vehicle: ${vehicle.make} ${vehicle.model} — ${vehicle.registrationPlate} (${vehicle.id})`);

    // ── Second Test Vehicle ──────────────────────────────────────────────────
    const vehicle2 = await prisma.vehicle.upsert({
      where: { registrationPlate: 'UBB 456C' },
      update: {},
      create: {
        customerId: profile.id,
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        colour: 'Blue',
        registrationPlate: 'UBB 456C',
        odometerReading: 22000,
      },
    });
    console.info(`  ✅ Vehicle: ${vehicle2.make} ${vehicle2.model} — ${vehicle2.registrationPlate} (${vehicle2.id})`);
  }

  console.info('🌱 Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
