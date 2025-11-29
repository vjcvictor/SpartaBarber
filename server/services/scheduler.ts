import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';
import { sendWhatsAppMessage, getAppointmentMessage } from './notifications';
import { sendEmail, getAppointmentReminderEmailHTML } from './email';
import { addMinutes } from 'date-fns';

// Run every 5 minutes
export function startReminderScheduler() {
    cron.schedule('*/5 * * * *', async () => {
        try {
            logger.info('Running appointment reminder check...');

            const now = new Date();
            const in25Minutes = addMinutes(now, 25);
            const in35Minutes = addMinutes(now, 35);

            // Find appointments starting in 25-35 minutes that haven't had reminders sent
            const upcomingAppointments = await prisma.appointment.findMany({
                where: {
                    startDateTime: {
                        gte: in25Minutes,
                        lte: in35Minutes,
                    },
                    status: {
                        in: ['agendado', 'reagendado'],
                    },
                    // Cast to any to avoid type error until Prisma Client is regenerated
                    reminderSent: false,
                } as any,
                include: {
                    service: true,
                    barber: true,
                    client: true,
                },
            });

            logger.info(`Found ${upcomingAppointments.length} appointments needing reminders`);

            for (const appt of upcomingAppointments) {
                // Cast to any to avoid type errors with relations
                const appointment = appt as any;

                try {
                    const dateTime = new Intl.DateTimeFormat('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                        timeZone: 'America/Bogota',
                    }).format(new Date(appointment.startDateTime));

                    // Send WhatsApp reminder
                    const whatsappMessage = getAppointmentMessage(
                        'reminder',
                        appointment.client.fullName,
                        appointment.service.name,
                        appointment.barber.name,
                        dateTime
                    );
                    await sendWhatsAppMessage(
                        appointment.client.phoneE164,
                        whatsappMessage,
                        appointment.id
                    );

                    // Send Email reminder
                    const emailHTML = getAppointmentReminderEmailHTML(
                        appointment.client.fullName,
                        appointment.service.name,
                        appointment.barber.name,
                        dateTime
                    );
                    await sendEmail(
                        appointment.client.email,
                        '⏰ Recordatorio de Cita - Barbería Sparta',
                        emailHTML,
                        appointment.id
                    );

                    // Send Push notification
                    if (appointment.client.userId) {
                        const { sendPushToUser } = await import('./pushNotifications');
                        await sendPushToUser(appointment.client.userId, {
                            title: '⏰ Recordatorio de Cita',
                            body: `Tu cita de ${appointment.service.name} con ${appointment.barber.name} es en 30 minutos`,
                            icon: '/logo.png',
                            tag: 'appointment-reminder',
                            requireInteraction: true,
                            data: {
                                url: '/client/appointments',
                                appointmentId: appointment.id,
                            },
                        });
                    }

                    // Mark reminder as sent
                    await prisma.appointment.update({
                        where: { id: appointment.id },
                        data: { reminderSent: true } as any,
                    });

                    logger.info(`Reminder sent for appointment ${appointment.id}`);
                } catch (error) {
                    logger.error(`Error sending reminder for appointment ${appointment.id}:`, error);
                }
            }
        } catch (error) {
            logger.error('Error in reminder scheduler:', error);
        }
    });

    logger.info('✅ Reminder scheduler started (runs every 5 minutes)');
}
