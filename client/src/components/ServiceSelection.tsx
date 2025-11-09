import { Card } from '@/components/ui/card';
import { Scissors, User, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service } from '@/lib/store';

interface ServiceSelectionProps {
  services: Service[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

const iconMap: Record<string, any> = {
  '✂️': Scissors,
  '🧔‍♂️': User,
  '💧': Droplet,
};

export default function ServiceSelection({ services, selectedService, onSelect }: ServiceSelectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Selecciona tu Servicio</h2>
        <p className="text-muted-foreground">Elige el corte o tratamiento que deseas</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Scissors;
          const isSelected = selectedService?.id === service.id;
          
          return (
            <Card
              key={service.id}
              className={cn(
                "p-6 cursor-pointer transition-all hover-elevate active-elevate-2 border-2",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-card-border hover:border-primary/50"
              )}
              onClick={() => onSelect(service)}
              data-testid={`card-service-${service.id}`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={cn(
                  "p-4 rounded-full transition-colors",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon className={cn(
                    "w-8 h-8",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
                <div className="flex items-center gap-4 text-sm pt-2">
                  <span className="text-muted-foreground">{service.durationMin} min</span>
                  <span className="text-primary font-semibold">
                    ${service.priceCOP.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
