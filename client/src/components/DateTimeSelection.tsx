import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { TimeSlot } from '@shared/schema';

interface DateTimeSelectionProps {
  serviceId: string;
  barberId: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
}

export default function DateTimeSelection({
  serviceId,
  barberId,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
}: DateTimeSelectionProps) {
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

  useEffect(() => {
    if (selectedDate && serviceId && barberId) {
      availabilityMutation.mutate(selectedDate);
    }
  }, [selectedDate, serviceId, barberId]);

  const handleQuickDate = (date: Date, tab: string) => {
    setActiveTab(tab);
    onDateSelect(date);
    onTimeSelect('');
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setCalendarDate(date);
      onDateSelect(date);
      onTimeSelect('');
      setActiveTab('other');
    }
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (slot.available) {
      onTimeSelect(slot.startTime);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Elige Fecha y Hora</h2>
        <p className="text-muted-foreground">Selecciona una fecha</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger 
            value="today" 
            onClick={() => handleQuickDate(today, 'today')}
            data-testid="tab-today"
          >
            Hoy
          </TabsTrigger>
          <TabsTrigger 
            value="tomorrow"
            onClick={() => handleQuickDate(tomorrow, 'tomorrow')}
            data-testid="tab-tomorrow"
          >
            Mañana
          </TabsTrigger>
          <TabsTrigger value="other" data-testid="tab-other">
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

      <div>
        <h3 className="text-lg font-semibold mb-4">
          {selectedDate ? 'Horarios Disponibles' : 'Selecciona una fecha primero'}
        </h3>
        {availabilityMutation.isPending ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : selectedDate && availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {availableSlots.map((slot) => (
              <Button
                key={slot.startTime}
                variant={selectedTime === slot.startTime ? 'default' : 'outline'}
                className={cn(
                  "h-12",
                  selectedTime === slot.startTime && "ring-2 ring-primary/50",
                  !slot.available && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleTimeSelect(slot)}
                disabled={!slot.available}
                data-testid={`button-time-${slot.startTime.replace(':', '-')}`}
              >
                {slot.startTime}
              </Button>
            ))}
          </div>
        ) : selectedDate ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No hay horarios disponibles para esta fecha</p>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Selecciona una fecha para ver horarios disponibles</p>
          </Card>
        )}
      </div>
    </div>
  );
}
