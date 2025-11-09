import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, Mail, Phone, FileText, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Service, Barber } from '@/lib/store';

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
}

export default function BookingReview({
  service,
  barber,
  date,
  time,
  clientData,
}: BookingReviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Revisa tu Cita</h2>
        <p className="text-muted-foreground">
          Verifica que todos los detalles sean correctos antes de confirmar
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Servicio</h3>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Scissors className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{service.name}</h4>
              <p className="text-sm text-muted-foreground">{service.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-muted-foreground">
                  {service.durationMin} minutos
                </span>
                <span className="text-lg font-bold text-primary">
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
              <AvatarImage src={barber.photoUrl} alt={barber.name} />
              <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-lg">{barber.name}</h4>
              <p className="text-sm text-muted-foreground">
                ⭐ {barber.rating.toFixed(1)} ({barber.reviewCount} reseñas)
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">
                {format(date, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Hora</p>
              <p className="font-medium">{time}</p>
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
              <User className="w-5 h-5 text-muted-foreground" />
              <span>{clientData.fullName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span>{clientData.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span>{clientData.phoneE164}</span>
            </div>
            {clientData.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p className="text-sm">{clientData.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
