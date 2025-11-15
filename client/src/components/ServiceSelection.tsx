import { Card } from '@/components/ui/card';
import { Scissors, User, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

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

// Define the category order explicitly (from most comprehensive to individual)
const categoryOrder = [
  'Combo completo',
  'Combos de tres servicios',
  'Combos de dos servicios',
  'Servicios Individuales',
];

export default function ServiceSelection({ services, selectedService, onSelect }: ServiceSelectionProps) {
  // Group services by category
  const groupedByCategory = services.reduce((acc, service) => {
    const category = service.category || 'Sin categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Sort categories by predefined order, with fallback for any unexpected categories
  const sortedCategories = categoryOrder
    .filter(cat => groupedByCategory[cat])
    .map(cat => [cat, groupedByCategory[cat]] as [string, Service[]]);
  
  // Add any categories not in the predefined order (fallback for future categories)
  const remainingCategories = Object.entries(groupedByCategory)
    .filter(([cat]) => !categoryOrder.includes(cat));
  
  sortedCategories.push(...remainingCategories);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Selecciona tu Servicio</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Elige el corte o tratamiento que deseas</p>
      </div>
      
      {sortedCategories.map(([category, categoryServices]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold">{category}</h3>
            <Badge variant="secondary" className="text-xs">{categoryServices.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryServices.map((service) => {
              const Icon = iconMap[service.icon] || Scissors;
              const isSelected = selectedService?.id === service.id;
              
              return (
                <Card
                  key={service.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover-elevate active-elevate-2 border-2",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-card-border hover:border-primary/50"
                  )}
                  onClick={() => onSelect(service)}
                  data-testid={`card-service-${service.id}`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={cn(
                      "p-3 rounded-full transition-colors",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-6 h-6",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <h3 className="text-base font-semibold leading-tight">{service.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                    <div className="flex items-center gap-3 text-xs pt-1">
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
      ))}
    </div>
  );
}
