import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// New icon mapping
const iconMapping: Record<string, string> = {
    // Servicios Individuales
    'Corte': '✂️',
    'Barba': '🧔',
    'Cejas': '👁️',
    'Mascarilla': '💆',

    // Combos de dos servicios
    'Corte + Barba': '💈',
    'Corte + Cejas': '✨',
    'Corte + Mascarilla': '🌟',
    'Barba + Cejas': '🎯',
    'Barba + Mascarilla': '💎',
    'Cejas + Mascarilla': '🔥',

    // Combos de tres servicios
    'Corte + Barba + Cejas': '🎖️',
    'Corte + Barba + Mascarilla': '🏆',
    'Corte + Cejas + Mascarilla': '🌠',
    'Barba + Cejas + Mascarilla': '⚡',

    // Combo completo
    'Corte + Barba + Cejas + Mascarilla': '👑',
};

async function main() {
    console.log('🔍 Fetching all services...');

    const allServices = await prisma.service.findMany();
    console.log(`Found ${allServices.length} services in database`);

    // Group services by name to find duplicates
    const servicesByName = allServices.reduce((acc, service) => {
        if (!acc[service.name]) {
            acc[service.name] = [];
        }
        acc[service.name].push(service);
        return acc;
    }, {} as Record<string, typeof allServices>);

    console.log('\n🧹 Cleaning duplicates...');

    // For each service name, keep only the first one and delete the rest
    for (const [name, services] of Object.entries(servicesByName)) {
        if (services.length > 1) {
            console.log(`Found ${services.length} duplicates of "${name}"`);

            // Keep the first one, delete the rest
            const [keep, ...duplicates] = services;

            for (const duplicate of duplicates) {
                // Check if this duplicate has appointments
                const appointmentsCount = await prisma.appointment.count({
                    where: { serviceId: duplicate.id }
                });

                if (appointmentsCount > 0) {
                    console.log(`  ⚠️  Cannot delete duplicate ID ${duplicate.id} - has ${appointmentsCount} appointments. Updating appointments to use ID ${keep.id}...`);

                    // Move appointments to the service we're keeping
                    await prisma.appointment.updateMany({
                        where: { serviceId: duplicate.id },
                        data: { serviceId: keep.id }
                    });
                }

                // Now delete the duplicate
                await prisma.service.delete({
                    where: { id: duplicate.id }
                });
                console.log(`  ✅ Deleted duplicate ID ${duplicate.id}`);
            }
        }
    }

    console.log('\n🎨 Updating service icons...');

    // Get the updated list of services (without duplicates)
    const uniqueServices = await prisma.service.findMany();

    for (const service of uniqueServices) {
        const newIcon = iconMapping[service.name];

        if (newIcon) {
            await prisma.service.update({
                where: { id: service.id },
                data: { icon: newIcon }
            });
            console.log(`✅ Updated "${service.name}": ${service.icon} → ${newIcon}`);
        } else {
            console.log(`⚠️  No icon mapping for "${service.name}"`);
        }
    }

    console.log('\n✨ All done!');
    console.log(`Final count: ${uniqueServices.length} unique services`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
