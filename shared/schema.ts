import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phoneE164: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Service types
export interface Service {
  id: string;
  name: string;
  category: string;
  icon: string;
  priceCOP: number;
  description: string;
  durationMin: number;
  active: boolean;
}

// Barber types
export const weeklyScheduleItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  breaks: z.array(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })),
});

export const weeklyScheduleSchema = z.array(weeklyScheduleItemSchema);

export interface WeeklySchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  start: string; // "09:00"
  end: string; // "17:30"
  breaks: { start: string; end: string }[];
}

export interface ScheduleException {
  date: string; // "2025-05-10"
  start?: string;
  end?: string;
  closed: boolean;
}

export interface Barber {
  id: string;
  name: string;
  photoUrl: string | null;
  weeklySchedule: WeeklySchedule[];
  exceptions: ScheduleException[];
  services: string[]; // service IDs
}

// Client types
export interface Client {
  id: string;
  fullName: string;
  phoneE164: string;
  email: string;
  notes?: string;
}

// Appointment types
export interface Appointment {
  id: string;
  serviceId: string;
  barberId: string;
  clientId: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  status: 'agendado' | 'cancelado' | 'reagendado' | 'completado';
  notes?: string;
  createdByRole: 'ADMIN' | 'BARBER' | 'CLIENT';
  service?: Service;
  barber?: Barber;
  client?: Client;
}

export const createAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  barberId: z.string().uuid(),
  startDateTime: z.string().datetime({ offset: true }),
  clientData: z.object({
    fullName: z.string().min(2),
    phoneE164: z.string(),
    email: z.string().email(),
    notes: z.string().optional(),
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const rescheduleAppointmentSchema = z.object({
  newStartDateTime: z.string().datetime({ offset: true }),
  newBarberId: z.string().uuid().optional(),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

export const updateAppointmentSchema = z.object({
  status: z.enum(['agendado', 'cancelado', 'reagendado', 'completado']).optional(),
  notes: z.string().optional(),
  startDateTime: z.string().datetime({ offset: true }).optional(),
  barberId: z.string().uuid().optional(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// Availability types
export const availabilityRequestSchema = z.object({
  serviceId: z.string().uuid(),
  barberId: z.string().uuid(),
  date: z.string(), // "2025-11-10"
  excludeAppointmentId: z.string().uuid().optional(), // Optional: exclude this appointment when calculating (for rescheduling)
});

export type AvailabilityRequest = z.infer<typeof availabilityRequestSchema>;

export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string; // "09:30"
  available: boolean;
}

// Config types
export interface Config {
  id: string;
  businessName: string;
  timezone: string;
  currency: string;
  primaryColor: string;
  secondaryColor: string;
  homepageTitle: string;
  homepageDescription: string;
  vapidPublicKey: string | null;
  whatsappEnabled: boolean;
  smtpEnabled: boolean;
}

// Stats types
export interface DashboardTimeSeriesPoint {
  date: string; // YYYY-MM-DD
  appointments: number;
  revenueCOP: number;
}

export interface DashboardStats {
  totalAppointments: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  totalClients: number;
  totalRevenueCOP: number;
  revenueThisMonth: number;
  timeSeries: DashboardTimeSeriesPoint[];
}

export const adminStatsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// User types
export type AccessibleRole = 'ADMIN' | 'BARBER' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'BARBER' | 'CLIENT';
  barberId?: string;
  accessibleRoles: AccessibleRole[];
}

export interface AuthResponse {
  user: User;
}

// Admin CRUD schemas
export const createServiceSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  icon: z.string().min(1),
  priceCOP: z.number().int().positive(),
  description: z.string().min(1),
  durationMin: z.number().int().positive(),
  active: z.boolean().default(true),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial();

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export const createBarberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  photoUrl: z.string().optional(),
  weeklySchedule: z.string(), // JSON string
  services: z.array(z.string().uuid()),
});

export type CreateBarberInput = z.infer<typeof createBarberSchema>;

export const updateBarberSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  photoUrl: z.string().optional(),
  weeklySchedule: z.string().optional(),
  services: z.array(z.string().uuid()).optional(),
});

export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;

export const updateConfigSchema = z.object({
  businessName: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  homepageTitle: z.string().optional(),
  homepageDescription: z.string().optional(),
  whatsappToken: z.string().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  whatsappBusinessId: z.string().optional(),
  whatsappFromNumber: z.string().optional(),
});

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;

export interface ClientWithStats extends Client {
  appointmentCount: number;
}

export interface AdminConfig extends Config {
  whatsappToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappBusinessId?: string;
  whatsappFromNumber?: string;
  vapidPrivateKey?: string;
}

// Profile update schemas
export const updateAdminProfileSchema = z.object({
  email: z.string().email().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Debe proporcionar la contraseña actual para cambiar la contraseña',
    path: ['currentPassword'],
  }
);

export type UpdateAdminProfileInput = z.infer<typeof updateAdminProfileSchema>;

export const updateBarberProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional(),
  weeklySchedule: z.string().optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Debe proporcionar la contraseña actual para cambiar la contraseña',
    path: ['currentPassword'],
  }
);

export type UpdateBarberProfileInput = z.infer<typeof updateBarberProfileSchema>;

export const updateClientProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phoneE164: z.string().min(10).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Debe proporcionar la contraseña actual para cambiar la contraseña',
    path: ['currentPassword'],
  }
);

export type UpdateClientProfileInput = z.infer<typeof updateClientProfileSchema>;

// Barber Dashboard types
export interface BarberDashboardTimeSeriesPoint {
  date: string; // YYYY-MM-DD
  appointments: number;
  revenueCOP: number;
}

export interface ServiceBreakdown {
  serviceId: string;
  serviceName: string;
  appointments: number;
  revenueCOP: number;
}

export interface BarberDashboardStats {
  barberName: string;
  // Métricas filtradas (en el período)
  periodAppointments: number;
  periodRevenueCOP: number;
  // Métricas globales
  appointmentsToday: number;
  totalAppointments: number;
  uniqueClientsInPeriod: number;
  // Datos de gráficas
  timeSeries: BarberDashboardTimeSeriesPoint[];
  serviceBreakdown: ServiceBreakdown[];
}

export const barberStatsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
