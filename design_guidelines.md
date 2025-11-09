# Design Guidelines - Barbería Sparta Booking System

## Design Approach
**Reference-Based**: Inspired by Easy Appointments flow with modern Colombian barbershop aesthetic. Focus on clarity, efficiency, and trust-building through professional presentation.

## Color Palette & Usage

### Primary Colors
- **Amber Primary** `#f59f0a` - CTAs, active states, chips, progress indicators
- **Dark Neutral** `#1d1816` - Primary text, navigation bars, headers
- **Rich Brown** `#3a312c` - Section backgrounds, card headers, hover states
- **Soft Neutral** `#b8ac94` - Secondary backgrounds, borders, placeholders

### Background Strategy
- Base: `#f8f8f5` (warm off-white)
- Cards: White with subtle `#b8ac94` tinted borders (10% opacity)
- Section dividers: `#3a312c` at 5% opacity

### Button System
- **Primary**: `#f59f0a` fill, `#1d1816` text, subtle darken on hover
- **Secondary**: `#3a312c` border + text, transparent fill
- **Disabled**: 40% opacity on all states

### Accessibility
- Maintain AA contrast (4.5:1 minimum) across all text/control combinations
- Focus states: 2px `#f59f0a` outline with 2px offset

## Typography Hierarchy

### Font Selection
- **Primary**: Inter or Poppins (modern, clean sans-serif via Google Fonts)
- **Accent**: Optional DM Sans for headings

### Type Scale
- **H1**: 32px/40px, weight 700 (page titles, confirmation messages)
- **H2**: 24px/32px, weight 600 (step headers, section titles)
- **H3**: 18px/24px, weight 600 (card titles, barbero names)
- **Body**: 16px/24px, weight 400 (descriptions, form labels)
- **Small**: 14px/20px, weight 400 (meta info, timestamps)
- **Caption**: 12px/16px, weight 500 (badges, helper text)

## Layout System

### Spacing Primitives (Tailwind)
Use consistent units: `2, 4, 6, 8, 12, 16, 24` for spacing
- Tight spacing: `p-2, gap-2` (chips, inline elements)
- Standard: `p-4, gap-4` (cards, form fields)
- Generous: `p-8, gap-8` (sections, containers)
- Extra: `py-12, py-16` (page sections)

### Grid System
- **Mobile**: Single column, full width
- **Tablet (md:)**: 2 columns for cards, services
- **Desktop (lg:)**: 3-4 columns for service/barbero grids

### Container Widths
- Main content: `max-w-6xl mx-auto`
- Forms: `max-w-2xl mx-auto`
- Admin tables: `max-w-7xl mx-auto`

## 4-Step Booking Flow Design

### Progress Indicator
- Horizontal stepper with 4 nodes
- Active: `#f59f0a` fill, connected line
- Completed: `#f59f0a` with checkmark
- Inactive: `#b8ac94` outline
- Labels below each step in 14px

### Step 1: Service + Barbero (Single Screen)
- **Services Grid**: 2-3 columns, cards with icon (64px), service name (H3), duration + price (caption), short description
- **Barberos Grid**: After service selection, show filtered barberos with circular photo (80px), name (H3), brief bio
- Selection: Border highlight `#f59f0a` 3px, subtle scale transform

### Step 2: Date + Time (Single Screen)
- **Date Tabs**: "Hoy / Mañana / Otra fecha" with calendar picker
- **Time Slots**: Grid of available times in 12h format (9:00 AM), 3-4 columns, pills with `#3a312c` border, selected gets `#f59f0a` fill
- Real-time updates with skeleton loaders during availability checks

### Step 3: Client Data + Review
- **Form Section**: 
  - Full name (required)
  - Phone with country selector (+57 default, flag icon)
  - Email (required, unique identifier)
  - Notes (textarea, optional)
- **Review Card**: Summary with service icon, barbero photo, datetime, price total in COP format (e.g., $25.000)
- Prominent "Confirmar Cita" button

### Step 4: Confirmation
- Success icon (checkmark in `#f59f0a` circle, 120px)
- Confirmation message (H1)
- Appointment details card (same styling as review)
- Action buttons: "Descargar .ics", "Agendar otra cita", "Crear perfil (opcional)"
- "Iniciar sesión" button (secondary style)

### Navigation
- "Atrás" button maintains form state, pre-fills data
- "Iniciar sesión" only on landing page and confirmation screen

## Admin Panel Design

### Dashboard Cards
- 4-metric grid: Total appointments, Active barbers, Revenue (COP), Average rating
- Cards: white background, `#3a312c` border, icon + number + label
- Charts: Use `#f59f0a` for primary data series

### Data Tables
- Zebra striping with `#f8f8f5` alternating rows
- Headers: `#3a312c` background, white text
- Action buttons: Icon-only in `#f59f0a` with tooltips
- Filters: Dropdowns with `#b8ac94` borders above table

### Forms (CRUD)
- Two-column layout on desktop
- Labels above inputs (14px, `#1d1816`)
- Inputs: 40px height, `#b8ac94` border, `#f59f0a` focus ring
- Helper text below in 12px `#b8ac94`

## Component Library

### Cards
- Border: 1px `#b8ac94`, radius 8px
- Padding: `p-6`
- Shadow: subtle on hover `shadow-md`

### Buttons
- Height: 40px (standard), 48px (primary CTAs)
- Padding: `px-6`
- Border radius: 6px
- Transition: all 200ms ease

### Badges/Pills
- Small: 24px height, `px-3`, 12px text
- Colors: Success `#10b981`, Warning `#f59f0a`, Error `#ef4444`

### Modal/Dialogs
- Overlay: `#1d1816` at 60% opacity
- Content: white, max-width 500px, `p-6`, rounded-lg
- Close icon: top-right, `#b8ac94`

## Images Strategy
- **Barbero Photos**: Circular avatars, 80px in selection, 48px in cards
- **Service Icons**: Use consistent icon set (Heroicons), 24px in cards, 64px in selection
- **Landing Page**: Optional hero with barbershop interior, overlay with `#1d1816` at 40% for text readability
- **Gallery**: Admin can upload 3-5 shop photos in settings, displayed in 3-column grid on landing

## Responsive Behavior
- Mobile: Stack all grids to single column, reduce padding to `p-4`
- Tablet: 2 columns for cards, maintain spacing
- Desktop: Full multi-column layouts, max spacing

## Micro-interactions
- Keep minimal: hover states, focus rings, loading spinners
- No distracting animations
- Smooth transitions (200ms) for state changes
- Skeleton loaders for async data (services, slots)