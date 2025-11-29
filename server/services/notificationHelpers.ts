import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';
import {
    sendEmail,
    getAppointmentCancellationEmailHTML,
    getBarberCancellationEmailHTML
} from './email';

// Notify appointment cancellation
export async function notifyAppointmentCancelled(appointmentId: string): Promise<void> {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                service: true,
                barber: {
                    include: {
                        user: true,
                    },
                },
                client: true,
            },
        });

        if (!appointment) {
            logger.error(`Appointment ${appointmentId} not found`);
            return;
        }

        const dateTime = new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'America/Bogota',
        }).format(new Date(appointment.startDateTime));

        // Send Email to client
        const clientEmailHTML = getAppointmentCancellationEmailHTML(
            appointment.client.fullName,
            appointment.service.name,
            appointment.barber.name,
            dateTime
        );
        await sendEmail(
            appointment.client.email,
            '❌ Cita Cancelada - Barbería Sparta',
            clientEmailHTML,
            appointmentId
        );

        // Send Email to barber
        if (appointment.barber.user?.email) {
            const barberEmailHTML = getBarberCancellationEmailHTML(
                appointment.barber.name,
                appointment.client.fullName,
                appointment.service.name,
                dateTime
            );
            await sendEmail(
                appointment.barber.user.email,
                '❌ Cita Cancelada - Barbería Sparta',
                barberEmailHTML,
                appointmentId
            );
        }

        logger.info(`Cancellation notifications sent for appointment ${appointmentId}`);
    } catch (error) {
        logger.error('Error sending cancellation notifications:', error);
    }
}

// Send welcome email to new user
export async function sendWelcomeEmail(userId: string): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                client: true,
            },
        });

        if (!user || !user.client) {
            logger.error(`User ${userId} or client not found`);
            return;
        }

        const { sendEmail: sendEmailFn, getWelcomeEmailHTML } = await import('./email');
        const emailHTML = getWelcomeEmailHTML(user.client.fullName);

        await sendEmailFn(
            user.email,
            '💈 Bienvenido a Barbería Sparta',
            emailHTML
        );

        logger.info(`Welcome email sent to ${user.email}`);
    } catch (error) {
        logger.error('Error sending welcome email:', error);
    }
}
