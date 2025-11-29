import { useState } from 'react';
import BarberSelection from '../BarberSelection';
import type { Barber } from '@shared/schema';
import barber1 from '@assets/stock_images/professional_male_ba_17aca5e8.jpg';
import barber2 from '@assets/stock_images/professional_male_ba_7286d797.jpg';
import barber3 from '@assets/stock_images/professional_male_ba_f37dd0c0.jpg';

const mockBarbers: Barber[] = [
  {
    id: '1',
    name: 'Andrés',
    photoUrl: barber1,
    phone: null,
    active: true,
    weeklySchedule: [],
    exceptions: [],
    services: [],
  },
  {
    id: '2',
    name: 'Miguel',
    photoUrl: barber2,
    phone: null,
    active: true,
    weeklySchedule: [],
    exceptions: [],
    services: [],
  },
  {
    id: '3',
    name: 'Carlos',
    photoUrl: barber3,
    phone: null,
    active: true,
    weeklySchedule: [],
    exceptions: [],
    services: [],
  },
];

export default function BarberSelectionExample() {
  const [selected, setSelected] = useState<Barber | null>(null);

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <BarberSelection
          serviceId="example-service-id"
          barbers={mockBarbers}
          selectedBarber={selected}
          onSelect={setSelected}
          isLoading={false}
        />
      </div>
    </div>
  );
}
