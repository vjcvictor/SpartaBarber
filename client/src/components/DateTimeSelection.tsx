import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateTimeSelectionProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  availableSlots: string[];
}

export default function DateTimeSelection({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  availableSlots,
}: DateTimeSelectionProps) {
  const [activeTab, setActiveTab] = useState<string>('today');
  const [calendarDate, setCalendarDate] = useState<Date | undefined>();

  const today = startOfDay(new Date());
  const tomorrow = startOfDay(addDays(today, 1));

  const handleQuickDate = (date: Date, tab: string) => {
    setActiveTab(tab);
    onDateSelect(date);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setCalendarDate(date);
      onDateSelect(date);
      setActiveTab('other');
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
        {selectedDate && availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {availableSlots.map((slot) => (
              <Button
                key={slot}
                variant={selectedTime === slot ? 'default' : 'outline'}
                className={cn(
                  "h-12",
                  selectedTime === slot && "ring-2 ring-primary/50"
                )}
                onClick={() => onTimeSelect(slot)}
                data-testid={`button-time-${slot.replace(':', '-')}`}
              >
                {slot}
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
