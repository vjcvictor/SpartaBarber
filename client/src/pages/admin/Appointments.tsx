import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import AdminLayout from '@/components/AdminLayout';
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
import { XCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Appointment } from '@shared/schema';

const TIMEZONE = 'America/Bogota';
const PAGE_SIZE = 10;

export default function Appointments() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/admin/appointments'],
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/appointments'] });
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/admin/appointments/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado de la cita se ha actualizado correctamente',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar el estado',
        variant: 'destructive',
      });
    },
  });

  const filteredAppointments = appointments?.filter((appointment) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'agendado') return appointment.status === 'agendado';
    if (statusFilter === 'reagendado') return appointment.status === 'reagendado';
    if (statusFilter === 'completado') return appointment.status === 'completado';
    if (statusFilter === 'cancelado') return appointment.status === 'cancelado';
    return true;
  }) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completado':
        return 'default';
      case 'cancelado':
        return 'destructive';
      case 'agendado':
      case 'reagendado':
      default:
        return 'secondary';
    }
  };

  const paginatedAppointments = filteredAppointments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE);

  function formatDateTime(dateTime: string) {
    const zonedDate = toZonedTime(new Date(dateTime), TIMEZONE);
    return format(zonedDate, "dd/MM/yyyy HH:mm 'COT'");
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Citas</h1>
            <p className="text-muted-foreground">
              Gestiona todas las citas de la barbería
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="agendado">Agendadas</SelectItem>
              <SelectItem value="reagendado">Reagendadas</SelectItem>
              <SelectItem value="completado">Completadas</SelectItem>
              <SelectItem value="cancelado">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            Total: {filteredAppointments.length} citas
          </div>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Barbero</TableHead>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No hay citas para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAppointments.map((appointment) => (
                      <TableRow key={appointment.id} data-testid={`row-appointment-${appointment.id.substring(0, 8)}`}>
                        <TableCell className="font-mono text-sm" data-testid="text-appointment-id">
                          {appointment.id.substring(0, 8)}
                        </TableCell>
                        <TableCell data-testid="text-client-name">
                          {appointment.client?.fullName}
                        </TableCell>
                        <TableCell data-testid="text-service-name">
                          {appointment.service?.name}
                        </TableCell>
                        <TableCell data-testid="text-barber-name">
                          {appointment.barber?.name}
                        </TableCell>
                        <TableCell data-testid="text-appointment-datetime">
                          {formatDateTime(appointment.startDateTime)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={getStatusBadgeVariant(appointment.status)}
                              data-testid="badge-appointment-status"
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {appointment.status !== 'completado' && appointment.status !== 'cancelado' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'completado' })}
                                disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                                data-testid={`button-complete-appointment-${appointment.id.substring(0, 8)}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {updateStatusMutation.isPending ? 'Marcando...' : 'Marcar completado'}
                              </Button>
                            )}
                            {appointment.status !== 'cancelado' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelMutation.mutate(appointment.id)}
                                disabled={cancelMutation.isPending || updateStatusMutation.isPending}
                                data-testid={`button-cancel-appointment-${appointment.id.substring(0, 8)}`}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar'}
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
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
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
    </AdminLayout>
  );
}
