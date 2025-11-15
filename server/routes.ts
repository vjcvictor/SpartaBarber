import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { parsePhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';
import { prisma } from './lib/prisma';
import logger from './lib/logger';
import { authMiddleware, requireRole, requireBarberAccess, type AuthRequest } from './middleware/auth';
import { createAuditLog } from './middleware/audit';
import { calculateAvailableSlots } from './services/availability';
import {
  loginSchema,
  registerSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentSchema,
  availabilityRequestSchema,
  createServiceSchema,
  updateServiceSchema,
  createBarberSchema,
  updateBarberSchema,
  updateConfigSchema,
  updateAdminProfileSchema,
  updateBarberProfileSchema,
  updateClientProfileSchema,
  weeklyScheduleSchema,
  adminStatsQuerySchema,
  barberStatsQuerySchema,
  type AuthResponse,
  type Service,
  type Barber,
  type Client,
  type Appointment,
  type Config,
  type DashboardStats,
  type DashboardTimeSeriesPoint,
  type ClientWithStats,
  type AdminConfig,
  type BarberDashboardStats,
  type BarberDashboardTimeSeriesPoint,
  type ServiceBreakdown,
} from '../shared/schema';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { addMinutes, isBefore, subHours, parseISO, format, subDays, startOfDay, endOfDay, startOfMonth, startOfYear } from 'date-fns';

const router = express.Router();
const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: SESSION_SECRET environment variable is required for JWT security');
}
const TIMEZONE = 'America/Bogota';

// Rate limiters - configured for Replit's proxy
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Demasiados intentos. Por favor intente más tarde.',
  // Trust Replit's X-Forwarded-For header without validation warning
  validate: { trustProxy: false },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  validate: { trustProxy: false },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============ AUTH ROUTES ============

router.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await createAuditLog(user.id, user.role, 'login', 'user', user.id, null, req);

    // Check if user has an associated Barber record
    const barber = await prisma.barber.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    // Calculate accessible roles
    const accessibleRoles: ('ADMIN' | 'BARBER' | 'CLIENT')[] = [user.role as 'ADMIN' | 'BARBER' | 'CLIENT'];
    if (user.role === 'ADMIN' && barber) {
      accessibleRoles.push('BARBER');
    }

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as 'ADMIN' | 'BARBER' | 'CLIENT',
        barberId: barber?.id,
        accessibleRoles,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(400).json({ error: 'Error al iniciar sesión' });
  }
});

router.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phoneE164 } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'CLIENT',
        client: {
          create: {
            email,
            fullName,
            phoneE164,
          },
        },
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await createAuditLog(user.id, user.role, 'register', 'user', user.id, null, req);

    // New users won't have barber records, so accessibleRoles is just their role
    const accessibleRoles: ('ADMIN' | 'BARBER' | 'CLIENT')[] = [user.role as 'ADMIN' | 'BARBER' | 'CLIENT'];

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as 'ADMIN' | 'BARBER' | 'CLIENT',
        accessibleRoles,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Register error:', error);
    res.status(400).json({ error: 'Error al registrarse' });
  }
});

router.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // req.user already has barberId and accessibleRoles populated by authMiddleware
    const response: AuthResponse = {
      user: req.user,
    };

    res.json(response);
  } catch (error) {
    logger.error('Me error:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

router.post('/api/auth/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user) {
      await createAuditLog(req.user.id, req.user.role, 'logout', 'user', req.user.id, null, req);
    }

    res.clearCookie('authToken');
    res.json({ success: true });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

// ============ PUBLIC ROUTES ============

router.get('/api/services', apiLimiter, async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    const response: Service[] = services.map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      priceCOP: s.priceCOP,
      description: s.description,
      durationMin: s.durationMin,
      category: s.category,
      active: s.active,
    }));

    res.json(response);
  } catch (error) {
    logger.error('Get services error:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

router.get('/api/barbers', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.query;

    let barbers;
    if (serviceId) {
      barbers = await prisma.barber.findMany({
        where: {
          services: {
            some: {
              serviceId: serviceId as string,
            },
          },
        },
        include: {
          services: {
            select: {
              serviceId: true,
            },
          },
        },
      });
    } else {
      barbers = await prisma.barber.findMany({
        include: {
          services: {
            select: {
              serviceId: true,
            },
          },
        },
      });
    }

    const response: Barber[] = barbers.map((b) => ({
      id: b.id,
      name: b.name,
      photoUrl: b.photoUrl,
      weeklySchedule: JSON.parse(b.weeklySchedule),
      exceptions: JSON.parse(b.exceptions),
      services: b.services.map((s) => s.serviceId),
    }));

    res.json(response);
  } catch (error) {
    logger.error('Get barbers error:', error);
    res.status(500).json({ error: 'Error al obtener barberos' });
  }
});

router.post('/api/availability', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { serviceId, barberId, date } = availabilityRequestSchema.parse(req.body);

    const slots = await calculateAvailableSlots(serviceId, barberId, date);

    res.json(slots);
  } catch (error) {
    logger.error('Get availability error:', error);
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
});

