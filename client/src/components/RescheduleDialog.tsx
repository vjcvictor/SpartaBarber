import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarIcon } from 'lucide-react';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { TimeSlot } from '@shared/schema';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  serviceId: string;
  barberId: string;
  currentStartDateTime: string;
  role: 'admin' | 'barber' | 'client';
}

export default function RescheduleDialog({
  open,
  onOpenChange,
  appointmentId,
  serviceId,
  barberId,
  currentStartDateTime,
  role,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('today');
  const [calendarDate, setCalendarDate] = useState<Date | undefined>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const { toast } = useToast();

  const today = startOfDay(new Date());
  const tomorrow = startOfDay(addDays(today, 1));

  const availabilityMutation = useMutation({
    mutationFn: async (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await apiRequest('POST', '/api/availability', {
        serviceId,
        barberId,
        date: dateStr,
        excludeAppointmentId: appointmentId,
      });
      return res.json();
    },
    onSuccess: (data: TimeSlot[]) => {
      setAvailableSlots(data);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudieron cargar los horarios disponibles',
      });
      setAvailableSlots([]);
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) {
        throw new Error('Debe seleccionar fecha y hora');
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const newStartDateTime = `${dateStr}T${selectedTime}:00.000Z`;

      let endpoint = '';
      let method: 'PUT' | 'PATCH' = 'PUT';
      
      if (role === 'admin') {
        endpoint = `/api/admin/appointments/${appointmentId}`;
        method = 'PUT';
      } else if (role === 'barber') {
        endpoint = `/api/barber/appointments/${appointmentId}`;
        method = 'PATCH';
      } else {
        endpoint = `/api/appointments/${appointmentId}`;
        method = 'PUT';
      }

      const res = await apiRequest(method, endpoint, {
        startDateTime: newStartDateTime,
        status: 'reagendado',
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries based on role
      if (role === 'admin') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/appointments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      } else if (role === 'barber') {
        queryClient.invalidateQueries({ queryKey: ['/api/barber/appointments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/barber/stats'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/client/appointments'] });
      }

      toast({
        title: 'Cita reagendada',
        description: 'La cita se ha reagendado correctamente',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error al reagendar',
        description: error.message || 'No se pudo reagendar la cita',
      });
    },
  });

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (selectedDate && serviceId && barberId) {
      availabilityMutation.mutate(selectedDate);
    }
  }, [selectedDate, serviceId, barberId]);

  const resetForm = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setActiveTab('today');
    setCalendarDate(undefined);
    setAvailableSlots([]);
  };

  const handleQuickDate = (date: Date, tab: string) => {
    setActiveTab(tab);
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setCalendarDate(date);
      setSelectedDate(date);
      setSelectedTime(null);
      setActiveTab('other');
    }
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    setSelectedTime(slot.startTime);
  };

  const handleConfirm = () => {
    rescheduleMutation.mutate();
  };

  const currentDate = parseISO(currentStartDateTime);
  const canConfirm = selectedDate && selectedTime && !rescheduleMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reagendar Cita</DialogTitle>
          <DialogDescription>
            Selecciona una nueva fecha y hora para la cita
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Fecha y hora actual:</p>
            <p className="text-sm text-muted-foreground">
              {format(currentDate, "EEEE, d 'de' MMMM 'a las' HH:mm", { locale: es })}
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-3">Selecciona nueva fecha</h3>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger 
                  value="today" 
                  onClick={() => handleQuickDate(today, 'today')}
                  data-testid="reschedule-tab-today"
                >
                  Hoy
                </TabsTrigger>
                <TabsTrigger 
                  value="tomorrow"
                  onClick={() => handleQuickDate(tomorrow, 'tomorrow')}
                  data-testid="reschedule-tab-tomorrow"
                >
                  Mañana
                </TabsTrigger>
                <TabsTrigger value="other" data-testid="reschedule-tab-other">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Otra Fecha
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={calendarDate}
                        onSelect={handleCalendarSelect}
                        disabled={(date) => date < today}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {selectedDate && (
                  <div className="mb-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-3">
              {selectedDate ? 'Horarios Disponibles' : 'Selecciona una fecha primero'}
            </h3>
            {availabilityMutation.isPending ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : selectedDate && availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.startTime}
                    variant={selectedTime === slot.startTime ? 'default' : 'outline'}
                    className={cn(
                      "h-11 text-sm",
                      selectedTime === slot.startTime && "ring-2 ring-primary/50"
                    )}
                    onClick={() => handleTimeSelect(slot)}
                    data-testid={`reschedule-time-${slot.startTime.replace(':', '-')}`}
                  >
                    {slot.startTime}
                  </Button>
                ))}
              </div>
            ) : selectedDate ? (
              <div className="p-8 text-center bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">No hay horarios disponibles para esta fecha</p>
              </div>
            ) : (
              <div className="p-8 text-center bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Selecciona una fecha para ver horarios disponibles</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={rescheduleMutation.isPending}
            data-testid="button-cancel-reschedule"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            data-testid="button-confirm-reschedule"
          >
            {rescheduleMutation.isPending ? 'Reagendando...' : 'Confirmar Reagendamiento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
