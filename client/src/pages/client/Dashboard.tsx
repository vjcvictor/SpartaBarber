import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import ClientLayout from '@/components/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Clock, History, Plus, Bell, BellOff } from 'lucide-react';
import { useLocation } from 'wouter';
import { formatTime12Hour } from '@/lib/timeFormat';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import type { Appointment } from '@shared/schema';

const TIMEZONE = 'America/Bogota';

interface ClientStats {
  upcomingAppointments: number;
  totalAppointments: number;
  clientName: string;
}

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { isSupported, isSubscribed, isLoading: pushLoading, error: pushError, subscribe, unsubscribe } = usePushNotifications();

  const { data: stats, isLoading: statsLoading } = useQuery<ClientStats>({
    queryKey: ['/api/client/stats'],
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/client/appointments'],
  });

  const upcomingAppointments = appointments?.filter((appt) => {
    const apptDate = new Date(appt.startDateTime);
    return apptDate >= new Date() &&
      (appt.status === 'agendado' || appt.status === 'reagendado');
  }).slice(0, 5) || [];

  function formatDateTime(dateTime: string) {
    const zonedDate = toZonedTime(new Date(dateTime), TIMEZONE);
    const date = format(zonedDate, 'dd/MM/yyyy');
    const time24 = format(zonedDate, 'HH:mm');
    const time12 = formatTime12Hour(time24);
    return `${date} ${time12}`;
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
    <ClientLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-welcome-client">
              Bienvenido, {stats?.clientName || 'Cliente'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona tus citas y reserva nuevos servicios
            </p>
          </div>
          <Button onClick={() => setLocation('/book')} data-testid="button-new-appointment">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas Citas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-upcoming-appointments">
                  {stats?.upcomingAppointments || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Citas</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="stat-total-appointments">
                  {stats?.totalAppointments || 0}
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
                  {upcomingAppointments.length > 0
                    ? formatTime12Hour(format(toZonedTime(new Date(upcomingAppointments[0].startDateTime), TIMEZONE), "HH:mm"))
                    : '-'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones Push</CardTitle>
              {isSubscribed ? (
                <Bell className="h-4 w-4 text-green-600" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              {!isSupported ? (
                <p className="text-xs text-muted-foreground">No soportado en este navegador</p>
              ) : pushLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : isSubscribed ? (
                <div className="space-y-2">
                  <p className="text-xs text-green-600 font-medium">✓ Activadas</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={unsubscribe}
                    className="w-full"
                  >
                    Desactivar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Recibe alertas de tus citas</p>
                  <Button
                    size="sm"
                    onClick={subscribe}
                    className="w-full"
                  >
                    Activar
                  </Button>
                  {pushError && (
                    <p className="text-xs text-destructive">{pushError}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>
              {upcomingAppointments.length} cita{upcomingAppointments.length !== 1 ? 's' : ''} próxima{upcomingAppointments.length !== 1 ? 's' : ''}
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
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[550px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px] whitespace-nowrap">Fecha y Hora</TableHead>
                      <TableHead className="min-w-[100px]">Barbero</TableHead>
                      <TableHead className="min-w-[100px]">Servicio</TableHead>
                      <TableHead className="min-w-[90px]">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingAppointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No tienes citas próximas
                        </TableCell>
                      </TableRow>
                    ) : (
                      upcomingAppointments.map((appt) => (
                        <TableRow key={appt.id} data-testid={`row-appointment-${appt.id}`}>
                          <TableCell className="font-medium whitespace-nowrap" data-testid="text-appointment-datetime">
                            {formatDateTime(appt.startDateTime)}
                          </TableCell>
                          <TableCell data-testid="text-barber-name">
                            {appt.barber?.name || 'N/A'}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