router.get('/api/config', apiLimiter, async (req: Request, res: Response) => {
  try {
    const config = await prisma.config.findFirst();

    if (!config) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }

    const response: Config = {
      id: config.id,
      businessName: config.businessName,
      timezone: config.timezone,
      currency: config.currency,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      homepageTitle: config.homepageTitle,
      homepageDescription: config.homepageDescription,
      vapidPublicKey: config.vapidPublicKey,
      whatsappEnabled: !!config.whatsappTokenEnc && !!config.whatsappPhoneNumberId,
      smtpEnabled: config.smtpEnabled,
    };

    res.json(response);
  } catch (error) {
    logger.error('Get config error:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// ============ APPOINTMENT ROUTES ============

router.post('/api/appointments', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { serviceId, barberId, startDateTime, clientData } = createAppointmentSchema.parse(req.body);

    // Validate phone number
    let phoneE164 = clientData.phoneE164;
    try {
      const phoneNumber = parsePhoneNumber(clientData.phoneE164, 'CO');
      if (!phoneNumber.isValid()) {
        return res.status(400).json({ error: 'Número de teléfono inválido' });
      }
      phoneE164 = phoneNumber.number;
    } catch (error) {
      return res.status(400).json({ error: 'Número de teléfono inválido' });
    }

    // Get service to calculate end time
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.active) {
      return res.status(400).json({ error: 'Servicio no encontrado o inactivo' });
    }

    const startDate = parseISO(startDateTime);
    const endDate = addMinutes(startDate, service.durationMin);

    // Check availability using the same logic as the availability endpoint
    // Convert UTC time to Colombia timezone to match slot times
    const startDateColombia = toZonedTime(startDate, 'America/Bogota');
    const dateStr = format(startDateColombia, 'yyyy-MM-dd');
    const requestedTime = format(startDateColombia, 'HH:mm');
    
    const availableSlots = await calculateAvailableSlots(serviceId, barberId, dateStr);
    
    // Since calculateAvailableSlots now only returns available slots,
    // we just need to check if the requested time exists in the array
    const isAvailable = availableSlots.some(slot => slot.startTime === requestedTime);
    
    if (!isAvailable) {
      logger.warn('Slot not available', { 
        barberId, 
        startDate: startDate.toISOString(), 
        requestedTime,
        availableSlots: availableSlots.map(s => s.startTime)
      });
      return res.status(400).json({ error: 'El horario seleccionado ya no está disponible' });
    }

    // Find or create client
    let client = await prisma.client.findUnique({
      where: { email: clientData.email },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          email: clientData.email,
          fullName: clientData.fullName,
          phoneE164,
          notes: clientData.notes,
        },
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        serviceId,
        barberId,
        clientId: client.id,
        startDateTime: startDate,
        endDateTime: endDate,
        status: 'agendado',
        notes: clientData.notes,
        createdByRole: 'CLIENT',
      },
      include: {
        service: true,
        barber: true,
        client: true,
      },
    });

    await createAuditLog(
      null,
      'CLIENT',
      'create',
      'appointment',
      appointment.id,
      { clientEmail: clientData.email },
      req
    );

    logger.info(`Appointment created: ${appointment.id}`);

    res.json({
      id: appointment.id,
      serviceId: appointment.serviceId,
      barberId: appointment.barberId,
      clientId: appointment.clientId,
      startDateTime: appointment.startDateTime.toISOString(),
      endDateTime: appointment.endDateTime.toISOString(),
      status: appointment.status,
      notes: appointment.notes,
      createdByRole: appointment.createdByRole,
    });
  } catch (error) {
    logger.error('Create appointment error:', error);
    res.status(500).json({ error: 'Error al crear la cita' });
  }
});

router.get('/api/appointments/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        barber: true,
        client: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const response: Appointment = {
      id: appointment.id,
      serviceId: appointment.serviceId,
      barberId: appointment.barberId,
      clientId: appointment.clientId,
      startDateTime: appointment.startDateTime.toISOString(),
      endDateTime: appointment.endDateTime.toISOString(),
      status: appointment.status as 'agendado' | 'cancelado' | 'reagendado',
      notes: appointment.notes || undefined,
      createdByRole: appointment.createdByRole as 'ADMIN' | 'BARBER' | 'CLIENT',
      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        icon: appointment.service.icon,
        priceCOP: appointment.service.priceCOP,
        description: appointment.service.description,
        durationMin: appointment.service.durationMin,
        category: appointment.service.category,
        active: appointment.service.active,
      },
      barber: {
        id: appointment.barber.id,
        name: appointment.barber.name,
        photoUrl: appointment.barber.photoUrl,
        weeklySchedule: JSON.parse(appointment.barber.weeklySchedule),
        exceptions: JSON.parse(appointment.barber.exceptions),
        services: [],
      },
      client: {
        id: appointment.client.id,
        fullName: appointment.client.fullName,
        phoneE164: appointment.client.phoneE164,
        email: appointment.client.email,
        notes: appointment.client.notes || undefined,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Get appointment error:', error);
    res.status(500).json({ error: 'Error al obtener la cita' });
  }
});

router.delete('/api/appointments/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Check if appointment can be cancelled (must be at least 1 hour before)
    const now = new Date();
    const appointmentTime = appointment.startDateTime;
    const oneHourBefore = subHours(appointmentTime, 1);

    if (isBefore(now, oneHourBefore)) {
      await prisma.appointment.update({
        where: { id },
        data: { status: 'cancelado' },
      });

      await createAuditLog(null, 'CLIENT', 'update', 'appointment', id, { status: 'cancelado' }, req);

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Las citas solo pueden cancelarse con al menos 1 hora de anticipación' });
    }
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Error al cancelar la cita' });
  }
});

