import { toZonedTime } from 'date-fns-tz';
import { differenceInMinutes, isBefore } from 'date-fns';

const TIMEZONE = 'America/Bogota';
const MIN_CANCELLATION_WINDOW_MINUTES = 60;
const MIN_RESCHEDULE_WINDOW_MINUTES = 60;

export interface AppointmentStateValidation {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates if an appointment can be marked as completed
 * Rule: Only allow if the appointment's start date/time has already passed
 */
export function canMarkAsCompleted(appointmentStartDateTime: Date): AppointmentStateValidation {
  const nowInColombia = toZonedTime(new Date(), TIMEZONE);
  const appointmentStartInColombia = toZonedTime(appointmentStartDateTime, TIMEZONE);

  if (isBefore(nowInColombia, appointmentStartInColombia)) {
    return {
      allowed: false,
      reason: 'No se puede marcar como completada una cita que aún no ha ocurrido',
    };
  }

  return { allowed: true };
}

/**
 * Validates if an appointment can be cancelled
 * Rule: Only allow if there are more than 60 minutes until the appointment
 */
export function canCancelAppointment(appointmentStartDateTime: Date): AppointmentStateValidation {
  const nowInColombia = toZonedTime(new Date(), TIMEZONE);
  const appointmentStartInColombia = toZonedTime(appointmentStartDateTime, TIMEZONE);

  const minutesUntilStart = differenceInMinutes(appointmentStartInColombia, nowInColombia);

  if (minutesUntilStart <= MIN_CANCELLATION_WINDOW_MINUTES) {
    return {
      allowed: false,
      reason: `No se puede cancelar una cita con menos de ${MIN_CANCELLATION_WINDOW_MINUTES} minutos de anticipación`,
    };
  }

  return { allowed: true };
}

/**
 * Validates if an appointment can be rescheduled
 * Rule: Only allow if there are more than 60 minutes until the appointment
 */
export function canRescheduleAppointment(appointmentStartDateTime: Date): AppointmentStateValidation {
  const nowInColombia = toZonedTime(new Date(), TIMEZONE);
  const appointmentStartInColombia = toZonedTime(appointmentStartDateTime, TIMEZONE);

  const minutesUntilStart = differenceInMinutes(appointmentStartInColombia, nowInColombia);

  if (minutesUntilStart <= MIN_RESCHEDULE_WINDOW_MINUTES) {
    return {
      allowed: false,
      reason: `No se puede reagendar una cita con menos de ${MIN_RESCHEDULE_WINDOW_MINUTES} minutos de anticipación`,
    };
  }

  return { allowed: true };
}

/**
 * Master validation function for state transitions
 */
export function validateStateTransition(
  currentStatus: string,
  newStatus: string,
  appointmentStartDateTime: Date
): AppointmentStateValidation {
  // Validate transition to 'completado'
  if (newStatus === 'completado') {
    return canMarkAsCompleted(appointmentStartDateTime);
  }

  // Validate transition to 'cancelado'
  if (newStatus === 'cancelado') {
    return canCancelAppointment(appointmentStartDateTime);
  }

  // Validate transition to 'reagendado'
  if (newStatus === 'reagendado') {
    return canRescheduleAppointment(appointmentStartDateTime);
  }

  // Other transitions are allowed
  return { allowed: true };
}
