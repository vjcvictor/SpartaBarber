import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';

// Email service using Nodemailer
export async function sendEmail(
    to: string,
    subject: string,
    html: string,
    appointmentId?: string
): Promise<boolean> {
    try {
        const config = await prisma.config.findFirst();

        if (
            !config ||
            !config.smtpHost ||
            !config.smtpPort ||
            !config.smtpUser ||
            !config.smtpPassEnc ||
            !config.smtpFrom
        ) {
            logger.warn('SMTP not configured, skipping email');
            return false;
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort,
            secure: config.smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: config.smtpUser,
                pass: config.smtpPassEnc, // In production, decrypt this
            },
            tls: config.smtpTls ? {
                rejectUnauthorized: false
            } : undefined,
        });

        // Send email
        const info = await transporter.sendMail({
            from: config.smtpFrom,
            to,
            subject,
            html,
        });

        await prisma.notificationLog.create({
            data: {
                channel: 'email',
                event: appointmentId ? 'appointment_notification' : 'general',
                targetRole: 'CLIENT',
                to,
                payload: JSON.stringify({ subject, html }),
                status: 'sent',
            },
        });

        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error: any) {
        logger.error('Email send error:', error.message);

        await prisma.notificationLog.create({
            data: {
                channel: 'email',
                event: appointmentId ? 'appointment_notification' : 'general',
                targetRole: 'CLIENT',
                to,
                payload: JSON.stringify({ subject, html }),
                status: 'failed',
                error: error.message,
            },
        });

        return false;
    }
}

// Email templates
export function getWelcomeEmailHTML(clientName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59f0a 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #f59f0a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💈 Bienvenido a Barbería Sparta</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clientName}</strong>,</p>
      <p>¡Gracias por registrarte en Barbería Sparta! Estamos emocionados de tenerte con nosotros.</p>
      <p>Ahora puedes:</p>
      <ul>
        <li>✅ Agendar citas en línea</li>
        <li>✅ Ver tu historial de citas</li>
        <li>✅ Recibir recordatorios automáticos</li>
        <li>✅ Gestionar tu perfil</li>
      </ul>
      <p style="text-align: center;">
        <a href="${process.env.BASE_URL || 'http://localhost:5000'}" class="button">Ir a Mi Dashboard</a>
      </p>
      <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
      <p>¡Te esperamos pronto!</p>
      <p><strong>El equipo de Barbería Sparta</strong></p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getAppointmentConfirmationEmailHTML(
    clientName: string,
    serviceName: string,
    barberName: string,
    dateTime: string,
    price: string
): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Cita Confirmada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clientName}</strong>,</p>
      <p>Tu cita ha sido agendada exitosamente. Aquí están los detalles:</p>
      <div class="info-box">
        <p><strong>📋 Servicio:</strong> ${serviceName}</p>
        <p><strong>💈 Barbero:</strong> ${barberName}</p>
        <p><strong>📅 Fecha y Hora:</strong> ${dateTime}</p>
        <p><strong>💰 Precio:</strong> ${price}</p>
      </div>
      <p>Te enviaremos un recordatorio 30 minutos antes de tu cita.</p>
      <p>¡Te esperamos en Barbería Sparta!</p>
      <p><strong>El equipo de Barbería Sparta</strong></p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getAppointmentCancellationEmailHTML(
    clientName: string,
    serviceName: string,
    barberName: string,
    dateTime: string
): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; background: #f59f0a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Cita Cancelada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clientName}</strong>,</p>
      <p>Tu cita ha sido cancelada. Aquí están los detalles:</p>
      <div class="info-box">
        <p><strong>📋 Servicio:</strong> ${serviceName}</p>
        <p><strong>💈 Barbero:</strong> ${barberName}</p>
        <p><strong>📅 Fecha y Hora:</strong> ${dateTime}</p>
      </div>
      <p>Puedes agendar una nueva cita cuando desees.</p>
      <p style="text-align: center;">
        <a href="${process.env.BASE_URL || 'http://localhost:5000'}/booking" class="button">Agendar Nueva Cita</a>
      </p>
      <p><strong>El equipo de Barbería Sparta</strong></p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getAppointmentReminderEmailHTML(
    clientName: string,
    serviceName: string,
    barberName: string,
    dateTime: string
): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 5px; }
    .alert { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59f0a; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Recordatorio de Cita</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clientName}</strong>,</p>
      <div class="alert">
        <p><strong>⚠️ Tu cita es en 30 minutos</strong></p>
      </div>
      <p>Te recordamos los detalles de tu cita:</p>
      <div class="info-box">
        <p><strong>📋 Servicio:</strong> ${serviceName}</p>
        <p><strong>💈 Barbero:</strong> ${barberName}</p>
        <p><strong>📅 Fecha y Hora:</strong> ${dateTime}</p>
      </div>
      <p>¡Te esperamos en Barbería Sparta!</p>
      <p><strong>El equipo de Barbería Sparta</strong></p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Barber notification templates
export function getBarberNewAppointmentEmailHTML(
    barberName: string,
    clientName: string,
    serviceName: string,
    dateTime: string
): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Nueva Cita Agendada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${barberName}</strong>,</p>
      <p>Tienes una nueva cita agendada:</p>
      <div class="info-box">
        <p><strong>👤 Cliente:</strong> ${clientName}</p>
        <p><strong>📋 Servicio:</strong> ${serviceName}</p>
        <p><strong>📅 Fecha y Hora:</strong> ${dateTime}</p>
      </div>
      <p>Revisa tu panel de barbero para más detalles.</p>
      <p><strong>Barbería Sparta</strong></p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getBarberCancellationEmailHTML(
    barberName: string,
    clientName: string,
    serviceName: string,
    dateTime: string
): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Cita Cancelada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${barberName}</strong>,</p>
      <p>Una cita ha sido cancelada:</p>
      <div class="info-box">
        <p><strong>👤 Cliente:</strong> ${clientName}</p>
        <p><strong>📋 Servicio:</strong> ${serviceName}</p>
        <p><strong>📅 Fecha y Hora:</strong> ${dateTime}</p>
      </div>
      <p>Tu agenda ha sido actualizada.</p>
      <p><strong>Barbería Sparta</strong></p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `;
}
