import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Barber } from '@shared/schema';

interface BarberSelectionProps {
  serviceId: string;
  selectedBarber: Barber | null;
  onSelect: (barber: Barber) => void;
}

export default function BarberSelection({ serviceId, selectedBarber, onSelect }: BarberSelectionProps) {
  const { data: barbers = [], isLoading } = useQuery<Barber[]>({
    queryKey: ['/api/barbers', { serviceId }],
    enabled: !!serviceId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Selecciona tu Barbero</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Elige el profesional que quieres que te atienda</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Selecciona tu Barbero</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Elige el profesional que quieres que te atienda</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <AvatarImage src={barber.photoUrl || undefined} alt={barber.name} />
                  <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{barber.name}</h3>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
