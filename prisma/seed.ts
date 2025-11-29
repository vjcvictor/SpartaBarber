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

  // Define Services
  const servicesData = [
    // Servicios Individuales
    { name: 'Corte', price: 20000, duration: 45, category: 'Servicios Individuales', icon: '✂️', description: 'Corte de cabello profesional' },
    { name: 'Barba', price: 10000, duration: 20, category: 'Servicios Individuales', icon: '🧔', description: 'Arreglo y perfilado de barba' },
    { name: 'Cejas', price: 5000, duration: 10, category: 'Servicios Individuales', icon: '✨', description: 'Diseño y limpieza de cejas' },
    { name: 'Mascarilla', price: 10000, duration: 15, category: 'Servicios Individuales', icon: '🧖', description: 'Mascarilla facial exfoliante' },

    // Combos de dos servicios
    { name: 'Corte + Barba', price: 25000, duration: 60, category: 'Combos de dos servicios', icon: '✂️🧔', description: 'Corte de cabello y arreglo de barba' },
    { name: 'Corte + Cejas', price: 23000, duration: 50, category: 'Combos de dos servicios', icon: '✂️✨', description: 'Corte de cabello y diseño de cejas' },
    { name: 'Corte + Mascarilla', price: 30000, duration: 60, category: 'Combos de dos servicios', icon: '✂️🧖', description: 'Corte de cabello y mascarilla facial' },
    { name: 'Barba + Cejas', price: 13000, duration: 30, category: 'Combos de dos servicios', icon: '🧔✨', description: 'Arreglo de barba y cejas' },
    { name: 'Barba + Mascarilla', price: 20000, duration: 30, category: 'Combos de dos servicios', icon: '🧔🧖', description: 'Arreglo de barba y mascarilla' },
    { name: 'Cejas + Mascarilla', price: 13000, duration: 20, category: 'Combos de dos servicios', icon: '✨🧖', description: 'Diseño de cejas y mascarilla' },

    // Combos de tres servicios
    { name: 'Corte + Barba + Cejas', price: 27000, duration: 70, category: 'Combos de tres servicios', icon: '✂️🧔✨', description: 'Paquete completo de corte y arreglo facial' },
    { name: 'Corte + Barba + Mascarilla', price: 35000, duration: 75, category: 'Combos de tres servicios', icon: '✂️🧔🧖', description: 'Corte, barba y limpieza facial' },
    { name: 'Corte + Cejas + Mascarilla', price: 33000, duration: 70, category: 'Combos de tres servicios', icon: '✂️✨🧖', description: 'Corte, cejas y limpieza facial' },
    { name: 'Barba + Cejas + Mascarilla', price: 23000, duration: 40, category: 'Combos de tres servicios', icon: '🧔✨🧖', description: 'Mantenimiento facial completo' },

    // Combo completo
    { name: 'Combo Completo', price: 37000, duration: 90, category: 'Combo completo', icon: '👑', description: 'Experiencia total: Corte, Barba, Cejas y Mascarilla' },
  ];

  console.log('🔄 Syncing services...');

  const createdServices = [];

  for (const service of servicesData) {
    // Upsert service to update if exists or create if new
    // We use findFirst + upsert logic or just upsert if we had a unique name constraint.
    // Since name is not unique in schema (but should be logically), we'll try to find by name first.

    const existing = await prisma.service.findFirst({ where: { name: service.name } });

    let result;
    if (existing) {
      result = await prisma.service.update({
        where: { id: existing.id },
        data: {
          priceCOP: service.price,
          durationMin: service.duration,
          category: service.category,
          icon: service.icon,
          description: service.description,
          active: true,
        },
      });
    } else {
      result = await prisma.service.create({
        data: {
          name: service.name,
          priceCOP: service.price,
          durationMin: service.duration,
          category: service.category,
          icon: service.icon,
          description: service.description,
          active: true,
        },
      });
    }
    createdServices.push(result);
  }
  console.log(`✅ ${createdServices.length} services synced`);

  // Assign all services to both barbers
  const barbers = [barber1, barber2];

  for (const barber of barbers) {
    for (const service of createdServices) {
      await prisma.barberService.upsert({
        where: {
          barberId_serviceId: {
            barberId: barber.id,
            serviceId: service.id,
          },
        },
        create: {
          barberId: barber.id,
          serviceId: service.id,
        },
        update: {},
      });
    }
  }
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
