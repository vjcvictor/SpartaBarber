import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';
import type { Barber } from '@shared/schema';

interface BarberSelectionProps {
  serviceId: string;
  selectedBarber: Barber | null;
  onSelect: (barber: Barber) => void;
  barbers: Barber[];
  isLoading: boolean;
}



export default function BarberSelection({ serviceId, selectedBarber, onSelect, barbers, isLoading }: BarberSelectionProps) {

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

      <div className="grid grid-cols-1 gap-4">


        {barbers.map((barber) => {
          const isSelected = selectedBarber?.id === barber.id;

          return (
            <Card
              key={barber.id}
              className={cn(
                "p-4 cursor-pointer transition-all border-2 relative overflow-hidden group",
                isSelected
                  ? "border-white/20 bg-zinc-800"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
              )}
              onClick={() => onSelect(barber)}
              data-testid={`card-barber-${barber.id}`}
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-zinc-700">
                  <AvatarImage src={barber.photoUrl || undefined} alt={barber.name} />
                  <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{barber.name}</h3>
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    <span>★</span>
                    <span>5.0</span>
                    <span className="text-zinc-500 ml-1">(150)</span>
                  </div>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected
                    ? "border-white bg-white"
                    : "border-zinc-600 group-hover:border-zinc-500"
                )}>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-black" />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
