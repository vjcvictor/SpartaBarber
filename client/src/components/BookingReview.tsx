import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Mail, Phone, FileText, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatInTimeZone } from 'date-fns-tz';
import type { Service, Barber } from '@shared/schema';

interface BookingReviewProps {
  service: Service;
  barber: Barber;
  date: Date;
  time: string;
  clientData: {
    fullName: string;
    phoneE164: string;
    email: string;
    notes: string;
  };
  onSuccess: (appointmentId: string) => void;
}

const TIMEZONE = 'America/Bogota';

export default function BookingReview({
  service,
  barber,
  date,
  time,
  clientData,
  onSuccess,
}: BookingReviewProps) {
  const { toast } = useToast();

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      const [hours, minutes] = time.split(':');
      const appointmentDate = new Date(date);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const startDateTime = formatInTimeZone(appointmentDate, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
      
      const res = await apiRequest('POST', '/api/appointments', {
        serviceId: service.id,
        barberId: barber.id,
        startDateTime,
        clientData: {
          fullName: clientData.fullName,
          phoneE164: clientData.phoneE164,
          email: clientData.email,
          notes: clientData.notes,
        },
      });
      return res.json();
    },
    onSuccess: (data: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: '¡Cita agendada!',
        description: 'Tu cita ha sido confirmada exitosamente',
      });
      onSuccess(data.id);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error al agendar',
        description: error.message || 'No se pudo agendar la cita. Intenta de nuevo.',
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Revisa tu Cita</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Verifica que todos los detalles sean correctos antes de confirmar
        </p>
      </div>

      <Card className="p-4 sm:p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Servicio</h3>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Scissors className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg" data-testid="text-service-name">{service.name}</h4>
              <p className="text-sm text-muted-foreground">{service.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-muted-foreground">
                  {service.durationMin} minutos
                </span>
                <span className="text-lg font-bold text-primary" data-testid="text-service-price">
                  ${service.priceCOP.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Barbero</h3>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={barber.photoUrl || undefined} alt={barber.name} />
              <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-lg" data-testid="text-barber-name">{barber.name}</h4>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium text-sm sm:text-base break-words" data-testid="text-appointment-date">
                {format(date, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Hora</p>
              <p className="font-medium text-sm sm:text-base" data-testid="text-appointment-time">{time}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Datos de Contacto
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm sm:text-base break-words min-w-0" data-testid="text-client-name">{clientData.fullName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm sm:text-base break-all min-w-0" data-testid="text-client-email">{clientData.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm sm:text-base" data-testid="text-client-phone">{clientData.phoneE164}</span>
            </div>
            {clientData.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="text-sm" data-testid="text-client-notes">{clientData.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Button 
        size="lg" 
        className="w-full"
        onClick={() => createAppointmentMutation.mutate()}
        disabled={createAppointmentMutation.isPending}
        data-testid="button-confirm-booking"
      >
        {createAppointmentMutation.isPending ? 'Confirmando...' : 'Confirmar Cita'}
      </Button>
    </div>
  );
}
