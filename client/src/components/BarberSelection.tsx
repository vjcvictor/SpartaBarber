import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Barber } from '@/lib/store';

interface BarberSelectionProps {
  barbers: Barber[];
  selectedBarber: Barber | null;
  onSelect: (barber: Barber) => void;
}

export default function BarberSelection({ barbers, selectedBarber, onSelect }: BarberSelectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Selecciona tu Barbero</h2>
        <p className="text-muted-foreground">Elige el profesional que quieres que te atienda</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map((barber) => {
          const isSelected = selectedBarber?.id === barber.id;
          
          return (
            <Card
              key={barber.id}
              className={cn(
                "p-6 cursor-pointer transition-all hover-elevate active-elevate-2 border-2",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-card-border hover:border-primary/50"
              )}
              onClick={() => onSelect(barber)}
              data-testid={`card-barber-${barber.id}`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={barber.photoUrl} alt={barber.name} />
                  <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{barber.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="text-sm font-medium">{barber.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({barber.reviewCount})
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
