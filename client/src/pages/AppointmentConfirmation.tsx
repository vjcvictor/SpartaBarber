import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Calendar, Clock, User, Download, Home } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import type { Appointment } from '@shared/schema';

const TIMEZONE = 'America/Bogota';

interface AppointmentConfirmationProps {
  appointmentId: string;
  onBackToHome: () => void;
}

export default function AppointmentConfirmation({ appointmentId, onBackToHome }: AppointmentConfirmationProps) {
  const [, setLocation] = useLocation();

  const { data: appointment, isLoading } = useQuery<Appointment>({
    queryKey: ['/api/appointments', appointmentId],
    enabled: !!appointmentId,
  });

  const handleDownloadICS = async () => {
    try {
      const response = await fetch(`/api/calendar/ics/${appointmentId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('No se pudo descargar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cita-${appointmentId}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading ICS:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando detalles de la cita...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se encontró la cita</p>
          <Button onClick={onBackToHome} data-testid="button-back-home">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const startDateTime = new Date(appointment.startDateTime);
  const formattedDate = formatInTimeZone(startDateTime, TIMEZONE, "EEEE, d 'de' MMMM", { locale: es });
  const formattedTime = formatInTimeZone(startDateTime, TIMEZONE, 'HH:mm');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6">
            <CheckCircle2 className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3" data-testid="text-confirmation-title">
            ¡Tu cita ha sido agendada!
          </h1>
          <p className="text-lg text-muted-foreground">
            Hemos enviado un correo de confirmación a {appointment.client?.email}
          </p>
        </div>

        <Card className="p-8 space-y-6 mb-8">
          <div>
            <p className="text-sm text-muted-foreground mb-2">ID de Cita</p>
            <p className="font-mono text-lg font-semibold" data-testid="text-appointment-id">
              {appointment.id}
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Servicio</h3>
            <div className="space-y-2">
              <p className="font-semibold text-lg" data-testid="text-service-name">
                {appointment.service?.name}
              </p>
              <p className="text-muted-foreground">{appointment.service?.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-muted-foreground">
                  {appointment.service?.durationMin} minutos
                </span>
                <span className="text-lg font-bold text-primary" data-testid="text-service-price">
                  ${appointment.service?.priceCOP.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Barbero</h3>
            <p className="font-semibold" data-testid="text-barber-name">
              {appointment.barber?.name}
            </p>
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium" data-testid="text-appointment-date">
                  {formattedDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Hora</p>
                <p className="font-medium" data-testid="text-appointment-time">
                  {formattedTime}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Datos de Contacto
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <span data-testid="text-client-name">{appointment.client?.fullName}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            size="lg"
            className="flex-1"
            onClick={handleDownloadICS}
            data-testid="button-download-ics"
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar ICS
          </Button>
          <Button 
            size="lg"
            className="flex-1"
            onClick={onBackToHome}
            data-testid="button-back-home"
          >
            <Home className="w-5 h-5 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
