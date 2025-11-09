import { useState } from 'react';
import ServiceSelection from '../ServiceSelection';
import type { Service } from '@/lib/store';

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Corte Clásico',
    icon: '✂️',
    durationMin: 30,
    priceCOP: 15000,
    description: 'Corte tradicional con tijera y máquina',
  },
  {
    id: '2',
    name: 'Corte + Barba',
    icon: '🧔‍♂️',
    durationMin: 45,
    priceCOP: 25000,
    description: 'Corte completo más arreglo de barba',
  },
  {
    id: '3',
    name: 'Limpieza Facial',
    icon: '💧',
    durationMin: 40,
    priceCOP: 30000,
    description: 'Tratamiento facial profundo',
  },
];

export default function ServiceSelectionExample() {
  const [selected, setSelected] = useState<Service | null>(null);
  
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <ServiceSelection 
          services={mockServices}
          selectedService={selected}
          onSelect={setSelected}
        />
      </div>
    </div>
  );
}
