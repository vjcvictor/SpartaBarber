import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const prisma = new PrismaClient();
const TIMEZONE = 'America/Bogota';

async function verifyAppointments() {
  console.log('\n=== Verificando estado de las citas ===\n');

  // Obtener todas las citas con sus servicios
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

  console.log(`Total de citas en la base de datos: ${appointments.length}\n`);

  // Agrupar por estado
  const byStatus = appointments.reduce((acc, appt) => {
    acc[appt.status] = (acc[appt.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Citas por estado:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });

  // Encontrar citas pasadas que no están completadas
  const now = new Date();
  const pastNotCompleted = appointments.filter(
    appt => appt.startDateTime < now && appt.status !== 'completado' && appt.status !== 'cancelado'
  );

  console.log(`\nCitas pasadas que NO están marcadas como 'completado': ${pastNotCompleted.length}\n`);

  if (pastNotCompleted.length > 0) {
    console.log('Detalle de citas pasadas sin completar:');
    pastNotCompleted.slice(0, 10).forEach(appt => {
      const dateInBogota = toZonedTime(appt.startDateTime, TIMEZONE);
      console.log(`  - ${format(dateInBogota, 'yyyy-MM-dd HH:mm')} | ${appt.status} | ${appt.service.name} | $${appt.service.priceCOP.toLocaleString()}`);
    });
  }

  // Calcular ingresos potenciales vs reales
  const completedAppointments = appointments.filter(appt => appt.status === 'completado');
  const totalRevenue = completedAppointments.reduce((sum, appt) => sum + appt.service.priceCOP, 0);
  
  const potentialRevenue = appointments
    .filter(appt => appt.status !== 'cancelado')
    .reduce((sum, appt) => sum + appt.service.priceCOP, 0);

  console.log('\n=== Análisis de Ingresos ===');
  console.log(`Ingresos actuales (solo completadas): $${totalRevenue.toLocaleString()}`);
  console.log(`Ingresos potenciales (agendadas + reagendadas + completadas): $${potentialRevenue.toLocaleString()}`);
  console.log(`Diferencia: $${(potentialRevenue - totalRevenue).toLocaleString()}\n`);

  console.log('NOTA IMPORTANTE:');
  console.log('El sistema solo cuenta ingresos de citas marcadas como "completado".');
  console.log('Las citas en estado "agendado" o "reagendado" NO se cuentan en los ingresos,');
  console.log('incluso si ya pasaron. Esto es correcto porque:');
  console.log('  1. No todas las citas agendadas se presentan (no-shows)');
  console.log('  2. El barbero debe confirmar que atendió al cliente');
  console.log('\nPara que una cita cuente en los ingresos, debe marcarla como "completado"');
  console.log('en el panel de administración o barbero.\n');

  await prisma.$disconnect();
}

verifyAppointments().catch(console.error);