router.put(
  '/api/admin/appointments/:id',
  authMiddleware,
  requireRole('ADMIN', 'BARBER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateAppointmentSchema.parse(req.body);

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          service: true,
        },
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Validate 1-hour restriction for status changes
      // Only apply if changing status and NOT marking as 'completado'
      if (data.status && data.status !== 'completado' && data.status !== appointment.status) {
        const now = new Date();
        const appointmentTime = appointment.startDateTime;
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        if (isBefore(appointmentTime, oneHourFromNow)) {
          return res.status(400).json({
            error: 'No se puede modificar una cita con menos de 1 hora de anticipación'
          });
        }
      }

      // Validate 1-hour restriction for rescheduling
      if (data.startDateTime && data.startDateTime !== appointment.startDateTime.toISOString()) {
        const now = new Date();
        const appointmentTime = appointment.startDateTime;
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        if (isBefore(appointmentTime, oneHourFromNow)) {
          return res.status(400).json({
            error: 'No se puede modificar una cita con menos de 1 hora de anticipación'
          });
        }
      }

      // Build update data
      const updateData: any = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.barberId !== undefined) updateData.barberId = data.barberId;

      // If changing startDateTime, also update endDateTime
      if (data.startDateTime) {
        const newStartDate = parseISO(data.startDateTime);
        const newEndDate = addMinutes(newStartDate, appointment.service.durationMin);
        updateData.startDateTime = newStartDate;
        updateData.endDateTime = newEndDate;

        // Check availability for the new slot if changing date/time or barber
        const dateStr = format(newStartDate, 'yyyy-MM-dd');
        const barberId = data.barberId || appointment.barberId;
        const availableSlots = await calculateAvailableSlots(appointment.serviceId, barberId, dateStr);
        const requestedTime = format(newStartDate, 'HH:mm');
        
        // Filter out the current appointment when checking availability
        const isAvailable = availableSlots.some(slot => slot.startTime === requestedTime && slot.available);
        
        if (!isAvailable) {
          logger.warn('Slot not available for reschedule', { 
            barberId, 
            newStartDate: newStartDate.toISOString(), 
            requestedTime,
          });
          return res.status(400).json({ error: 'El horario seleccionado no está disponible' });
        }
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
          service: true,
          barber: true,
          client: true,
        },
      });

      await createAuditLog(
        req.user!.id,
        req.user!.role,
        'update',
        'appointment',
        id,
        data,
        req
      );

      logger.info(`Appointment updated: ${id}`);

      res.json({
        id: updatedAppointment.id,
        serviceId: updatedAppointment.serviceId,
        barberId: updatedAppointment.barberId,
        clientId: updatedAppointment.clientId,
        startDateTime: updatedAppointment.startDateTime.toISOString(),
        endDateTime: updatedAppointment.endDateTime.toISOString(),
        status: updatedAppointment.status,
        notes: updatedAppointment.notes,
        createdByRole: updatedAppointment.createdByRole,
      });
    } catch (error) {
      logger.error('Update appointment error:', error);
      res.status(500).json({ error: 'Error al actualizar la cita' });
    }
  }
);

// ============ BARBER ROUTES ============

