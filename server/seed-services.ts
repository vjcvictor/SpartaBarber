import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
  // Servicios Individuales (4 servicios)
  {
    name: 'Corte',
    category: 'Servicios Individuales',
    icon: '✂️',
    priceCOP: 20000,
    description: 'Corte de cabello profesional',
    durationMin: 45,
    active: true,
  },
  {
    name: 'Barba',
    category: 'Servicios Individuales',
    icon: '🧔',
    priceCOP: 10000,
    description: 'Arreglo de barba',
    durationMin: 20,
    active: true,
  },
  {
    name: 'Cejas',
    category: 'Servicios Individuales',
    icon: '👁️',
    priceCOP: 5000,
    description: 'Arreglo de cejas',
    durationMin: 10,
    active: true,
  },
  {
    name: 'Mascarilla',
    category: 'Servicios Individuales',
    icon: '💆',
    priceCOP: 10000,
    description: 'Mascarilla facial',
    durationMin: 15,
    active: true,
  },

  // Combos de dos servicios (6 servicios)
  {
    name: 'Corte + Barba',
    category: 'Combos de dos servicios',
    icon: '💈',
    priceCOP: 25000,
    description: 'Corte de cabello + arreglo de barba',
    durationMin: 60,
    active: true,
  },
  {
    name: 'Corte + Cejas',
    category: 'Combos de dos servicios',
    icon: '✨',
    priceCOP: 23000,
    description: 'Corte de cabello + arreglo de cejas',
    durationMin: 50,
    active: true,
  },
  {
    name: 'Corte + Mascarilla',
    category: 'Combos de dos servicios',
    icon: '🌟',
    priceCOP: 30000,
    description: 'Corte de cabello + mascarilla facial',
    durationMin: 60,
    active: true,
  },
  {
    name: 'Barba + Cejas',
    category: 'Combos de dos servicios',
    icon: '🎯',
    priceCOP: 13000,
    description: 'Arreglo de barba + cejas',
    durationMin: 30,
    active: true,
  },
  {
    name: 'Barba + Mascarilla',
    category: 'Combos de dos servicios',
    icon: '💎',
    priceCOP: 20000,
    description: 'Arreglo de barba + mascarilla facial',
    durationMin: 30,
    active: true,
  },
  {
    name: 'Cejas + Mascarilla',
    category: 'Combos de dos servicios',
    icon: '🔥',
    priceCOP: 13000,
    description: 'Arreglo de cejas + mascarilla facial',
    durationMin: 20,
    active: true,
  },

  // Combos de tres servicios (4 servicios)
  {
    name: 'Corte + Barba + Cejas',
    category: 'Combos de tres servicios',
    icon: '🎖️',
    priceCOP: 27000,
    description: 'Corte de cabello + arreglo de barba + cejas',
    durationMin: 70,
    active: true,
  },
  {
    name: 'Corte + Barba + Mascarilla',
    category: 'Combos de tres servicios',
    icon: '🏆',
    priceCOP: 35000,
    description: 'Corte de cabello + arreglo de barba + mascarilla',
    durationMin: 75,
    active: true,
  },
  {
    name: 'Corte + Cejas + Mascarilla',
    category: 'Combos de tres servicios',
    icon: '🌠',
    priceCOP: 33000,
    description: 'Corte de cabello + arreglo de cejas + mascarilla',
    durationMin: 70,
    active: true,
  },
  {
    name: 'Barba + Cejas + Mascarilla',
    category: 'Combos de tres servicios',
    icon: '⚡',
    priceCOP: 23000,
    description: 'Arreglo de barba + cejas + mascarilla',
    durationMin: 40,
    active: true,
  },

  // Combo completo (1 servicio)
  {
    name: 'Corte + Barba + Cejas + Mascarilla',
    category: 'Combo completo',
    icon: '👑',
    priceCOP: 37000,
    description: 'El paquete completo: corte + barba + cejas + mascarilla',
    durationMin: 90,
    active: true,
  },
];

async function main() {
  console.log('🧹 Cleaning existing services...');

  // Delete all existing services
  const deletedCount = await prisma.service.deleteMany({});
  console.log(`✅ Deleted ${deletedCount.count} existing services`);

  console.log('\n🌱 Seeding new services...');

  for (const service of services) {
    await prisma.service.create({
      data: service,
    });
    console.log(`✅ Created: ${service.name} (${service.category})`);
  }

  console.log(`\n✨ Successfully created ${services.length} services!`);

  // Summary by category
  const categoryCounts = services.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n📊 Services by category:');
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} servicios`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding services:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
