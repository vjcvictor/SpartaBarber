import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import BarberLayout from '@/components/BarberLayout';
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
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Appointment } from '@shared/schema';

const TIMEZONE = 'America/Bogota';
const PAGE_SIZE = 10;

export default function BarberAppointments() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/barber/appointments'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest('PATCH', `/api/barber/appointments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/barber/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barber/stats'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado de la cita se ha actualizado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar estado',
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
    return format(zonedDate, "dd/MM/yyyy HH:mm 'COT'");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Citas</h1>
            <p className="text-muted-foreground">
              Gestiona todas tus citas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
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
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay citas
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAppointments.map((appt) => (
                      <TableRow key={appt.id} data-testid={`row-appointment-${appt.id}`}>
                        <TableCell className="font-medium" data-testid="text-appointment-datetime">
                          {formatDateTime(appt.startDateTime)}
                        </TableCell>
                        <TableCell data-testid="text-client-name">
                          <div>
                            <p className="font-medium">{appt.client?.fullName || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">{appt.client?.phoneE164}</p>
                          </div>
                        </TableCell>
                        <TableCell data-testid="text-service-name">
                          {appt.service?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appt.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {appt.status === 'agendado' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ id: appt.id, status: 'cancelado' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-cancel-${appt.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            )}
                            {appt.status === 'cancelado' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ id: appt.id, status: 'agendado' })}
                                disabled={updateStatusMutation.isPending}
                                data-testid={`button-restore-${appt.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Restaurar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
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
    </BarberLayout>
  );
}