router.get(
  '/api/barber/stats',
  authMiddleware,
  requireBarberAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      // Parse and validate query params
      const queryParams = barberStatsQuerySchema.parse(req.query);
      
      // For ADMIN users acting as barbers, use barberId from req.user
      // For regular BARBER users, query by userId
      let barber;
      if (req.user!.role === 'ADMIN' && req.user!.barberId) {
        barber = await prisma.barber.findUnique({
          where: { id: req.user!.barberId },
        });
      } else {
        barber = await prisma.barber.findUnique({
          where: { userId: req.user!.id },
        });
      }

      if (!barber) {
        return res.status(404).json({ error: 'Barbero no encontrado' });
      }

      // Get current time in Bogota timezone
      const nowInBogota = toZonedTime(new Date(), TIMEZONE);
      
      // Default to last 7 days if not provided
      let startDate: Date;
      let endDate: Date;
      
      if (queryParams.startDate && queryParams.endDate) {
        // Parse provided dates and convert to Bogota timezone
        startDate = fromZonedTime(startOfDay(parseISO(queryParams.startDate)), TIMEZONE);
        endDate = fromZonedTime(endOfDay(parseISO(queryParams.endDate)), TIMEZONE);
      } else {
        // Default to last 7 days
        startDate = fromZonedTime(startOfDay(subDays(nowInBogota, 6)), TIMEZONE);
        endDate = fromZonedTime(endOfDay(nowInBogota), TIMEZONE);
      }
      
      // Calculate startOfToday for "Citas Hoy"
      const startOfToday = fromZonedTime(startOfDay(nowInBogota), TIMEZONE);
      
      // Fetch appointments in the date range with services
      const appointmentsInRange = await prisma.appointment.findMany({
        where: {
          barberId: barber.id,
          startDateTime: { gte: startDate, lte: endDate },
          status: { in: ['agendado', 'reagendado', 'completado'] },
        },
        include: {
          service: true,
        },
        orderBy: {
          startDateTime: 'asc',
        },
      });
      
      // Calculate stats for the range
      const periodAppointments = appointmentsInRange.length;
      
      // Calculate revenue only from completed appointments
      const completedAppointmentsInRange = appointmentsInRange.filter(appt => appt.status === 'completado');
      const periodRevenueCOP = completedAppointmentsInRange.reduce(
        (sum, appt) => sum + appt.service.priceCOP,
        0
      );
      
      // Unique clients in period
      const uniqueClientIds = new Set(appointmentsInRange.map(appt => appt.clientId));
      const uniqueClientsInPeriod = uniqueClientIds.size;
      
      // Appointments today (independent of date range)
      const appointmentsToday = await prisma.appointment.count({
        where: {
          barberId: barber.id,
          startDateTime: { gte: startOfToday },
          status: { in: ['agendado', 'reagendado'] },
        },
      });
      
      // Total appointments (all time)
      const totalAppointments = await prisma.appointment.count({
        where: {
          barberId: barber.id,
          status: { in: ['agendado', 'reagendado', 'completado'] },
        },
      });
      
      // Generate timeSeries by grouping appointments by date
      const timeSeriesGrouped = appointmentsInRange.reduce((acc, appt) => {
        const date = format(toZonedTime(appt.startDateTime, TIMEZONE), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = { date, appointments: 0, revenueCOP: 0 };
        }
        acc[date].appointments += 1;
        // Only add revenue if appointment is completed
        if (appt.status === 'completado') {
          acc[date].revenueCOP += appt.service.priceCOP;
        }
        return acc;
      }, {} as Record<string, BarberDashboardTimeSeriesPoint>);
      
      const timeSeries = Object.values(timeSeriesGrouped).sort((a, b) => 
        a.date.localeCompare(b.date)
      );
      
      // Generate serviceBreakdown by grouping appointments by service
      const serviceBreakdownGrouped = appointmentsInRange.reduce((acc, appt) => {
        const serviceId = appt.serviceId;
        if (!acc[serviceId]) {
          acc[serviceId] = {
            serviceId,
            serviceName: appt.service.name,
            appointments: 0,
            revenueCOP: 0,
          };
        }
        acc[serviceId].appointments += 1;
        // Only add revenue if appointment is completed
        if (appt.status === 'completado') {
          acc[serviceId].revenueCOP += appt.service.priceCOP;
        }
        return acc;
      }, {} as Record<string, ServiceBreakdown>);
      
      const serviceBreakdown = Object.values(serviceBreakdownGrouped).sort(
        (a, b) => b.appointments - a.appointments
      );
      
      const stats: BarberDashboardStats = {
        barberName: barber.name,
        periodAppointments,
        periodRevenueCOP,
        appointmentsToday,
        totalAppointments,
        uniqueClientsInPeriod,
        timeSeries,
        serviceBreakdown,
      };

      res.json(stats);
    } catch (error) {
      logger.error('Get barber stats error:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
);

router.get(
  '/api/barber/appointments',
  authMiddleware,
  requireBarberAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      // For ADMIN users acting as barbers, use barberId from req.user
      // For regular BARBER users, query by userId
      let barber;
      if (req.user!.role === 'ADMIN' && req.user!.barberId) {
        barber = await prisma.barber.findUnique({
          where: { id: req.user!.barberId },
        });
      } else {
        barber = await prisma.barber.findUnique({
          where: { userId: req.user!.id },
        });
      }

      if (!barber) {
        return res.status(404).json({ error: 'Barbero no encontrado' });
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          barberId: barber.id,
        },
        include: {
          service: true,
          client: true,
        },
        orderBy: {
          startDateTime: 'desc',
        },
      });

      const response = appointments.map((appt) => ({
        id: appt.id,
        serviceId: appt.serviceId,
        barberId: appt.barberId,
        clientId: appt.clientId,
        startDateTime: appt.startDateTime.toISOString(),
        endDateTime: appt.endDateTime.toISOString(),
        status: appt.status,
        notes: appt.notes || undefined,
        createdByRole: appt.createdByRole,
        service: {
          id: appt.service.id,
          name: appt.service.name,
          icon: appt.service.icon,
          priceCOP: appt.service.priceCOP,
          description: appt.service.description,
          durationMin: appt.service.durationMin,
          active: appt.service.active,
        },
        client: {
          id: appt.client.id,
          fullName: appt.client.fullName,
          phoneE164: appt.client.phoneE164,
          email: appt.client.email,
          notes: appt.client.notes || undefined,
        },
      }));

      res.json(response);
    } catch (error) {
      logger.error('Get barber appointments error:', error);
      res.status(500).json({ error: 'Error al obtener citas' });
    }
  }
);

router.patch(
  '/api/barber/appointments/:id',
  authMiddleware,
  requireBarberAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['agendado', 'cancelado', 'reagendado', 'completado'].includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      // For ADMIN users acting as barbers, use barberId from req.user
      // For regular BARBER users, query by userId
      let barber;
      if (req.user!.role === 'ADMIN' && req.user!.barberId) {
        barber = await prisma.barber.findUnique({
          where: { id: req.user!.barberId },
        });
      } else {
        barber = await prisma.barber.findUnique({
          where: { userId: req.user!.id },
        });
      }

      if (!barber) {
        return res.status(404).json({ error: 'Barbero no encontrado' });
      }

      // Verify appointment belongs to barber
      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      if (appointment.barberId !== barber.id) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta cita' });
      }

      // Validate 1-hour restriction for status changes
      // Only apply if changing status and NOT marking as 'completado'
      if (status !== 'completado' && status !== appointment.status) {
        const now = new Date();
        const appointmentTime = appointment.startDateTime;
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        if (isBefore(appointmentTime, oneHourFromNow)) {
          return res.status(400).json({
            error: 'No se puede modificar una cita con menos de 1 hora de anticipación'
          });
        }
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: { status },
      });

      // Log with appropriate role (ADMIN if admin-barber, BARBER otherwise)
      await createAuditLog(
        req.user!.id,
        req.user!.role === 'ADMIN' ? 'ADMIN' : 'BARBER',
        'update',
        'appointment',
        id,
        { status, actingAsBarber: req.user!.role === 'ADMIN' },
        req
      );

      res.json({ success: true, status: updated.status });
    } catch (error) {
      logger.error('Update barber appointment error:', error);
      res.status(500).json({ error: 'Error al actualizar cita' });
    }
  }
);

