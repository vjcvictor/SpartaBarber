import { useState } from 'react';
import DateTimeSelection from '../DateTimeSelection';

const mockSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export default function DateTimeSelectionExample() {
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <DateTimeSelection
          selectedDate={date}
          selectedTime={time}
          onDateSelect={setDate}
          onTimeSelect={setTime}
          availableSlots={mockSlots}
        />
      </div>
    </div>
  );
}
