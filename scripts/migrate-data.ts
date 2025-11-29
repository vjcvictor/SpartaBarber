/**
 * Script de Migración de Datos: SQLite → PostgreSQL
 * 
 * Este script migra todos los datos existentes de la base de datos SQLite
 * a la nueva base de datos PostgreSQL sin perder información.
 * 
 * IMPORTANTE: Ejecutar ANTES de usar la aplicación con PostgreSQL
 */

import { PrismaClient as PrismaClientSQLite } from '@prisma/client';
import { PrismaClient as PrismaClientPostgres } from '@prisma/client';

// Configurar cliente SQLite (base de datos antigua)
const sqliteClient = new PrismaClientSQLite({
    datasources: {
        db: {
            url: 'file:../data/app.db'
        }
    }
});

// Configurar cliente PostgreSQL (base de datos nueva)
const postgresClient = new PrismaClientPostgres();

async function migrateData() {
    console.log('🚀 Iniciando migración de datos...\n');

    try {
        // 1. Migrar Configuración
        console.log('📋 Migrando configuración...');
        const configs = await sqliteClient.config.findMany();
        for (const config of configs) {
            await postgresClient.config.upsert({
                where: { id: config.id },
                create: config,
                update: config,
            });
        }
        console.log(`✅ ${configs.length} configuración(es) migrada(s)\n`);

        // 2. Migrar Usuarios
        console.log('👥 Migrando usuarios...');
        const users = await sqliteClient.user.findMany();
        for (const user of users) {
            await postgresClient.user.upsert({
                where: { id: user.id },
                create: user,
                update: user,
            });
        }
        console.log(`✅ ${users.length} usuario(s) migrado(s)\n`);

        // 3. Migrar Servicios
        console.log('💈 Migrando servicios...');
        const services = await sqliteClient.service.findMany();
        for (const service of services) {
            await postgresClient.service.upsert({
                where: { id: service.id },
                create: service,
                update: service,
            });
        }
        console.log(`✅ ${services.length} servicio(s) migrado(s)\n`);

        // 4. Migrar Barberos
        console.log('✂️ Migrando barberos...');
        const barbers = await sqliteClient.barber.findMany();
        for (const barber of barbers) {
            await postgresClient.barber.upsert({
                where: { id: barber.id },
                create: barber,
                update: barber,
            });
        }
        console.log(`✅ ${barbers.length} barbero(s) migrado(s)\n`);

        // 5. Migrar relación Barbero-Servicio
        console.log('🔗 Migrando servicios de barberos...');
        const barberServices = await sqliteClient.barberService.findMany();
        for (const bs of barberServices) {
            await postgresClient.barberService.upsert({
                where: {
                    barberId_serviceId: {
                        barberId: bs.barberId,
                        serviceId: bs.serviceId,
                    },
                },
                create: bs,
                update: bs,
            });
        }
        console.log(`✅ ${barberServices.length} relación(es) migrada(s)\n`);

        // 6. Migrar Clientes
        console.log('👤 Migrando clientes...');
        const clients = await sqliteClient.client.findMany();
        for (const client of clients) {
            await postgresClient.client.upsert({
                where: { id: client.id },
                create: client,
                update: client,
            });
        }
        console.log(`✅ ${clients.length} cliente(s) migrado(s)\n`);

        // 7. Migrar Citas
        console.log('📅 Migrando citas...');
        const appointments = await sqliteClient.appointment.findMany();
        for (const appointment of appointments) {
            await postgresClient.appointment.upsert({
                where: { id: appointment.id },
                create: appointment,
                update: appointment,
            });
        }
        console.log(`✅ ${appointments.length} cita(s) migrada(s)\n`);

        // 8. Migrar Logs de Auditoría
        console.log('📝 Migrando logs de auditoría...');
        const auditLogs = await sqliteClient.auditLog.findMany();
        for (const log of auditLogs) {
            await postgresClient.auditLog.create({
                data: log,
            });
        }
        console.log(`✅ ${auditLogs.length} log(s) migrado(s)\n`);

        // 9. Migrar Logs de Notificaciones
        console.log('🔔 Migrando logs de notificaciones...');
        const notificationLogs = await sqliteClient.notificationLog.findMany();
        for (const log of notificationLogs) {
            await postgresClient.notificationLog.create({
                data: log,
            });
        }
        console.log(`✅ ${notificationLogs.length} notificación(es) migrada(s)\n`);

        // 10. Migrar Suscripciones Push
        console.log('🔔 Migrando suscripciones push...');
        const pushSubs = await sqliteClient.pushSubscription.findMany();
        for (const sub of pushSubs) {
            await postgresClient.pushSubscription.upsert({
                where: { id: sub.id },
                create: sub,
                update: sub,
            });
        }
        console.log(`✅ ${pushSubs.length} suscripción(es) migrada(s)\n`);

        console.log('🎉 ¡Migración completada exitosamente!\n');
        console.log('📊 Resumen:');
        console.log(`   - Usuarios: ${users.length}`);
        console.log(`   - Barberos: ${barbers.length}`);
        console.log(`   - Servicios: ${services.length}`);
        console.log(`   - Clientes: ${clients.length}`);
        console.log(`   - Citas: ${appointments.length}`);
        console.log(`   - Logs: ${auditLogs.length + notificationLogs.length}`);

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    } finally {
        await sqliteClient.$disconnect();
        await postgresClient.$disconnect();
    }
}

// Ejecutar migración
migrateData()
    .then(() => {
        console.log('\n✅ Proceso completado. Puedes iniciar la aplicación con PostgreSQL.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ La migración falló:', error);
        process.exit(1);
    });
