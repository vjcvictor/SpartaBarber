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
    return format(zonedDate, 'dd/MM/yyyy HH:mm');
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Citas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona todas las citas de la barbería
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
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
            <div className="p-4 sm:p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Cliente</TableHead>
                    <TableHead className="min-w-[120px]">Servicio</TableHead>
                    <TableHead className="min-w-[100px]">Barbero</TableHead>
                    <TableHead className="min-w-[90px] whitespace-nowrap">Precio</TableHead>
                    <TableHead className="min-w-[130px] whitespace-nowrap">Fecha/Hora</TableHead>
                    <TableHead className="min-w-[90px]">Estado</TableHead>
                    <TableHead className="text-right min-w-[200px]">Acciones</TableHead>
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
                        <TableCell data-testid="text-client-name">
                          {appointment.client?.fullName}
                        </TableCell>
                        <TableCell data-testid="text-service-name">
                          {appointment.service?.name}
                        </TableCell>
                        <TableCell data-testid="text-barber-name">
                          {appointment.barber?.name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap" data-testid="text-service-price">
                          ${appointment.service?.priceCOP?.toLocaleString('es-CO') || '0'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap" data-testid="text-appointment-datetime">
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
                          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-2">
                            {appointment.status !== 'completado' && appointment.status !== 'cancelado' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ id: appointment.id, status: 'completado' })}
                                disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                                data-testid={`button-complete-appointment-${appointment.id.substring(0, 8)}`}
                                className="text-xs whitespace-nowrap w-full sm:w-auto"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {updateStatusMutation.isPending ? 'Marcando...' : 'Completar'}
                              </Button>
                            )}
                            {appointment.status !== 'cancelado' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelMutation.mutate(appointment.id)}
                                disabled={cancelMutation.isPending || updateStatusMutation.isPending}
                                data-testid={`button-cancel-appointment-${appointment.id.substring(0, 8)}`}
                                className="text-xs whitespace-nowrap w-full sm:w-auto"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
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
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 sm:p-4 border-t">
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
