import { Button } from '@/components/ui/button';
import { Calendar, Scissors, Clock, Award } from 'lucide-react';
import heroImage from '@assets/stock_images/professional_barbers_bc29be2c.jpg';

interface LandingHeroProps {
  onBookingClick: () => void;
  onLoginClick: () => void;
}

export default function LandingHero({ onBookingClick, onLoginClick }: LandingHeroProps) {
  return (
    <div className="min-h-screen bg-background">
      <div 
        className="relative h-[600px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/90 to-secondary/70" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-block p-3 bg-primary/20 rounded-full mb-6">
            <Scissors className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-4">
            Sparta Barbería
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
            Estilo y tradición en cada corte. Agenda tu cita en minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={onBookingClick}
              data-testid="button-booking-start"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendar Cita
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={onLoginClick}
              data-testid="button-login"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">¿Por qué elegirnos?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Barberos Expertos</h3>
              <p className="text-muted-foreground">
                Profesionales con años de experiencia y pasión por su oficio
              </p>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Agenda Fácil</h3>
              <p className="text-muted-foreground">
                Sistema de reservas simple y rápido disponible 24/7
              </p>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sin Esperas</h3>
              <p className="text-muted-foreground">
                Tu tiempo es valioso. Llega y recibe tu servicio al instante
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            ¿Listo para tu transformación?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Agenda tu cita ahora y experimenta el mejor servicio de barbería en Colombia
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8"
            onClick={onBookingClick}
            data-testid="button-booking-cta"
          >
            Comenzar Ahora
          </Button>
        </div>
      </div>
    </div>
  );
}