router.patch(
  '/api/barber/profile',
  authMiddleware,
  requireBarberAccess(),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = updateBarberProfileSchema.parse(req.body);

      // For ADMIN users acting as barbers, use barberId from req.user
      // For regular BARBER users, query by userId
      let barber;
      if (req.user!.role === 'ADMIN' && req.user!.barberId) {
        barber = await prisma.barber.findUnique({
          where: { id: req.user!.barberId },
          include: { user: true },
        });
      } else {
        barber = await prisma.barber.findUnique({
          where: { userId: req.user!.id },
          include: { user: true },
        });
      }

      if (!barber) {
        return res.status(404).json({ error: 'Barbero no encontrado' });
      }

      if (data.newPassword) {
        if (!data.currentPassword) {
          return res.status(400).json({ error: 'Debe proporcionar la contraseña actual' });
        }

        const validPassword = await bcrypt.compare(data.currentPassword, barber.user.passwordHash);
        if (!validPassword) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }
      }

      if (data.email && data.email !== barber.user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          return res.status(400).json({ error: 'El email ya está en uso' });
        }
      }

      if (data.weeklySchedule) {
        try {
          const parsedSchedule = JSON.parse(data.weeklySchedule);
          weeklyScheduleSchema.parse(parsedSchedule);
        } catch (error) {
          return res.status(400).json({ error: 'Horario semanal inválido' });
        }
      }

      const shouldClearToken = !!(data.newPassword || (data.email && data.email !== barber.user.email));

      await prisma.$transaction(async (tx) => {
        const userUpdate: any = {};
        if (data.email) userUpdate.email = data.email;
        if (data.newPassword) userUpdate.passwordHash = await bcrypt.hash(data.newPassword, 10);

        if (Object.keys(userUpdate).length > 0) {
          await tx.user.update({
            where: { id: req.user!.id },
            data: userUpdate,
          });
        }

        const barberUpdate: any = {};
        if (data.name) barberUpdate.name = data.name;
        if (data.weeklySchedule) barberUpdate.weeklySchedule = data.weeklySchedule;

        if (Object.keys(barberUpdate).length > 0) {
          await tx.barber.update({
            where: { id: barber.id },
            data: barberUpdate,
          });
        }
      });

      // Log with appropriate role (ADMIN if admin-barber, BARBER otherwise)
      await createAuditLog(
        req.user!.id,
        req.user!.role === 'ADMIN' ? 'ADMIN' : 'BARBER',
        'update',
        'user',
        req.user!.id,
        { profileUpdate: true, actingAsBarber: req.user!.role === 'ADMIN' },
        req
      );

      if (shouldClearToken) {
        res.clearCookie('authToken', { httpOnly: true, sameSite: 'lax' });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Update barber profile error:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }
);

// ============ CLIENT ROUTES ============

