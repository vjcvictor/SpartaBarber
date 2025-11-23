import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, differenceInMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import AdminLayout from '@/components/AdminLayout';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { XCircle, CheckCircle, MoreVertical, Edit, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatTime12Hour } from '@/lib/timeFormat';
import type { Appointment, Barber } from '@shared/schema';

const TIMEZONE = 'America/Bogota';
const PAGE_SIZE = 10;

export default function Appointments() {
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // States for confirmation dialogs
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);

  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/admin/appointments'],
  });

  const { data: barbers } = useQuery<Barber[]>({
    queryKey: ['/api/admin/barbers'],
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'Cita cancelada',
        description: 'La cita se ha cancelado correctamente',
      });
      setAppointmentToCancel(null);
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
      setAppointmentToComplete(null);
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
    // Filter by barber
    if (selectedBarber !== 'all' && appointment.barberId !== selectedBarber) {
      return false;
    }

    // Filter by status
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return appointment.status !== 'completado';
    return appointment.status === statusFilter;
  }) || [];

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'agendado':
        return 'default';
      case 'reagendado':
        return 'secondary';
      case 'completado':
        return 'outline';
      case 'cancelado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

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

  const paginatedAppointments = filteredAppointments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE);

  function formatDateTime(dateTime: string) {
    const zonedDate = toZonedTime(new Date(dateTime), TIMEZONE);
    const date = format(zonedDate, 'dd/MM/yyyy');
    const time24 = format(zonedDate, 'HH:mm');
    const time12 = formatTime12Hour(time24);
    return `${date} ${time12}`;
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
          <Select value={selectedBarber} onValueChange={setSelectedBarber}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-barber-filter">
              <SelectValue placeholder="Filtrar por barbero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los barberos</SelectItem>
              {barbers?.map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Citas</SelectItem>
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
                            <Badge
                              className={getStatusColor(appointment.status)}
                              data-testid="badge-appointment-status"
                            >
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-actions-${appointment.id.substring(0, 8)}`}
                                  disabled={updateStatusMutation.isPending || cancelMutation.isPending}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {appointment.status !== 'completado' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        if (!canEditAppointment(appointment.startDateTime)) {
                                          toast({
                                            title: 'No se puede reagendar',
                                            description: 'No se pueden reagendar citas con menos de 1 hora de anticipación',
                                            variant: 'destructive',
                                          });
                                          return;
                                        }
                                        setSelectedAppointment(appointment);
                                        setRescheduleDialogOpen(true);
                                      }}
                                      disabled={!canEditAppointment(appointment.startDateTime)}
                                      data-testid={`menu-item-reschedule-${appointment.id.substring(0, 8)}`}
                                    >
                                      <Calendar className="w-4 h-4 mr-2" />
                                      Reagendar
                                      {!canEditAppointment(appointment.startDateTime) && (
                                        <AlertCircle className="w-3 h-3 ml-2 text-destructive" />
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setAppointmentToComplete(appointment)}
                                      data-testid={`menu-item-complete-${appointment.id.substring(0, 8)}`}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Marcar completado
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                {appointment.status !== 'cancelado' && appointment.status !== 'completado' && (
                                  <DropdownMenuItem
                                    onClick={() => setAppointmentToCancel(appointment)}
                                    className="text-destructive focus:text-destructive"
                                    data-testid={`menu-item-cancel-${appointment.id.substring(0, 8)}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancelar cita
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

      {selectedAppointment && (
        <RescheduleDialog
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          appointmentId={selectedAppointment.id}
          serviceId={selectedAppointment.service?.id || ''}
          barberId={selectedAppointment.barber?.id || ''}
          currentStartDateTime={selectedAppointment.startDateTime}
          role="admin"
        />
      )}

      <AlertDialog open={!!appointmentToCancel} onOpenChange={(open) => !open && setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la cita. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (appointmentToCancel) {
                  cancelMutation.mutate(appointmentToCancel.id);
                }
              }}
            >
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!appointmentToComplete} onOpenChange={(open) => !open && setAppointmentToComplete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como completada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto marcará la cita como finalizada y se registrará en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (appointmentToComplete) {
                  updateStatusMutation.mutate({ id: appointmentToComplete.id, status: 'completado' });
                }
              }}
            >
              Sí, completar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
