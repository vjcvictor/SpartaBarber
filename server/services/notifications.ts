import webpush from 'web-push';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';

// WhatsApp Cloud API service
export async function sendWhatsAppMessage(
  to: string, // E.164 format
  message: string,
  appointmentId?: string
): Promise<boolean> {
  try {
    const config = await prisma.config.findFirst();

    if (
      !config ||
      !config.whatsappTokenEnc ||
      !config.whatsappPhoneNumberId
    ) {
      logger.warn('WhatsApp not configured, skipping message');
      return false;
    }

    const token = config.whatsappTokenEnc; // In production, decrypt this
    const phoneNumberId = config.whatsappPhoneNumberId;

    // Remove leading + if present
    const formattedTo = to.startsWith('+') ? to.slice(1) : to;

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: formattedTo,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await prisma.notificationLog.create({
      data: {
        channel: 'whatsapp',
        event: appointmentId ? 'appointment_notification' : 'general',
        targetRole: 'CLIENT',
        to: formattedTo,
        payload: JSON.stringify({ message }),
        status: 'sent',
      },
    });

    logger.info(`WhatsApp message sent to ${formattedTo}`);
    return true;
  } catch (error: any) {
    logger.error('WhatsApp send error:', error.response?.data || error.message);

    await prisma.notificationLog.create({
      data: {
        channel: 'whatsapp',
        event: appointmentId ? 'appointment_notification' : 'general',
        targetRole: 'CLIENT',
        to,
        payload: JSON.stringify({ message }),
        status: 'failed',
        error: error.response?.data?.error?.message || error.message,
      },
    });

    return false;
  }
}

// Web Push service
export async function sendWebPushNotification(
  subscription: any,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: any;
    tag?: string;
    requireInteraction?: boolean;
  }
): Promise<boolean> {
  try {
    const config = await prisma.config.findFirst();

    if (!config || !config.vapidPublicKey || !config.vapidPrivateKeyEnc) {
      logger.warn('VAPID keys not configured, skipping push notification');
      return false;
    }

    webpush.setVapidDetails(
      'mailto:victorj.cuero@gmail.com',
      config.vapidPublicKey,
      config.vapidPrivateKeyEnc // In production, decrypt this
    );

    await webpush.sendNotification(subscription, JSON.stringify(payload));

    await prisma.notificationLog.create({
      data: {
        channel: 'push',
        event: payload.tag || 'general',
        targetRole: 'CLIENT',
        to: JSON.stringify(subscription),
        payload: JSON.stringify(payload),
        status: 'sent',
      },
    });

    logger.info('Web push notification sent');
    return true;
  } catch (error: any) {
    logger.error('Web push error:', error.message);

    await prisma.notificationLog.create({
      data: {
        channel: 'push',
        event: payload.tag || 'general',
        targetRole: 'CLIENT',
        to: JSON.stringify(subscription),
        payload: JSON.stringify(payload),
        status: 'failed',
        error: error.message,
      },
    });

    return false;
  }
}

// Appointment notification messages
export function getAppointmentMessage(
  eventType: 'created' | 'rescheduled' | 'cancelled' | 'reminder',
  clientName: string,
  serviceName: string,
  barberName: string,
  dateTime: string
): string {
  const messages = {
    created: `Hola ${clientName}! Tu cita de ${serviceName} con ${barberName} ha sido agendada para ${dateTime}. Te esperamos en Barbería Sparta! 💈`,
    rescheduled: `Hola ${clientName}! Tu cita de ${serviceName} con ${barberName} ha sido reagendada para ${dateTime}. Te esperamos! 💈`,
    cancelled: `Hola ${clientName}. Tu cita de ${serviceName} con ${barberName} para ${dateTime} ha sido cancelada. Puedes agendar una nueva cuando desees! 💈`,
    reminder: `Hola ${clientName}! Te recordamos tu cita de ${serviceName} con ${barberName} hoy a las ${dateTime}. Te esperamos! 💈`,
  };

  return messages[eventType];
}

export async function notifyAppointmentCreated(appointmentId: string): Promise<void> {
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

    const message = getAppointmentMessage(
      'created',
      appointment.client.fullName,
      appointment.service.name,
      appointment.barber.name,
      dateTime
    );

    // Send WhatsApp to client
    await sendWhatsAppMessage(appointment.client.phoneE164, message, appointmentId);

    // Send Email to client
    const { sendEmail, getAppointmentConfirmationEmailHTML, getBarberNewAppointmentEmailHTML } = await import('./email');
    const price = `$${appointment.service.priceCOP.toLocaleString('es-CO')}`;
    const clientEmailHTML = getAppointmentConfirmationEmailHTML(
      appointment.client.fullName,
      appointment.service.name,
      appointment.barber.name,
      dateTime,
      price
    );
    await sendEmail(
      appointment.client.email,
      '✅ Cita Confirmada - Barbería Sparta',
      clientEmailHTML,
      appointmentId
    );

    // Send Email to barber
    if (appointment.barber.user?.email) {
      const barberEmailHTML = getBarberNewAppointmentEmailHTML(
        appointment.barber.name,
        appointment.client.fullName,
        appointment.service.name,
        dateTime
      );
      await sendEmail(
        appointment.barber.user.email,
        '📅 Nueva Cita Agendada - Barbería Sparta',
        barberEmailHTML,
        appointmentId
      );
    }

    // Send Push Notification to client
    if (appointment.client.userId) {
      const { sendPushToUser } = await import('./pushNotifications');
      await sendPushToUser(appointment.client.userId, {
        title: '✅ Cita Confirmada',
        body: `Tu cita de ${appointment.service.name} con ${appointment.barber.name} el ${dateTime}`,
        icon: '/logo.png',
        tag: 'appointment-created',
        data: {
          url: '/client/appointments',
          appointmentId: appointment.id,
        },
      });
    }

    logger.info(`Notifications sent for appointment ${appointmentId}`);
  } catch (error) {
    logger.error('Error sending appointment notifications:', error);
  }
}