router.get(
  '/api/client/stats',
  authMiddleware,
  requireRole('CLIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Find client by user ID
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const client = await prisma.client.findUnique({
        where: { email: user.email },
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const [upcomingAppointments, totalAppointments] = await Promise.all([
        prisma.appointment.count({
          where: {
            clientId: client.id,
            startDateTime: { gte: new Date() },
            status: { in: ['agendado', 'reagendado'] },
          },
        }),
        prisma.appointment.count({
          where: {
            clientId: client.id,
          },
        }),
      ]);

      res.json({
        upcomingAppointments,
        totalAppointments,
        clientName: client.fullName,
      });
    } catch (error) {
      logger.error('Get client stats error:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
);

router.get(
  '/api/client/appointments',
  authMiddleware,
  requireRole('CLIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Find client by user email
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const client = await prisma.client.findUnique({
        where: { email: user.email },
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          clientId: client.id,
        },
        include: {
          service: true,
          barber: true,
        },
        orderBy: {
          startDateTime: 'desc',
        },
      });

      const response = appointments.map((appt) => ({
        id: appt.id,
        serviceId: appt.serviceId,
        barberId: appt.barberId,
        clientId: appt.clientId,
        startDateTime: appt.startDateTime.toISOString(),
        endDateTime: appt.endDateTime.toISOString(),
        status: appt.status,
        notes: appt.notes || undefined,
        createdByRole: appt.createdByRole,
        service: {
          id: appt.service.id,
          name: appt.service.name,
          icon: appt.service.icon,
          priceCOP: appt.service.priceCOP,
          description: appt.service.description,
          durationMin: appt.service.durationMin,
          active: appt.service.active,
        },
        barber: {
          id: appt.barber.id,
          name: appt.barber.name,
          photoUrl: appt.barber.photoUrl,
          weeklySchedule: JSON.parse(appt.barber.weeklySchedule),
          exceptions: JSON.parse(appt.barber.exceptions),
          services: [],
        },
      }));

      res.json(response);
    } catch (error) {
      logger.error('Get client appointments error:', error);
      res.status(500).json({ error: 'Error al obtener citas' });
    }
  }
);

router.patch(
  '/api/client/profile',
  authMiddleware,
  requireRole('CLIENT'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = updateClientProfileSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const client = await prisma.client.findUnique({
        where: { email: user.email },
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      if (data.newPassword) {
        if (!data.currentPassword) {
          return res.status(400).json({ error: 'Debe proporcionar la contraseña actual' });
        }

        const validPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
        if (!validPassword) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }
      }

      if (data.email && data.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          return res.status(400).json({ error: 'El email ya está en uso' });
        }

        const existingClient = await prisma.client.findUnique({
          where: { email: data.email },
        });

        if (existingClient) {
          return res.status(400).json({ error: 'El email ya está en uso' });
        }
      }

      const shouldClearToken = !!(data.newPassword || (data.email && data.email !== user.email));

      await prisma.$transaction(async (tx) => {
        const userUpdate: any = {};
        if (data.email) userUpdate.email = data.email;
        if (data.newPassword) userUpdate.passwordHash = await bcrypt.hash(data.newPassword, 10);

        if (Object.keys(userUpdate).length > 0) {
          await tx.user.update({
            where: { id: req.user!.id },
            data: userUpdate,
          });
        }

        const clientUpdate: any = {};
        if (data.fullName) clientUpdate.fullName = data.fullName;
        if (data.email) clientUpdate.email = data.email;
        if (data.phoneE164) clientUpdate.phoneE164 = data.phoneE164;

        if (Object.keys(clientUpdate).length > 0) {
          await tx.client.update({
            where: { id: client.id },
            data: clientUpdate,
          });
        }
      });

      await createAuditLog(
        req.user!.id,
        'CLIENT',
        'update',
        'user',
        req.user!.id,
        { profileUpdate: true },
        req
      );

      if (shouldClearToken) {
        res.clearCookie('authToken', { httpOnly: true, sameSite: 'lax' });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Update client profile error:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }
);

// ============ ADMIN ROUTES ============

router.get(
  '/api/admin/stats',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      // Parse and validate query params
      const queryParams = adminStatsQuerySchema.parse(req.query);
      
      // Get current time in Bogota timezone
      const nowInBogota = toZonedTime(new Date(), TIMEZONE);
      
      // Default to last 7 days if not provided
      let startDate: Date;
      let endDate: Date;
      
      if (queryParams.startDate && queryParams.endDate) {
        // Parse provided dates and convert to Bogota timezone
        startDate = fromZonedTime(startOfDay(parseISO(queryParams.startDate)), TIMEZONE);
        endDate = fromZonedTime(endOfDay(parseISO(queryParams.endDate)), TIMEZONE);
      } else {
        // Default to last 7 days
        startDate = fromZonedTime(startOfDay(subDays(nowInBogota, 6)), TIMEZONE);
        endDate = fromZonedTime(endOfDay(nowInBogota), TIMEZONE);
      }
      
      // Calculate startOfToday for "Citas Hoy"
      const startOfToday = fromZonedTime(startOfDay(nowInBogota), TIMEZONE);
      
      // Fetch appointments in the date range with services
      const appointmentsInRange = await prisma.appointment.findMany({
        where: {
          startDateTime: { gte: startDate, lte: endDate },
          status: { in: ['agendado', 'reagendado', 'completado'] },
        },
        include: {
          service: true,
        },
        orderBy: {
          startDateTime: 'asc',
        },
      });
      
      // Calculate stats for the range
      const totalAppointments = appointmentsInRange.length;
      
      // Calculate revenue only from completed appointments
      const completedAppointments = appointmentsInRange.filter(appt => appt.status === 'completado');
      const revenueThisMonth = completedAppointments.reduce(
        (sum, appt) => sum + appt.service.priceCOP,
        0
      );
      
      // Appointments today (independent of date range)
      const appointmentsToday = await prisma.appointment.count({
        where: {
          startDateTime: { gte: startOfToday },
          status: { in: ['agendado', 'reagendado'] },
        },
      });
      
      // Total clients (global, not filtered)
      const totalClients = await prisma.client.count();
      
      // Generate timeSeries by grouping appointments by date
      const grouped = appointmentsInRange.reduce((acc, appt) => {
        const date = format(toZonedTime(appt.startDateTime, TIMEZONE), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = { date, appointments: 0, revenueCOP: 0 };
        }
        acc[date].appointments += 1;
        // Only add revenue if appointment is completed
        if (appt.status === 'completado') {
          acc[date].revenueCOP += appt.service.priceCOP;
        }
        return acc;
      }, {} as Record<string, DashboardTimeSeriesPoint>);
      
      const timeSeries = Object.values(grouped).sort((a, b) => 
        a.date.localeCompare(b.date)
      );
      
      const stats: DashboardStats = {
        totalAppointments,
        appointmentsToday,
        appointmentsThisWeek: 0, // Deprecated, kept for compatibility
        appointmentsThisMonth: 0, // Deprecated, kept for compatibility
        totalClients,
        totalRevenueCOP: 0, // Deprecated, kept for compatibility
        revenueThisMonth,
        timeSeries,
      };

      res.json(stats);
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
);

router.get(
  '/api/admin/appointments',
  authMiddleware,
  requireRole('ADMIN', 'BARBER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const appointments = await prisma.appointment.findMany({
        include: {
          service: true,
          barber: true,
          client: true,
        },
        orderBy: {
          startDateTime: 'desc',
        },
      });

      res.json(appointments);
    } catch (error) {
      logger.error('Get admin appointments error:', error);
      res.status(500).json({ error: 'Error al obtener citas' });
    }
  }
);

router.put(
  '/api/admin/appointments/:id',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateAppointmentSchema.parse(req.body);

      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.notes && { notes: data.notes }),
        },
        include: {
          service: true,
          barber: true,
          client: true,
        },
      });

      await createAuditLog(
        req.user!.id,
        'ADMIN',
        'update',
        'appointment',
        id,
        { statusChange: data.status },
        req
      );

      res.json(updated);
    } catch (error: unknown) {
      logger.error('Update admin appointment error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: 'Error al actualizar la cita' });
    }
  }
);

