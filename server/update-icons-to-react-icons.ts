import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping of Service Name -> React Icon Name (Key in IconMap)
const iconMapping: Record<string, string> = {
    // Servicios Individuales
    'Corte': 'Scissors',
    'Barba': 'Beard',
    'Cejas': 'Eye',
    'Mascarilla': 'Spa',

    // Combos de dos servicios
    'Corte + Barba': 'Razor',
    'Corte + Cejas': 'Star',
    'Corte + Mascarilla': 'Towel',
    'Barba + Cejas': 'Mustache',
    'Barba + Mascarilla': 'Diamond',
    'Cejas + Mascarilla': 'Fire',

    // Combos de tres servicios
    'Corte + Barba + Cejas': 'Medal',
    'Corte + Barba + Mascarilla': 'Trophy',
    'Corte + Cejas + Mascarilla': 'Stars',
    'Barba + Cejas + Mascarilla': 'Comb',

    // Combo completo
    'Corte + Barba + Cejas + Mascarilla': 'Crown',
};

async function main() {
    console.log('🔍 Fetching all services...');

    const allServices = await prisma.service.findMany();
    console.log(`Found ${allServices.length} services.`);

    console.log('\n🎨 Updating service icons to React Icon names...');

    for (const service of allServices) {
        // Find the new icon name based on the service name
        let newIcon = iconMapping[service.name];

        // Fallback logic if exact match fails
        if (!newIcon) {
            const normalizedName = service.name.trim();
            newIcon = iconMapping[normalizedName];
        }

        if (newIcon) {
            await prisma.service.update({
                where: { id: service.id },
                data: { icon: newIcon }
            });
            console.log(`✅ Updated "${service.name}": ${service.icon} → ${newIcon}`);
        } else {
            console.log(`⚠️  No mapping found for "${service.name}" (Current: ${service.icon})`);
        }
    }

    console.log('\n✨ Icons updated successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
