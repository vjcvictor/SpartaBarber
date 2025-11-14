# Barbería Sparta Booking System

## Overview
Barbería Sparta is a full-stack appointment booking system for a Colombian barbershop. It allows clients to book appointments online through a multi-step flow and provides admin/barber staff with tools to manage services, schedules, appointments, and clients. Key features include real-time availability, WhatsApp and push notifications, and comprehensive audit logging. The project aims to provide a professional and efficient booking experience, enhancing customer satisfaction and streamlining barbershop operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack:** React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state, Zustand for client state, shadcn/ui (Radix UI), and Tailwind CSS.
- **Design System:** Custom design system (`design_guidelines.md`) with a Colombian barbershop aesthetic, warm earth tones (primary Amber `#f59f0a`), accessible color contrasts, and Inter/Poppins typography.
- **Component Architecture:** Organized UI components, feature-specific components (booking flow, admin panels), page-level components, and reusable hooks.
- **State Management:** Zustand manages booking flow, TanStack Query handles server state and caching, and local component state for UI interactions.

### Backend Architecture
- **Technology Stack:** Express.js with TypeScript, Prisma ORM, PostgreSQL (Neon serverless), JWT-based authentication (httpOnly cookies), bcryptjs for hashing, and Zod for validation.
- **API Design:** RESTful API with endpoints for authentication, services, barbers, appointments, clients, admin operations, real-time availability, and iCalendar generation.
- **Authentication & Authorization:** Role-based access control (ADMIN, BARBER, CLIENT), JWT tokens in httpOnly cookies, CSRF protection, and rate limiting on auth endpoints.
  - **Multi-Role Support:** Users can have multiple accessible roles (e.g., ADMIN user can also be a BARBER). The `accessibleRoles` array is calculated based on related records and included in all auth responses.
  - **Admin-Barber Access:** ADMIN users with an associated Barber record can access both admin and barber panels. The `requireBarberAccess()` middleware validates that the user has barber permissions and assigns the appropriate `barberId`.
- **Security Measures:** Defense-in-depth CSRF, password requirements, secure session management, IP/User-Agent logging, and trust proxy configuration.
- **Availability Calculation:** A dedicated service calculates available time slots considering barber schedules, exceptions, service duration, and existing appointments, returning results in America/Bogota timezone. **Past Time Filtering:** When calculating availability for today, slots that have already passed are automatically excluded to prevent booking appointments in the past.
- **Notification System:** Utilizes Meta Cloud API for WhatsApp and VAPID keys for web push notifications, with comprehensive logging and configurable settings.
- **Analytics & Reporting:** 
  - Admin and barber dashboards support date range filtering with query params (startDate, endDate).
  - Time-series aggregation provides daily appointment and revenue breakdowns.
  - Service breakdown analytics show distribution of appointments by service type.
  - All date filtering uses America/Bogota timezone with startOfDay/endOfDay normalization.
  - **Revenue Calculation:** Only appointments with status='completado' contribute to revenue metrics (prevents counting no-shows/cancelled appointments).
- **Appointment Status Management:**
  - Four status states: 'agendado', 'reagendado', 'completado', 'cancelado'
  - Admin endpoint PUT /api/admin/appointments/:id allows status updates with audit logging
  - UI provides "Marcar completado" button in admin appointments table for agendado/reagendado appointments
  - Status changes invalidate TanStack Query caches for appointments and statistics
  - Badge colors: agendado (green), reagendado (yellow), completado (blue), cancelado (red)

### Database Architecture
- **ORM & Schema:** Prisma ORM with PostgreSQL; schema defined in `shared/schema.ts` (TypeScript) and Prisma schema, with migrations in `migrations/`.
- **Core Data Models:** User, Client, Service, Barber, Appointment, Config, AuditLog, and NotificationLog.
- **Schedule Management:** Weekly schedules stored as JSON, supporting schedule exceptions and timezone-aware handling.
- **Data Relationships:** Appointments link services, barbers, and clients; audit logs reference users, and notification logs track delivery per appointment.

## External Dependencies

-   **Database:** Neon serverless PostgreSQL (via `@neondatabase/serverless`) for the primary data store.
-   **Third-Party Services:**
    -   **WhatsApp Business API (Meta Cloud API):** Used for appointment confirmations and reminders.
    -   **Web Push Notifications:** Implemented using VAPID keys for client notifications.
-   **Frontend Libraries:**
    -   `shadcn/ui`: Component library built on Radix UI primitives.
    -   `date-fns` and `date-fns-tz`: For robust, timezone-aware date manipulation.
    -   `react-hook-form` with `Zod` resolver: For form validation.
    -   `recharts`: For admin dashboard data visualizations.
    -   `lucide-react`: For icons throughout the application.
-   **Development Tools:**
    -   `Winston`: For structured logging.
    -   `node-cron`: For scheduled background tasks like reminders.
    -   `Vite`: Frontend bundling.
    -   `esbuild`: Backend bundling.
-   **PWA Capabilities:** Service worker (`public/service-worker.js`) for progressive web app features and push notification handling.