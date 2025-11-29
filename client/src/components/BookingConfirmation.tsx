import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Download, Plus, UserPlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Service, Barber } from '@shared/schema';

interface BookingConfirmationProps {
  service: Service;
  barber: Barber;
  date: Date;
  time: string;
  onNewBooking: () => void;
  onRegister: () => void;
  onLogin: () => void;
  onDownloadICS: () => void;
}

export default function BookingConfirmation({
  service,
  barber,
  date,
  time,
  onNewBooking,
  onRegister,
  onLogin,
  onDownloadICS,
}: BookingConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6">
          <CheckCircle className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-3">¡Cita Registrada Exitosamente!</h1>
        <p className="text-xl text-muted-foreground">
          Tu cita ha sido confirmada. ¡Te esperamos!
        </p>
      </div>

      <Card className="p-8 mb-6">
        <h2 className="text-xl font-semibold mb-6">Detalles de tu Cita</h2>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={barber.photoUrl ?? undefined} alt={barber.name} />
              <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Barbero</p>
              <p className="font-semibold text-lg">{barber.name}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-1">Servicio</p>
            <p className="font-semibold text-lg">{service.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Fecha</p>
              <p className="font-medium">
                {format(date, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Hora</p>
              <p className="font-medium">{time}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between pt-2">
            <span className="text-lg font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">
              ${service.priceCOP.toLocaleString('es-CO')}
            </span>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="text-sm text-center text-muted-foreground mb-4">
          ¿Quieres añadir esta cita a tu calendario?
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={onDownloadICS}
            data-testid="button-download-google"
          >
            <Calendar className="w-4 h-4" />
            Google Calendar
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={onDownloadICS}
            data-testid="button-download-outlook"
          >
            <Download className="w-4 h-4" />
            Outlook
          </Button>
        </div>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={onNewBooking}
          data-testid="button-new-booking"
        >
          <Plus className="w-5 h-5" />
          Agendar otra cita
        </Button>

        {/* <Button 
          variant="secondary"
          className="w-full gap-2"
          onClick={onRegister}
          data-testid="button-register"
        >
          <UserPlus className="w-5 h-5" />
          Registrarse
        </Button> */}

        <Button
          variant="outline"
          className="w-full"
          onClick={onLogin}
          data-testid="button-login-confirmation"
        >
          Iniciar Sesión
        </Button>
      </div>
    </div>
  );
}
