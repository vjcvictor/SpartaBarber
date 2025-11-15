import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import ClientLayout from '@/components/ClientLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Appointment } from '@shared/schema';

const TIMEZONE = 'America/Bogota';
const PAGE_SIZE = 10;

export default function ClientAppointments() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/client/appointments'],
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/stats'] });
      toast({
        title: 'Cita cancelada',
        description: 'La cita se ha cancelado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al cancelar la cita',
        variant: 'destructive',
      });
    },
  });

  const filteredAppointments = appointments?.filter((appointment) => {
    if (statusFilter === 'all') return true;
    return appointment.status === statusFilter;
  }) || [];

  const paginatedAppointments = filteredAppointments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE);

  function formatDateTime(dateTime: string) {
    const zonedDate = toZonedTime(new Date(dateTime), TIMEZONE);
    return format(zonedDate, 'dd/MM/yyyy HH:mm');
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

  function canCancel(appt: Appointment): boolean {
    const now = new Date();
    const apptDate = new Date(appt.startDateTime);
    const oneHourBefore = new Date(apptDate.getTime() - 60 * 60 * 1000);
    return now < oneHourBefore && (appt.status === 'agendado' || appt.status === 'reagendado');
  }

  return (
    <ClientLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Mis Citas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visualiza y gestiona todas tus citas
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="agendado">Agendado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
              <SelectItem value="reagendado">Reagendado</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-4 sm:p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[130px] whitespace-nowrap">Fecha y Hora</TableHead>
                    <TableHead className="min-w-[100px]">Barbero</TableHead>
                    <TableHead className="min-w-[120px]">Servicio</TableHead>
                    <TableHead className="min-w-[90px] whitespace-nowrap">Precio</TableHead>
                    <TableHead className="min-w-[90px]">Estado</TableHead>
                    <TableHead className="min-w-[110px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No hay citas
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAppointments.map((appt) => (
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
                        <TableCell className="whitespace-nowrap" data-testid="text-service-price">
                          ${appt.service?.priceCOP?.toLocaleString('es-CO') || '0'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appt.status)}
                        </TableCell>
                        <TableCell>
                          {canCancel(appt) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelMutation.mutate(appt.id)}
                              disabled={cancelMutation.isPending}
                              data-testid={`button-cancel-${appt.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 sm:p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      data-testid="button-next-page"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </ClientLayout>
  );
}
