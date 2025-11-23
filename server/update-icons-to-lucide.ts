import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping of Service Name -> Lucide Icon Name
const iconMapping: Record<string, string> = {
    // Servicios Individuales
    'Corte': 'Scissors',
    'Barba': 'User',
    'Cejas': 'Eye',
    'Mascarilla': 'Sparkles',

    // Combos de dos servicios
    'Corte + Barba': 'Award',
    'Corte + Cejas': 'Star',
    'Corte + Mascarilla': 'Smile',
    'Barba + Cejas': 'Zap',
    'Barba + Mascarilla': 'Gem',
    'Cejas + Mascarilla': 'Flame',

    // Combos de tres servicios
    'Corte + Barba + Cejas': 'Medal',
    'Corte + Barba + Mascarilla': 'Trophy',
    'Corte + Cejas + Mascarilla': 'Palette',
    'Barba + Cejas + Mascarilla': 'Briefcase',

    // Combo completo
    'Corte + Barba + Cejas + Mascarilla': 'Crown',
};

async function main() {
    console.log('🔍 Fetching all services...');

    const allServices = await prisma.service.findMany();
    console.log(`Found ${allServices.length} services.`);

    console.log('\n🎨 Updating service icons to Lucide names...');

    for (const service of allServices) {
        // Find the new icon name based on the service name
        // We use 'includes' or exact match logic if names vary slightly, 
        // but here we expect exact matches from the seed.
        let newIcon = iconMapping[service.name];

        // Fallback logic if exact match fails (e.g. extra spaces)
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
