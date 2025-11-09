import { useState } from 'react';
import BarberSelection from '../BarberSelection';
import type { Barber } from '@/lib/store';
import barber1 from '@assets/stock_images/professional_male_ba_17aca5e8.jpg';
import barber2 from '@assets/stock_images/professional_male_ba_7286d797.jpg';
import barber3 from '@assets/stock_images/professional_male_ba_f37dd0c0.jpg';

const mockBarbers: Barber[] = [
  {
    id: '1',
    name: 'Andrés',
    photoUrl: barber1,
    rating: 4.8,
    reviewCount: 54,
  },
  {
    id: '2',
    name: 'Miguel',
    photoUrl: barber2,
    rating: 4.9,
    reviewCount: 80,
  },
  {
    id: '3',
    name: 'Carlos',
    photoUrl: barber3,
    rating: 4.7,
    reviewCount: 42,
  },
];

export default function BarberSelectionExample() {
  const [selected, setSelected] = useState<Barber | null>(null);
  
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <BarberSelection 
          barbers={mockBarbers}
          selectedBarber={selected}
          onSelect={setSelected}
        />
      </div>
    </div>
  );
}