router.patch(
  '/api/admin/profile',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = updateAdminProfileSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (data.newPassword) {
        if (!data.currentPassword) {
          return res.status(400).json({ error: 'Debe proporcionar la contraseña actual' });
        }

        const validPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
        if (!validPassword) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }
      }

      if (data.email && data.email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          return res.status(400).json({ error: 'El email ya está en uso' });
        }
      }

      const shouldClearToken = !!(data.newPassword || (data.email && data.email !== user.email));

      const userUpdate: any = {};
      if (data.email) userUpdate.email = data.email;
      if (data.newPassword) userUpdate.passwordHash = await bcrypt.hash(data.newPassword, 10);

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: req.user!.id },
          data: userUpdate,
        });
      }

      await createAuditLog(
        req.user!.id,
        'ADMIN',
        'update',
        'user',
        req.user!.id,
        { profileUpdate: true },
        req
      );

      if (shouldClearToken) {
        res.clearCookie('authToken', { httpOnly: true, sameSite: 'lax' });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Update admin profile error:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }
);

// ============ ADMIN CRUD ROUTES ============

// Services
router.get(
  '/api/admin/services',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const services = await prisma.service.findMany({
        orderBy: { name: 'asc' },
      });

      const response: Service[] = services.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        priceCOP: s.priceCOP,
        description: s.description,
        durationMin: s.durationMin,
        category: s.category,
        active: s.active,
      }));

      res.json(response);
    } catch (error) {
      logger.error('Get admin services error:', error);
      res.status(500).json({ error: 'Error al obtener servicios' });
    }
  }
);

router.post(
  '/api/admin/services',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createServiceSchema.parse(req.body);

      const service = await prisma.service.create({
        data,
      });

      await createAuditLog(
        req.user!.id,
        req.user!.role,
        'create',
        'service',
        service.id,
        data,
        req
      );

      res.json(service);
    } catch (error) {
      logger.error('Create service error:', error);
      res.status(500).json({ error: 'Error al crear servicio' });
    }
  }
);

router.put(
  '/api/admin/services/:id',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateServiceSchema.parse(req.body);

      const service = await prisma.service.update({
        where: { id },
        data,
      });

      await createAuditLog(
        req.user!.id,
        req.user!.role,
        'update',
        'service',
        service.id,
        data,
        req
      );

      res.json(service);
    } catch (error) {
      logger.error('Update service error:', error);
      res.status(500).json({ error: 'Error al actualizar servicio' });
    }
  }
);

router.delete(
  '/api/admin/services/:id',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.service.update({
        where: { id },
        data: { active: false },
      });

      await createAuditLog(
        req.user!.id,
        req.user!.role,
        'delete',
        'service',
        id,
        null,
        req
      );

      res.json({ success: true });
    } catch (error) {
      logger.error('Delete service error:', error);
      res.status(500).json({ error: 'Error al eliminar servicio' });
    }
  }
);

// Barbers
router.get(
  '/api/admin/barbers',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const barbers = await prisma.barber.findMany({
        include: {
          user: {
            select: {
              email: true,
            },
          },
          services: {
            select: {
              serviceId: true,
            },
          },
        },
      });

      const response = barbers.map((b) => ({
        id: b.id,
        userId: b.userId,
        name: b.name,
        email: b.user.email,
        photoUrl: b.photoUrl,
        weeklySchedule: JSON.parse(b.weeklySchedule),
        exceptions: JSON.parse(b.exceptions),
        services: b.services.map((s) => s.serviceId),
      }));

      res.json(response);
    } catch (error) {
      logger.error('Get admin barbers error:', error);
      res.status(500).json({ error: 'Error al obtener barberos' });
    }
  }
);

router.post(
  '/api/admin/barbers',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, email, password, photoUrl, weeklySchedule, services } = createBarberSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'BARBER',
          barber: {
            create: {
              name,
              photoUrl: photoUrl || null,
              weeklySchedule,
              exceptions: '[]',
              services: {
                create: services.map((serviceId) => ({ serviceId })),
              },
            },
          },
        },
        include: {
          barber: {
            include: {
              services: true,
            },
          },
        },
      });

      await createAuditLog(
        req.user!.id,
        req.user!.role,
        'create',
        'barber',
        user.barber!.id,
        { email, name },
        req
      );

      res.json({
        id: user.barber!.id,
        userId: user.id,
        name: user.barber!.name,
        email: user.email,
        photoUrl: user.barber!.photoUrl,
        weeklySchedule: JSON.parse(user.barber!.weeklySchedule),
        exceptions: JSON.parse(user.barber!.exceptions),
        services,
      });
    } catch (error) {
      logger.error('Create barber error:', error);
      res.status(500).json({ error: 'Error al crear barbero' });
    }
  }
);

router.put(
  '/api/admin/barbers/:id',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = updateBarberSchema.parse(req.body);

      const barber = await prisma.barber.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!barber) {
        return res.status(404).json({ error: 'Barbero no encontrado' });
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
      if (data.weeklySchedule) updateData.weeklySchedule = data.weeklySchedule;

      if (data.email || data.password) {
        const userUpdate: any = {};
        if (data.email) userUpdate.email = data.email;
        if (data.password) userUpdate.passwordHash = await bcrypt.hash(data.password, 10);

        await prisma.user.update({
          where: { id: barber.userId },
          data: userUpdate,
        });
      }

      if (data.services) {
        await prisma.barberService.deleteMany({
          where: { barberId: id },
        });

        await prisma.barberService.createMany({
          data: data.services.map((serviceId) => ({
            barberId: id,
            serviceId,
          })),
        });
      }

      const updatedBarber = await prisma.barber.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              email: true,
            },
          },
          services: {
            select: {
              serviceId: true,
            },
          },
        },
      });

      await createAuditLog(
        req.user!.id,
        req.user!.role,
        'update',
        'barber',
        id,
        data,
        req
      );

      res.json({
        id: updatedBarber.id,
        userId: updatedBarber.userId,
        name: updatedBarber.name,
        email: updatedBarber.user.email,
        photoUrl: updatedBarber.photoUrl,
        weeklySchedule: JSON.parse(updatedBarber.weeklySchedule),
        exceptions: JSON.parse(updatedBarber.exceptions),
        services: updatedBarber.services.map((s) => s.serviceId),
      });
    } catch (error) {
      logger.error('Update barber error:', error);
      res.status(500).json({ error: 'Error al actualizar barbero' });
    }
  }
);

