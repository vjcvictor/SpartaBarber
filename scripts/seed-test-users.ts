import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const testPassword = 'test123';
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  // Create barber user
  const barberUser = await prisma.user.upsert({
    where: { email: 'barbero@sparta.com' },
    update: {},
    create: {
      email: 'barbero@sparta.com',
      passwordHash: hashedPassword,
      role: 'BARBER',
    },
  });

  // Create barber profile
  await prisma.barber.upsert({
    where: { userId: barberUser.id },
    update: {},
    create: {
      userId: barberUser.id,
      name: 'Juan Pérez',
      weeklySchedule: JSON.stringify([
        {
          dayOfWeek: 1,
          start: '09:00',
          end: '18:00',
          breaks: [{ start: '13:00', end: '14:00' }]
        },
        {
          dayOfWeek: 2,
          start: '09:00',
          end: '18:00',
          breaks: [{ start: '13:00', end: '14:00' }]
        },
        {
          dayOfWeek: 3,
          start: '09:00',
          end: '18:00',
          breaks: [{ start: '13:00', end: '14:00' }]
        },
        {
          dayOfWeek: 4,
          start: '09:00',
          end: '18:00',
          breaks: [{ start: '13:00', end: '14:00' }]
        },
        {
          dayOfWeek: 5,
          start: '09:00',
          end: '18:00',
          breaks: [{ start: '13:00', end: '14:00' }]
        },
        {
          dayOfWeek: 6,
          start: '10:00',
          end: '16:00',
          breaks: []
        }
      ]),
    },
  });

  // Create client user
  const clientUser = await prisma.user.upsert({
    where: { email: 'cliente@sparta.com' },
    update: {},
    create: {
      email: 'cliente@sparta.com',
      passwordHash: hashedPassword,
      role: 'CLIENT',
    },
  });

  // Create client profile
  await prisma.client.upsert({
    where: { email: 'cliente@sparta.com' },
    update: {},
    create: {
      userId: clientUser.id,
      fullName: 'Carlos González',
      email: 'cliente@sparta.com',
      phoneE164: '+573001234567',
    },
  });

  console.log('✅ Test users created successfully!');
  console.log('Barber: barbero@sparta.com / test123');
  console.log('Client: cliente@sparta.com / test123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
