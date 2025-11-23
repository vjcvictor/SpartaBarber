import { useEffect } from 'react';
import { SiGooglecalendar } from 'react-icons/si';
import { FaMicrosoft } from 'react-icons/fa';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Calendar, Clock, User, Home, UserPlus, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { formatTime12Hour } from '@/lib/timeFormat';
import type { Appointment, AuthResponse } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const TIMEZONE = 'America/Bogota';

interface AppointmentConfirmationProps {
  appointmentId: string;
  onBackToHome: () => void;
}

export default function AppointmentConfirmation({ appointmentId, onBackToHome }: AppointmentConfirmationProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: authData } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const { data: appointment, isLoading } = useQuery<Appointment>({
    queryKey: ['/api/appointments', appointmentId],
    enabled: !!appointmentId,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!appointment?.client) return;

      // Create a default password or handle this differently?
      // The user request says "create the user with the name the email and the number that were confirmed"
      // Since we can't ask for a password here easily without a dialog, 
      // and the user implies a one-click action ("if selects the button show a message"),
      // we might need to generate a random password or use a default one.
      // For now, I'll use a placeholder and maybe the user can change it later via "Forgot Password" logic if implemented,
      // or we assume this is a "quick register" that might need email verification flow in a real app.
      // However, given the constraints, I will use the phone number as the initial password 
      // (since it's unique enough for a demo/MVP) or a fixed string.
      // Let's use the phone number as the password for simplicity and user experience in this specific request context.

      const res = await apiRequest('POST', '/api/auth/register', {
        email: appointment.client.email,
        password: appointment.client.phoneE164, // Using phone as initial password
        fullName: appointment.client.fullName,
        phoneE164: appointment.client.phoneE164,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      toast({
        title: "¡Registro exitoso!",
        description: "Te has registrado correctamente en el sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message,
      });
    },
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
  const formattedTime24 = formatInTimeZone(startDateTime, TIMEZONE, 'HH:mm');
  const formattedTime = formatTime12Hour(formattedTime24);

  const isAuthenticated = !!authData;

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
          {/* ID Hidden as requested */}

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
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span data-testid="text-client-email">{appointment.client?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span data-testid="text-client-phone">{appointment.client?.phoneE164}</span>
              </div>
            </div>
          </div>
        </Card>

        {!isAuthenticated && (
          <div className="mb-8">
            <Button
              className="w-full"
              size="lg"
              onClick={() => registerMutation.mutate()}
              disabled={registerMutation.isPending}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {registerMutation.isPending ? 'Registrando...' : 'Registrarme en el sistema'}
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Crea una cuenta para agendar más rápido la próxima vez
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                if (!appointment || !appointment.service) return;
                const startTime = new Date(appointment.startDateTime);
                const endTime = new Date(startTime.getTime() + (appointment.service.durationMin || 30) * 60000);

                const text = encodeURIComponent(`Cita en Barbería Sparta: ${appointment.service.name}`);
                const details = encodeURIComponent(`Cita con ${appointment.barber?.name}. ${appointment.service.description || ''}`);
                const location = encodeURIComponent('Barbería Sparta');

                const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
                const dates = `${formatDate(startTime)}/${formatDate(endTime)}`;

                window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`, '_blank');
              }}
              data-testid="button-google-calendar"
            >
              <SiGooglecalendar className="w-5 h-5 mr-2" />
              Agregar a Google Calendar
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                if (!appointment || !appointment.service) return;
                const startTime = new Date(appointment.startDateTime);
                const endTime = new Date(startTime.getTime() + (appointment.service.durationMin || 30) * 60000);

                const subject = encodeURIComponent(`Cita en Barbería Sparta: ${appointment.service.name}`);
                const body = encodeURIComponent(`Cita con ${appointment.barber?.name}. ${appointment.service.description || ''}`);
                const location = encodeURIComponent('Barbería Sparta');

                window.open(`https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&body=${body}&location=${location}`, '_blank');
              }}
              data-testid="button-outlook-calendar"
            >
              <FaMicrosoft className="w-5 h-5 mr-2" />
              Agregar a Outlook Calendar
            </Button>
          </div>
          <Button
            size="lg"
            className="w-full"
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
