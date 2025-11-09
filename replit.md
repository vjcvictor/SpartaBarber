# Barbería Sparta Booking System

## Overview

Barbería Sparta is a full-stack appointment booking system for a Colombian barbershop. The application enables clients to book appointments online through a multi-step booking flow, while providing admin and barber staff with tools to manage services, schedules, appointments, and clients. The system features real-time availability checking, WhatsApp notifications, push notifications, and comprehensive audit logging.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite for fast development and optimized production builds
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query for server state management and caching
- Zustand for client-side state management (booking flow)
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens

**Design System:**
The application follows a custom design system documented in `design_guidelines.md` with:
- Colombian barbershop aesthetic using warm earth tones
- Primary color: Amber (#f59f0a) for CTAs and active states
- Dark neutrals and rich browns for professional appearance
- Accessible color contrasts (AA standard)
- Consistent spacing using Tailwind's spacing scale
- Typography hierarchy using Inter/Poppins fonts

**Component Architecture:**
- UI components in `client/src/components/ui/` (shadcn/ui primitives)
- Feature components in `client/src/components/` (booking flow, admin panels)
- Page-level components in `client/src/pages/`
- Reusable hooks in `client/src/hooks/`

**State Management:**
- Zustand store (`client/src/lib/store.ts`) manages booking flow state across steps
- TanStack Query handles server state, caching, and optimistic updates
- Local component state for UI interactions

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Prisma ORM for database interactions
- PostgreSQL database (via Neon serverless)
- JWT-based authentication with httpOnly cookies
- bcryptjs for password hashing
- Zod for runtime validation

**API Design:**
RESTful API endpoints organized in `server/routes.ts`:
- `/api/auth/*` - Authentication (login, register, logout, session check)
- `/api/services/*` - Service CRUD operations
- `/api/barbers/*` - Barber management and availability
- `/api/appointments/*` - Appointment booking and management
- `/api/clients/*` - Client information management
- `/api/admin/*` - Admin-specific operations (stats, configuration)
- `/api/availability` - Real-time slot availability checking
- `/api/calendar/ics/:id` - iCalendar file generation for appointments

**Authentication & Authorization:**
- Role-based access control (ADMIN, BARBER, CLIENT)
- JWT tokens stored in httpOnly, sameSite='lax' cookies
- CSRF protection via SameSite cookies and Origin/Referer validation
- Middleware chain: `authMiddleware` → `requireRole` → route handler
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)

**Security Measures:**
- Defense-in-depth CSRF protection (documented in `server/middleware/csrf.ts`)
- Password requirements: minimum 8 characters for clients, 6 for staff
- Secure session management with environment-required SESSION_SECRET
- IP and User-Agent logging for audit trails
- Trust proxy configuration for Replit deployment

**Availability Calculation:**
Service in `server/services/availability.ts` calculates available time slots by:
1. Fetching barber's weekly schedule and exceptions
2. Checking for date-specific closures
3. Generating time slots based on service duration
4. Filtering out existing appointments and breaks
5. Returning slots in Colombia timezone (America/Bogota)

**Notification System:**
Services in `server/services/notifications.ts`:
- WhatsApp notifications via Meta Cloud API
- Web push notifications using VAPID keys
- Notification logging for audit purposes
- Configurable per global settings

### Database Architecture

**ORM & Schema Management:**
- Prisma ORM with PostgreSQL dialect
- Schema defined in `shared/schema.ts` (TypeScript types) and Prisma schema
- Migrations stored in `migrations/` directory
- Drizzle kit configured as backup option (`drizzle.config.ts`)

