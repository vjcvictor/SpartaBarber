import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import BarberLayout from '@/components/BarberLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Clock, Users } from 'lucide-react';
import type { Appointment } from '@shared/schema';

const TIMEZONE = 'America/Bogota';

interface BarberStats {
  appointmentsToday: number;
  appointmentsTotal: number;
  barberName: string;
}

export default function BarberDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<BarberStats>({
    queryKey: ['/api/barber/stats'],
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/barber/appointments'],
  });

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const todayAppointments = appointments?.filter((appt) => {
    const apptDate = new Date(appt.startDateTime);
    return apptDate >= startOfToday && 
           apptDate < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000) &&
           (appt.status === 'agendado' || appt.status === 'reagendado');
  }) || [];

  function formatDateTime(dateTime: string) {
    const zonedDate = toZonedTime(new Date(dateTime), TIMEZONE);
    return format(zonedDate, "HH:mm");
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'agendado':
        return <Badge data-testid={`badge-status-${status}`}>Agendado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive" data-testid={`badge-status-${status}`}>Cancelado</Badge>;
      case 'reagendado':
        return <Badge variant="secondary" data-testid={`badge-status-${status}`}>Reagendado</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  }

  return (
    <BarberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-welcome-barber">
            Bienvenido, {stats?.barberName || 'Barbero'}
          </h1>
          <p className="text-muted-foreground">
            Administra tus citas y visualiza tu agenda
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-appointments-today">
                  {stats?.appointmentsToday || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-appointments-total">
                  {stats?.appointmentsTotal || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Cita</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-next-appointment">
                  {todayAppointments.length > 0 ? formatDateTime(todayAppointments[0].startDateTime) : '-'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Citas de Hoy</CardTitle>
            <CardDescription>
              {todayAppointments.length} cita{todayAppointments.length !== 1 ? 's' : ''} programada{todayAppointments.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No tienes citas para hoy
                      </TableCell>
                    </TableRow>
                  ) : (
                    todayAppointments.map((appt) => (
                      <TableRow key={appt.id} data-testid={`row-appointment-${appt.id}`}>
                        <TableCell className="font-medium" data-testid="text-appointment-time">
                          {formatDateTime(appt.startDateTime)}
                        </TableCell>
                        <TableCell data-testid="text-client-name">
                          {appt.client?.fullName || 'N/A'}
                        </TableCell>
                        <TableCell data-testid="text-service-name">
                          {appt.service?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appt.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </BarberLayout>
  );
}
