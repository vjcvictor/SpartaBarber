import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { UserSearch, CheckCircle2, Circle } from 'lucide-react';
import type { Barber } from '@shared/schema';

interface BarberSelectionProps {
  serviceId: string;
  selectedBarber: Barber | null;
  onSelect: (barber: Barber) => void;
  barbers: Barber[];
  isLoading: boolean;
}

const ANY_BARBER: Barber = {
  id: 'any',
  name: 'Cualquier Barbero',
  photoUrl: null,
  weeklySchedule: [],
  exceptions: [],
  services: [],
};

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
        {/* Any Barber Option */}
        <Card
          className={cn(
            "p-4 cursor-pointer transition-all border-2 relative overflow-hidden group",
            selectedBarber?.id === 'any'
              ? "border-amber-500/50 bg-amber-500/10"
              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
          )}
          onClick={() => onSelect(ANY_BARBER)}
          data-testid="card-barber-any"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-full transition-colors",
              selectedBarber?.id === 'any' ? "bg-amber-500/20 text-amber-500" : "bg-zinc-800 text-zinc-400"
            )}>
              <UserSearch className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold text-lg",
                selectedBarber?.id === 'any' ? "text-amber-500" : "text-white"
              )}>
                Cualquier Barbero
              </h3>
              <p className="text-sm text-zinc-400">
                Elige el primer horario disponible
              </p>
            </div>
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              selectedBarber?.id === 'any'
                ? "border-amber-500 bg-amber-500"
                : "border-zinc-600 group-hover:border-zinc-500"
            )}>
              {selectedBarber?.id === 'any' && <CheckCircle2 className="w-4 h-4 text-black" />}
            </div>
          </div>
        </Card>

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
