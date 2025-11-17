import { prisma } from '../lib/prisma';
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { addMinutes, parse, isBefore, isAfter, isWithinInterval, parseISO, startOfDay as dateFnsStartOfDay } from 'date-fns';
import type { WeeklySchedule, ScheduleException, TimeSlot } from '../../shared/schema';

const TIMEZONE = 'America/Bogota';

export async function calculateAvailableSlots(
  serviceId: string,
  barberId: string,
  dateStr: string, // "2025-11-10"
  excludeAppointmentId?: string // Optional: exclude this appointment when calculating availability (for rescheduling)
): Promise<TimeSlot[]> {
  // Get service duration
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { durationMin: true, active: true },
  });

  if (!service || !service.active) {
    throw new Error('Servicio no encontrado o inactivo');
  }

  const durationMin = service.durationMin;

  // Get barber schedule
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    select: { weeklySchedule: true, exceptions: true },
  });

  if (!barber) {
    throw new Error('Barbero no encontrado');
  }

  const weeklySchedule: WeeklySchedule[] = JSON.parse(barber.weeklySchedule);
  const exceptions: ScheduleException[] = JSON.parse(barber.exceptions);

  // Parse the requested date
  const requestedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
  const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 6 = Saturday

  // Check for exceptions on this date
  const exception = exceptions.find((ex) => ex.date === dateStr);
  if (exception?.closed) {
    return [];
  }

  // Get day schedule
  let daySchedule: WeeklySchedule | undefined;
  
  if (exception && exception.start && exception.end) {
    // Use exception schedule
    daySchedule = {
      dayOfWeek,
      start: exception.start,
      end: exception.end,
      breaks: [],
    };
  } else {
    // Use weekly schedule
    daySchedule = weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
  }

  if (!daySchedule) {
    return [];
  }

  // Get existing appointments for this barber on this date
  const startOfDay = fromZonedTime(
    parse(`${dateStr} 00:00`, 'yyyy-MM-dd HH:mm', new Date()),
    TIMEZONE
  );
  const endOfDay = fromZonedTime(
    parse(`${dateStr} 23:59`, 'yyyy-MM-dd HH:mm', new Date()),
    TIMEZONE
  );

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      barberId,
      startDateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ['agendado', 'reagendado'],
      },
      // Exclude the appointment being rescheduled
      ...(excludeAppointmentId && {
        id: {
          not: excludeAppointmentId,
        },
      }),
    },
    select: {
      startDateTime: true,
      endDateTime: true,
    },
  });

  // Get current time in Colombia timezone
  const nowInColombia = toZonedTime(new Date(), TIMEZONE);
  const requestedDateStart = dateFnsStartOfDay(requestedDate);
  const todayInColombia = dateFnsStartOfDay(nowInColombia);
  const isToday = requestedDateStart.getTime() === todayInColombia.getTime();

  // Generate all possible time slots
  const slots: TimeSlot[] = [];
  const [startHour, startMin] = daySchedule.start.split(':').map(Number);
  const [endHour, endMin] = daySchedule.end.split(':').map(Number);

  const dayStart = parse(`${dateStr} ${daySchedule.start}`, 'yyyy-MM-dd HH:mm', new Date());
  const dayEnd = parse(`${dateStr} ${daySchedule.end}`, 'yyyy-MM-dd HH:mm', new Date());

  let currentSlot = dayStart;

  while (isBefore(currentSlot, dayEnd)) {
    const slotEnd = addMinutes(currentSlot, durationMin);

    // Check if slot end is after day end
    if (isAfter(slotEnd, dayEnd)) {
      break;
    }

    // Check if slot is during a break
    let isDuringBreak = false;
    for (const brk of daySchedule.breaks) {
      const breakStart = parse(`${dateStr} ${brk.start}`, 'yyyy-MM-dd HH:mm', new Date());
      const breakEnd = parse(`${dateStr} ${brk.end}`, 'yyyy-MM-dd HH:mm', new Date());

      if (
        isWithinInterval(currentSlot, { start: breakStart, end: breakEnd }) ||
        isWithinInterval(slotEnd, { start: breakStart, end: breakEnd }) ||
        (isBefore(currentSlot, breakStart) && isAfter(slotEnd, breakEnd))
      ) {
        isDuringBreak = true;
        break;
      }
    }

    if (isDuringBreak) {
      currentSlot = addMinutes(currentSlot, 15); // Move to next 15-min interval
      continue;
    }

    // Check if slot conflicts with existing appointments
    const slotStartUTC = fromZonedTime(currentSlot, TIMEZONE);
    const slotEndUTC = fromZonedTime(slotEnd, TIMEZONE);

    let hasConflict = false;
    for (const appt of existingAppointments) {
      const apptStart = parseISO(appt.startDateTime.toISOString());
      const apptEnd = parseISO(appt.endDateTime.toISOString());

      // Two appointments conflict if they overlap, but NOT if they just touch at boundaries
      // Conflict exists if: slotStart < apptEnd AND slotEnd > apptStart
      if (
        isBefore(slotStartUTC, apptEnd) && isAfter(slotEndUTC, apptStart)
      ) {
        hasConflict = true;
        break;
      }
    }

    // If it's today, skip slots that have already passed
    if (isToday) {
      // Compare slot start time with current time
      if (isBefore(currentSlot, nowInColombia) || currentSlot.getTime() === nowInColombia.getTime()) {
        currentSlot = addMinutes(currentSlot, 15);
        continue;
      }
    }

    // Only include available slots (skip occupied ones)
    if (!hasConflict) {
      slots.push({
        startTime: format(currentSlot, 'HH:mm', { timeZone: TIMEZONE }),
        endTime: format(slotEnd, 'HH:mm', { timeZone: TIMEZONE }),
        available: true,
      });
    }

    // Move to next 15-min interval
    currentSlot = addMinutes(currentSlot, 15);
  }

  return slots;
}
