import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import webpush from 'web-push';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Generate VAPID keys if not exists
  const vapidKeys = webpush.generateVAPIDKeys();

  // Create or update config
  const config = await prisma.config.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: 'Barbería Sparta',
      timezone: 'America/Bogota',
      currency: 'COP',
      primaryColor: '#f59f0a',
      secondaryColor: '#3a312c',
      homepageTitle: 'Sparta Barbería',
      homepageDescription: 'Estilo y tradición en cada corte. Agenda tu cita en minutos.',
      vapidPublicKey: vapidKeys.publicKey,
      vapidPrivateKeyEnc: vapidKeys.privateKey, // In production, this should be encrypted
    },
  });
  console.log('✅ Config created with VAPID keys');

  // Create Admin user
  const adminPasswordHash = await bcrypt.hash('M4rt1*201', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'victorj.cuero@gmail.com' },
    update: {},
    create: {
      email: 'victorj.cuero@gmail.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created');

  // Create Barber 1 - Andrés
  const barber1PasswordHash = await bcrypt.hash('Barb3r*001', 10);
  const barber1User = await prisma.user.upsert({
    where: { email: 'barbero1@sparta.com' },
    update: {},
    create: {
      email: 'barbero1@sparta.com',
      passwordHash: barber1PasswordHash,
      role: 'BARBER',
    },
  });

  const barber1 = await prisma.barber.upsert({
    where: { userId: barber1User.id },
    update: {},
    create: {
      userId: barber1User.id,
      name: 'Andrés',
      photoUrl: '/assets/barber1.jpg',
      weeklySchedule: JSON.stringify([
        { dayOfWeek: 1, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 2, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 3, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 4, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 5, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 6, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      ]),
    },
  });
  console.log('✅ Barber Andrés created');

  // Create Barber 2 - Miguel
  const barber2PasswordHash = await bcrypt.hash('Barb3r*002', 10);
  const barber2User = await prisma.user.upsert({
    where: { email: 'barbero2@sparta.com' },
    update: {},
    create: {
      email: 'barbero2@sparta.com',
      passwordHash: barber2PasswordHash,
      role: 'BARBER',
    },
  });

  const barber2 = await prisma.barber.upsert({
    where: { userId: barber2User.id },
    update: {},
    create: {
      userId: barber2User.id,
      name: 'Miguel',
      photoUrl: '/assets/barber2.jpg',
      weeklySchedule: JSON.stringify([
        { dayOfWeek: 1, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 2, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 3, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 4, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 5, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
        { dayOfWeek: 6, start: '09:00', end: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      ]),
    },
  });
  console.log('✅ Barber Miguel created');

  // Create Services (let Prisma generate UUIDs)
  // Check if services already exist by name to avoid duplicates
  let service1 = await prisma.service.findFirst({ where: { name: 'Corte Clásico' } });
  if (!service1) {
    service1 = await prisma.service.create({
      data: {
        name: 'Corte Clásico',
        icon: '✂️',
        priceCOP: 15000,
        description: 'Corte tradicional con tijera y máquina',
        durationMin: 30,
        category: 'Servicios individuales',
        active: true,
      },
    });
  }

  let service2 = await prisma.service.findFirst({ where: { name: 'Corte + Barba' } });
  if (!service2) {
    service2 = await prisma.service.create({
      data: {
        name: 'Corte + Barba',
        icon: '🧔‍♂️',
        priceCOP: 25000,
        description: 'Corte completo más arreglo de barba',
        durationMin: 45,
        category: 'Combo de dos servicios',
        active: true,
      },
    });
  }

  let service3 = await prisma.service.findFirst({ where: { name: 'Limpieza Facial' } });
  if (!service3) {
    service3 = await prisma.service.create({
      data: {
        name: 'Limpieza Facial',
        icon: '💧',
        priceCOP: 30000,
        description: 'Tratamiento facial profundo',
        durationMin: 40,
        category: 'Servicios individuales',
        active: true,
      },
    });
  }
  console.log('✅ Services created');

  // Assign all services to both barbers
  await prisma.barberService.upsert({
    where: { barberId_serviceId: { barberId: barber1.id, serviceId: service1.id } },
    update: {},
    create: { barberId: barber1.id, serviceId: service1.id },
  });
  await prisma.barberService.upsert({
    where: { barberId_serviceId: { barberId: barber1.id, serviceId: service2.id } },
    update: {},
    create: { barberId: barber1.id, serviceId: service2.id },
  });
  await prisma.barberService.upsert({
    where: { barberId_serviceId: { barberId: barber1.id, serviceId: service3.id } },
    update: {},
    create: { barberId: barber1.id, serviceId: service3.id },
  });

  await prisma.barberService.upsert({
    where: { barberId_serviceId: { barberId: barber2.id, serviceId: service1.id } },
    update: {},
    create: { barberId: barber2.id, serviceId: service1.id },
  });
  await prisma.barberService.upsert({
    where: { barberId_serviceId: { barberId: barber2.id, serviceId: service2.id } },
    update: {},
    create: { barberId: barber2.id, serviceId: service2.id },
  });
  await prisma.barberService.upsert({
    where: { barberId_serviceId: { barberId: barber2.id, serviceId: service3.id } },
    update: {},
    create: { barberId: barber2.id, serviceId: service3.id },
  });
  console.log('✅ Services assigned to barbers');

  console.log('🎉 Seed completed successfully!');
  console.log('\nCredentials:');
  console.log('Admin: victorj.cuero@gmail.com / M4rt1*201');
  console.log('Barber 1: barbero1@sparta.com / Barb3r*001 (Andrés)');
  console.log('Barber 2: barbero2@sparta.com / Barb3r*002 (Miguel)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