router.delete(
  '/api/admin/barbers/:id',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const barber = await prisma.barber.findUnique({
        where: { id },
      });

      if (!barber) {
        return res.status(404).json({ error: 'Barbero no encontrado' });
      }

      await prisma.user.delete({
        where: { id: barber.userId },
      });

      await createAuditLog(
        req.user!.id,
        req.user!.role,
        'delete',
        'barber',
        id,
        null,
        req
      );

      res.json({ success: true });
    } catch (error) {
      logger.error('Delete barber error:', error);
      res.status(500).json({ error: 'Error al eliminar barbero' });
    }
  }
);

// Clients
router.get(
  '/api/admin/clients',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const clients = await prisma.client.findMany({
        include: {
          _count: {
            select: { appointments: true },
          },
        },
        orderBy: { fullName: 'asc' },
      });

      const response: ClientWithStats[] = clients.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        phoneE164: c.phoneE164,
        email: c.email,
        notes: c.notes || undefined,
        appointmentCount: c._count.appointments,
      }));

      res.json(response);
    } catch (error) {
      logger.error('Get admin clients error:', error);
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  }
);

// ============ NOTIFICATION ROUTES ============

router.post('/api/push/subscribe', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription is required' });
    }

    // Store subscription in database (you can extend Client model to store this)
    logger.info('Push subscription received');

    res.json({ success: true });
  } catch (error) {
    logger.error('Push subscribe error:', error);
    res.status(500).json({ error: 'Error al suscribirse' });
  }
});

router.get('/api/config/vapid-public-key', apiLimiter, async (req: Request, res: Response) => {
  try {
    const config = await prisma.config.findFirst();

    if (!config || !config.vapidPublicKey) {
      return res.status(404).json({ error: 'VAPID key not found' });
    }

    res.json({ publicKey: config.vapidPublicKey });
  } catch (error) {
    logger.error('Get VAPID key error:', error);
    res.status(500).json({ error: 'Error al obtener clave VAPID' });
  }
});

router.put(
  '/api/admin/config',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = updateConfigSchema.parse(req.body);

      const config = await prisma.config.findFirst();

      if (!config) {
        return res.status(404).json({ error: 'Configuración no encontrada' });
      }

      const updateData: any = {};
      if (data.businessName) updateData.businessName = data.businessName;
      if (data.timezone) updateData.timezone = data.timezone;
      if (data.currency) updateData.currency = data.currency;
      if (data.primaryColor) updateData.primaryColor = data.primaryColor;
      if (data.secondaryColor) updateData.secondaryColor = data.secondaryColor;
      if (data.homepageTitle) updateData.homepageTitle = data.homepageTitle;
      if (data.homepageDescription) updateData.homepageDescription = data.homepageDescription;
      if (data.whatsappToken) updateData.whatsappTokenEnc = data.whatsappToken;
      if (data.whatsappPhoneNumberId) updateData.whatsappPhoneNumberId = data.whatsappPhoneNumberId;
      if (data.whatsappBusinessId) updateData.whatsappBusinessId = data.whatsappBusinessId;
      if (data.whatsappFromNumber) updateData.whatsappFromNumber = data.whatsappFromNumber;

      await prisma.config.update({
        where: { id: config.id },
        data: updateData,
      });

      await createAuditLog(
        req.user!.id,
        req.user!.role,
        'update',
        'config',
        config.id,
        data,
        req
      );

      res.json({ success: true });
    } catch (error) {
      logger.error('Update config error:', error);
      res.status(500).json({ error: 'Error al actualizar configuración' });
    }
  }
);

// ============ CALENDAR ROUTES ============

router.get('/api/calendar/ics/:id', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        barber: true,
        client: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const { createEvent } = await import('ics');

    const startDate = new Date(appointment.startDateTime);
    const endDate = new Date(appointment.endDateTime);

    const event = {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ] as [number, number, number, number, number],
      end: [
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes(),
      ] as [number, number, number, number, number],
      title: `${appointment.service?.name} - Sparta Barbería`,
      description: `Servicio: ${appointment.service?.name}\nBarbero: ${appointment.barber?.name}\nCliente: ${appointment.client?.fullName}${appointment.notes ? `\n\nNotas: ${appointment.notes}` : ''}`,
      location: 'Sparta Barbería',
      status: 'CONFIRMED' as const,
      busyStatus: 'BUSY' as const,
      organizer: {
        name: 'Sparta Barbería',
        email: 'citas@spartabarberia.com',
      },
      attendees: [
        {
          name: appointment.client?.fullName || 'Cliente',
          email: appointment.client?.email || '',
        },
      ],
    };

    createEvent(event, (error, value) => {
      if (error) {
        logger.error('Create ICS error:', error);
        return res.status(500).json({ error: 'Error al crear archivo ICS' });
      }

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename=cita-${id}.ics`);
      res.send(value);
    });
  } catch (error) {
    logger.error('Get ICS error:', error);
    res.status(500).json({ error: 'Error al generar archivo ICS' });
  }
});

export default router;