**Core Data Models:**
- **User**: Authentication and role management (ADMIN, BARBER, CLIENT)
- **Client**: Customer information with phone (E.164), email, visit history
- **Service**: Barbershop services with duration, pricing, icons
- **Barber**: Staff profiles with photos, weekly schedules, exceptions
- **Appointment**: Bookings with status tracking (PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
- **Config**: Global configuration (business info, VAPID keys, WhatsApp credentials)
- **AuditLog**: Comprehensive change tracking with user, action, entity, diff
- **NotificationLog**: Delivery tracking for WhatsApp and push notifications

**Schedule Management:**
- Weekly schedules stored as JSON: `{ dayOfWeek, start, end, breaks[] }`
- Schedule exceptions for holidays/special dates
- Timezone-aware date handling (America/Bogota)

**Data Relationships:**
- Appointments link Service, Barber, and Client
- Audit logs reference Users but remain when users are deleted (nullable foreign key)
- Notification logs track delivery per appointment

### External Dependencies

**Database:**
- Neon serverless PostgreSQL (via `@neondatabase/serverless`)
- Connection via DATABASE_URL environment variable
- Prisma Client for type-safe queries

**Third-Party Services:**
- **WhatsApp Business API**: Cloud API for appointment confirmations and reminders
  - Credentials: `whatsappTokenEnc`, `whatsappPhoneNumberId` in Config table
  - Phone numbers in E.164 format via `libphonenumber-js`
- **Web Push Notifications**: VAPID-based push notifications
  - Keys generated via `web-push` library
  - Keys stored in Config table (encrypted in production)

**Development Tools:**
- Replit-specific plugins for dev banner, cartographer, runtime error overlay
- Winston for structured logging with daily rotation
- node-cron for scheduled tasks (appointment reminders)

**Frontend Libraries:**
- shadcn/ui components (Radix UI primitives)
- date-fns and date-fns-tz for timezone-aware date manipulation
- react-hook-form with Zod resolver for form validation
- recharts for admin dashboard visualizations
- lucide-react for icons

**Build & Deployment:**
- Vite for frontend bundling
- esbuild for backend bundling
- Service worker (`public/service-worker.js`) for PWA capabilities and push notifications
- Environment detection for development vs production features

## Recent Changes

### November 2025 - Critical Bug Fixes

**Booking Flow & Admin Panel Fixes:**

1. **BookingFlow Step 4 Rendering** (client/src/pages/BookingFlow.tsx)
   - **Issue**: Confirmation step (Step 4) wasn't rendering, preventing users from seeing booking summary
   - **Fix**: Added conditional rendering `{currentStep === 4 && <BookingReview />}`

2. **Datetime Validation with Timezone** (shared/schema.ts)
   - **Issue**: `createAppointmentSchema` rejected ISO timestamps with timezone offsets (e.g., "2025-11-10T09:00:00-05:00")
   - **Fix**: Changed `z.string().datetime()` to `z.string().datetime({ offset: true })`

3. **Admin Dialog Handlers** (client/src/pages/admin/Services.tsx, Barbers.tsx)
   - **Issue**: "Nuevo Servicio" and "Nuevo Barbero" buttons didn't open dialogs
   - **Fix**: Updated `handleDialogClose` to accept boolean parameter from `onOpenChange` callback

4. **Missing /book Route** (client/src/App.tsx)
   - **Issue**: Booking flow was unreachable from client-side routing
   - **Fix**: Added `<Route path="/book" component={BookingFlow}/>`

5. **Availability Validation Unification** (server/routes.ts)
   - **Issue**: POST /api/appointments used custom Prisma query for validation while frontend used `calculateAvailableSlots()`, causing discrepancies
   - **Fix**: Replaced custom query with call to `calculateAvailableSlots()` for consistent validation logic

6. **Type Mismatch in calculateAvailableSlots** (server/routes.ts)
   - **Issue**: Passing Date object to function expecting string "YYYY-MM-DD", causing 500 errors
   - **Fix**: Added `const dateStr = format(startDate, 'yyyy-MM-dd')` before calling `calculateAvailableSlots`

7. **Array Comparison Bug** (server/routes.ts)
   - **Issue**: Used `.includes(requestedTime)` on array of TimeSlot objects instead of string array, always returning false
   - **Fix**: Changed to `availableSlots.some(slot => slot.startTime === requestedTime && slot.available)`

**Testing**: All fixes verified with end-to-end Playwright tests covering booking flow, admin CRUD, and availability validation.

**Architect Review**: Approved with recommendations for future hardening (use `formatInTimeZone`, investigate console NaN warnings, extend edge case coverage).