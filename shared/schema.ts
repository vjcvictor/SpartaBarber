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
  icon: string;
  priceCOP: number;
  description: string;
  durationMin: number;
  active: boolean;
}

// Barber types
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
  status: 'agendado' | 'cancelado' | 'reagendado';
  notes?: string;
  createdByRole: 'ADMIN' | 'BARBER' | 'CLIENT';
  service?: Service;
  barber?: Barber;
  client?: Client;
}

export const createAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  barberId: z.string().uuid(),
  startDateTime: z.string().datetime(),
  clientData: z.object({
    fullName: z.string().min(2),
    phoneE164: z.string(),
    email: z.string().email(),
    notes: z.string().optional(),
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const rescheduleAppointmentSchema = z.object({
  newStartDateTime: z.string().datetime(),
  newBarberId: z.string().uuid().optional(),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;

// Availability types
export const availabilityRequestSchema = z.object({
  serviceId: z.string().uuid(),
  barberId: z.string().uuid(),
  date: z.string(), // "2025-11-10"
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
export interface DashboardStats {
  totalAppointments: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsThisMonth: number;
  totalClients: number;
  totalRevenueCOP: number;
  revenueThisMonth: number;
}

// User types
export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'BARBER' | 'CLIENT';
}

export interface AuthResponse {
  user: User;
}

// Admin CRUD schemas
export const createServiceSchema = z.object({
  name: z.string().min(2),
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
