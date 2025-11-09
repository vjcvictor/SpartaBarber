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
import { Calendar, Clock, History, Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import type { Appointment } from '@shared/schema';

const TIMEZONE = 'America/Bogota';

interface ClientStats {
  upcomingAppointments: number;
  totalAppointments: number;
  clientName: string;
}

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  
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
    return format(zonedDate, "dd/MM/yyyy HH:mm");
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-welcome-client">
              Bienvenido, {stats?.clientName || 'Cliente'}
            </h1>
            <p className="text-muted-foreground">
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
                    ? format(toZonedTime(new Date(upcomingAppointments[0].startDateTime), TIMEZONE), "HH:mm")
                    : '-'}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Barbero</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
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
                        <TableCell className="font-medium" data-testid="text-appointment-datetime">
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
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
