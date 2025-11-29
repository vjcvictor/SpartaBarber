// Script de migración compilado a JavaScript puro
const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

const postgresClient = new PrismaClient();

async function migrateFromSQLite() {
    console.log('🚀 Iniciando migración de SQLite a PostgreSQL...\n');

    // Abrir base de datos SQLite
    const sqliteDb = new Database(path.join(__dirname, '../data/app.db'), { readonly: true });

    try {
        // 1. Migrar Config
        console.log('📋 Migrando configuración...');
        const configs = sqliteDb.prepare('SELECT * FROM Config').all();
        for (const config of configs) {
            await postgresClient.config.upsert({
                where: { id: config.id },
                create: config,
                update: config,
            });
        }
        console.log(`✅ ${configs.length} configuración(es)\n`);

        // 2. Migrar Users
        console.log('👥 Migrando usuarios...');
        const users = sqliteDb.prepare('SELECT * FROM User').all();
        for (const user of users) {
            await postgresClient.user.upsert({
                where: { id: user.id },
                create: {
                    id: user.id,
                    email: user.email,
                    passwordHash: user.passwordHash,
                    role: user.role,
                    createdAt: new Date(user.createdAt),
                    updatedAt: new Date(user.updatedAt),
                },
                update: {
                    email: user.email,
                    passwordHash: user.passwordHash,
                    role: user.role,
                },
            });
        }
        console.log(`✅ ${users.length} usuario(s)\n`);

        // 3. Migrar Services
        console.log('💈 Migrando servicios...');
        const services = sqliteDb.prepare('SELECT * FROM Service').all();
        for (const service of services) {
            await postgresClient.service.upsert({
                where: { id: service.id },
                create: {
                    id: service.id,
                    name: service.name,
                    category: service.category,
                    icon: service.icon,
                    priceCOP: service.priceCOP,
                    description: service.description,
                    durationMin: service.durationMin,
                    active: Boolean(service.active),
                    createdAt: new Date(service.createdAt),
                    updatedAt: new Date(service.updatedAt),
                },
                update: {
                    name: service.name,
                    category: service.category,
                    icon: service.icon,
                    priceCOP: service.priceCOP,
                    description: service.description,
                    durationMin: service.durationMin,
                    active: Boolean(service.active),
                },
            });
        }
        console.log(`✅ ${services.length} servicio(s)\n`);

        // 4. Migrar Barbers
        console.log('✂️ Migrando barberos...');
        const barbers = sqliteDb.prepare('SELECT * FROM Barber').all();
        for (const barber of barbers) {
            await postgresClient.barber.upsert({
                where: { id: barber.id },
                create: {
                    id: barber.id,
                    userId: barber.userId,
                    name: barber.name,
                    photoUrl: barber.photoUrl,
                    phone: barber.phone,
                    active: Boolean(barber.active),
                    weeklySchedule: barber.weeklySchedule,
                    exceptions: barber.exceptions,
                    createdAt: new Date(barber.createdAt),
                    updatedAt: new Date(barber.updatedAt),
                },
                update: {
                    name: barber.name,
                    photoUrl: barber.photoUrl,
                    phone: barber.phone,
                    active: Boolean(barber.active),
                    weeklySchedule: barber.weeklySchedule,
                    exceptions: barber.exceptions,
                },
            });
        }
        console.log(`✅ ${barbers.length} barbero(s)\n`);

        // 5. Migrar BarberService
        console.log('🔗 Migrando servicios de barberos...');
        const barberServices = sqliteDb.prepare('SELECT * FROM BarberService').all();
        for (const bs of barberServices) {
            await postgresClient.barberService.upsert({
                where: {
                    barberId_serviceId: {
                        barberId: bs.barberId,
                        serviceId: bs.serviceId,
                    },
                },
                create: {
                    barberId: bs.barberId,
                    serviceId: bs.serviceId,
                    createdAt: new Date(bs.createdAt),
                },
                update: {},
            });
        }
        console.log(`✅ ${barberServices.length} relación(es)\n`);

        // 6. Migrar Clients
        console.log('👤 Migrando clientes...');
        const clients = sqliteDb.prepare('SELECT * FROM Client').all();
        for (const client of clients) {
            await postgresClient.client.upsert({
                where: { id: client.id },
                create: {
                    id: client.id,
                    userId: client.userId,
                    fullName: client.fullName,
                    phoneE164: client.phoneE164,
                    email: client.email,
                    notes: client.notes,
                    createdAt: new Date(client.createdAt),
                    updatedAt: new Date(client.updatedAt),
                },
                update: {
                    fullName: client.fullName,
                    phoneE164: client.phoneE164,
                    email: client.email,
                    notes: client.notes,
                },
            });
        }
        console.log(`✅ ${clients.length} cliente(s)\n`);

        // 7. Migrar Appointments
        console.log('📅 Migrando citas...');
        const appointments = sqliteDb.prepare('SELECT * FROM Appointment').all();
        for (const apt of appointments) {
            await postgresClient.appointment.upsert({
                where: { id: apt.id },
                create: {
                    id: apt.id,
                    serviceId: apt.serviceId,
                    barberId: apt.barberId,
                    clientId: apt.clientId,
                    startDateTime: new Date(apt.startDateTime),
                    endDateTime: new Date(apt.endDateTime),
                    status: apt.status,
                    notes: apt.notes,
                    reminderSent: Boolean(apt.reminderSent),
                    createdByRole: apt.createdByRole,
                    createdAt: new Date(apt.createdAt),
                    updatedAt: new Date(apt.updatedAt),
                },
                update: {
                    status: apt.status,
                    notes: apt.notes,
                    reminderSent: Boolean(apt.reminderSent),
                },
            });
        }
        console.log(`✅ ${appointments.length} cita(s)\n`);

        console.log('🎉 ¡Migración completada!\n');
        console.log('📊 Resumen:');
        console.log(`   - Usuarios: ${users.length}`);
        console.log(`   - Barberos: ${barbers.length}`);
        console.log(`   - Servicios: ${services.length}`);
        console.log(`   - Clientes: ${clients.length}`);
        console.log(`   - Citas: ${appointments.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        sqliteDb.close();
        await postgresClient.$disconnect();
    }
}

migrateFromSQLite()
    .then(() => {
        console.log('\n✅ ¡Listo! Tus datos han sido migrados a PostgreSQL.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error en la migración:', error);
        process.exit(1);
    });
