import BookingConfirmation from '../BookingConfirmation';
import barber1 from '@assets/stock_images/professional_male_ba_17aca5e8.jpg';

const mockService = {
  id: '2',
  name: 'Corte + Barba',
  icon: '🧔‍♂️',
  durationMin: 45,
  priceCOP: 25000,
  description: 'Corte completo más arreglo de barba',
};

const mockBarber = {
  id: '1',
  name: 'Miguel Herrera',
  photoUrl: barber1,
  rating: 4.9,
  reviewCount: 80,
};

export default function BookingConfirmationExample() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <BookingConfirmation
        service={mockService}
        barber={mockBarber}
        date={new Date(2025, 4, 10)}
        time="16:30"
        onNewBooking={() => console.log('New booking')}
        onRegister={() => console.log('Register')}
        onLogin={() => console.log('Login')}
        onDownloadICS={() => console.log('Download ICS')}
      />
    </div>
  );
}
