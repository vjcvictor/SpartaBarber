import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { parsePhoneNumber } from 'libphonenumber-js';
import { prisma } from './lib/prisma';
import logger from './lib/logger';
import { authMiddleware, requireRole, type AuthRequest } from './middleware/auth';
import { createAuditLog } from './middleware/audit';
import { calculateAvailableSlots } from './services/availability';
import {
  loginSchema,
  registerSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  availabilityRequestSchema,
  createServiceSchema,
  updateServiceSchema,
  createBarberSchema,
  updateBarberSchema,
  updateConfigSchema,
  type AuthResponse,
  type Service,
  type Barber,
  type Client,
  type Appointment,
  type Config,
  type DashboardStats,
  type ClientWithStats,
  type AdminConfig,
} from '../shared/schema';
import { fromZonedTime } from 'date-fns-tz';
import { addMinutes, isBefore, subHours, parseISO, format } from 'date-fns';

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

    const response: AuthResponse = {
      user: { id: user.id, email: user.email, role: user.role as 'ADMIN' | 'BARBER' | 'CLIENT' },
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

    const response: AuthResponse = {
      user: { id: user.id, email: user.email, role: user.role as 'ADMIN' | 'BARBER' | 'CLIENT' },
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
    const dateStr = format(startDate, 'yyyy-MM-dd');
    const availableSlots = await calculateAvailableSlots(serviceId, barberId, dateStr);
    const requestedTime = format(startDate, 'HH:mm');
    
    if (!availableSlots.includes(requestedTime)) {
      logger.warn('Slot not available', { 
        barberId, 
        startDate: startDate.toISOString(), 
        requestedTime,
        availableSlots 
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

// ============ ADMIN ROUTES ============

router.get(
  '/api/admin/stats',
  authMiddleware,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalAppointments,
        appointmentsToday,
        appointmentsThisWeek,
        appointmentsThisMonth,
        totalClients,
      ] = await Promise.all([
        prisma.appointment.count(),
        prisma.appointment.count({
          where: {
            startDateTime: { gte: startOfToday },
            status: { in: ['agendado', 'reagendado'] },
          },
        }),
        prisma.appointment.count({
          where: {
            startDateTime: { gte: startOfWeek },
            status: { in: ['agendado', 'reagendado'] },
          },
        }),
        prisma.appointment.count({
          where: {
            startDateTime: { gte: startOfMonth },
            status: { in: ['agendado', 'reagendado'] },
          },
        }),
        prisma.client.count(),
      ]);

      const appointmentsWithServices = await prisma.appointment.findMany({
        where: {
          status: { in: ['agendado', 'reagendado'] },
        },
        include: {
          service: true,
        },
      });

      const totalRevenueCOP = appointmentsWithServices.reduce(
        (sum, appt) => sum + appt.service.priceCOP,
        0
      );

      const revenueThisMonth = appointmentsWithServices
        .filter((appt) => appt.startDateTime >= startOfMonth)
        .reduce((sum, appt) => sum + appt.service.priceCOP, 0);

      const stats: DashboardStats = {
        totalAppointments,
        appointmentsToday,
        appointmentsThisWeek,
        appointmentsThisMonth,
        totalClients,
        totalRevenueCOP,
        revenueThisMonth,
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
