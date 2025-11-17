import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, differenceInMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import BarberLayout from '@/components/BarberLayout';
import RescheduleDialog from '@/components/RescheduleDialog';
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
import { CheckCircle, XCircle, MoreVertical, Calendar, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Appointment } from '@shared/schema';

const TIMEZONE = 'America/Bogota';
const PAGE_SIZE = 10;

export default function BarberAppointments() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
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
    return format(zonedDate, 'dd/MM/yyyy HH:mm');
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'agendado':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 hover-elevate';
      case 'reagendado':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover-elevate';
      case 'completado':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover-elevate';
      case 'cancelado':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 hover-elevate';
      default:
        return '';
    }
  };

  const canEditAppointment = (appointmentDateTime: string): boolean => {
    const now = new Date();
    const appointmentDate = new Date(appointmentDateTime);
    const minutesUntilAppointment = differenceInMinutes(appointmentDate, now);
    return minutesUntilAppointment > 60;
  };

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('PATCH', `/api/barber/appointments/${id}`, { status: 'cancelado' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/barber/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/barber/stats'] });
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

  return (
    <BarberLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Mis Citas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gestiona todas tus citas
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
                <Table className="min-w-[650px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[130px] whitespace-nowrap">Fecha y Hora</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[120px]">Servicio</TableHead>
                    <TableHead className="min-w-[90px]">Estado</TableHead>
                    <TableHead className="min-w-[110px]">Acciones</TableHead>
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
                        <TableCell className="font-medium whitespace-nowrap" data-testid="text-appointment-datetime">
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
                          <Badge
                            className={getStatusColor(appt.status)}
                            data-testid="badge-appointment-status"
                          >
                            {appt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                data-testid={`button-actions-${appt.id.substring(0, 8)}`}
                                disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {appt.status !== 'completado' && appt.status !== 'cancelado' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (!canEditAppointment(appt.startDateTime)) {
                                        toast({
                                          title: 'No se puede reagendar',
                                          description: 'No se pueden reagendar citas con menos de 1 hora de anticipación',
                                          variant: 'destructive',
                                        });
                                        return;
                                      }
                                      setSelectedAppointment(appt);
                                      setRescheduleDialogOpen(true);
                                    }}
                                    disabled={!canEditAppointment(appt.startDateTime)}
                                    data-testid={`menu-item-reschedule-${appt.id.substring(0, 8)}`}
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Reagendar
                                    {!canEditAppointment(appt.startDateTime) && (
                                      <AlertCircle className="w-3 h-3 ml-2 text-destructive" />
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateStatusMutation.mutate({ id: appt.id, status: 'completado' })}
                                    data-testid={`menu-item-complete-${appt.id.substring(0, 8)}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Marcar completado
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {appt.status !== 'cancelado' && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (!canEditAppointment(appt.startDateTime)) {
                                      toast({
                                        title: 'No se puede cancelar',
                                        description: 'No se pueden cancelar citas con menos de 1 hora de anticipación',
                                        variant: 'destructive',
                                      });
                                      return;
                                    }
                                    cancelMutation.mutate(appt.id);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                  data-testid={`menu-item-cancel-${appt.id.substring(0, 8)}`}
                                  disabled={!canEditAppointment(appt.startDateTime)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancelar cita
                                  {!canEditAppointment(appt.startDateTime) && (
                                    <AlertCircle className="w-3 h-3 ml-2" />
                                  )}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {selectedAppointment && (
        <RescheduleDialog
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          appointmentId={selectedAppointment.id}
          serviceId={selectedAppointment.service?.id || ''}
          barberId={selectedAppointment.barber?.id || ''}
          currentStartDateTime={selectedAppointment.startDateTime}
          role="barber"
        />
      )}
    </BarberLayout>
  );
}
