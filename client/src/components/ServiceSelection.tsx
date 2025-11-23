import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Service } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
// Import specific icons from React Icons
import {
  GiScissors,
  GiBeard,
  GiRazor,
  GiComb,
  GiTowel,
  GiMustache,
  GiCrownedSkull,
  GiStarsStack,
  GiMedal,
  GiTrophy,
  GiDiamondHard
} from 'react-icons/gi';
import { FaEye, FaSpa, FaStar, FaCrown, FaFire } from 'react-icons/fa';
import { IconType } from 'react-icons';

interface ServiceSelectionProps {
  services: Service[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

// Map string names to React Icon components
const IconMap: Record<string, IconType> = {
  // Individuales
  'Scissors': GiScissors,
  'Beard': GiBeard,
  'Eye': FaEye,
  'Spa': FaSpa,

  // Combos 2
  'Razor': GiRazor,
  'Star': FaStar,
  'Towel': GiTowel,
  'Mustache': GiMustache,
  'Diamond': GiDiamondHard,
  'Fire': FaFire,

  // Combos 3
  'Medal': GiMedal,
  'Trophy': GiTrophy,
  'Stars': GiStarsStack,
  'Comb': GiComb,

  // Completo
  'Crown': FaCrown,
};

// Define the category order explicitly
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

  // Sort categories
  const sortedCategories = categoryOrder
    .filter(cat => groupedByCategory[cat])
    .map(cat => [cat, groupedByCategory[cat]] as [string, Service[]]);

  // Add remaining categories
  const remainingCategories = Object.entries(groupedByCategory)
    .filter(([cat]) => !categoryOrder.includes(cat));

  sortedCategories.push(...remainingCategories);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Selecciona tu Servicio</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Elige el corte o tratamiento que deseas.</p>
      </div>

      {sortedCategories.map(([category, categoryServices]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold">{category}</h3>
            <Badge variant="secondary" className="text-xs">{categoryServices.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {categoryServices.map((service) => {
              const isSelected = selectedService?.id === service.id;
              const IconComponent = IconMap[service.icon];

              return (
                <Card
                  key={service.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:bg-zinc-800/50 border-2",
                    isSelected
                      ? "border-amber-500 bg-zinc-800"
                      : "border-zinc-700 bg-zinc-800/30"
                  )}
                  onClick={() => onSelect(service)}
                  data-testid={`card-service-${service.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left side: Icon */}
                    <div className={cn(
                      "flex items-center justify-center shrink-0 w-12 h-12 rounded-full transition-colors",
                      isSelected ? "bg-amber-500/20" : "bg-amber-500/10"
                    )}>
                      {IconComponent ? (
                        <IconComponent
                          className={cn("w-6 h-6", isSelected ? "text-amber-500" : "text-amber-600")}
                        />
                      ) : (
                        <span className="text-2xl" role="img" aria-label={service.name}>
                          {service.icon}
                        </span>
                      )}
                    </div>

                    {/* Middle: Service info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white mb-0.5">{service.name}</h3>
                      <p className="text-sm text-gray-400">
                        {service.durationMin} min - ${service.priceCOP.toLocaleString('es-CO')}
                      </p>
                    </div>

                    {/* Right side: Radio button */}
                    <div className="shrink-0">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "border-amber-500 bg-amber-500"
                          : "border-zinc-600 bg-transparent"
                      )}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-black" />
                        )}
                      </div>
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
