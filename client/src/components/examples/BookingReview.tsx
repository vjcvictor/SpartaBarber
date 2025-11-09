import BookingReview from '../BookingReview';
import barber1 from '@assets/stock_images/professional_male_ba_17aca5e8.jpg';

const mockService = {
  id: '1',
  name: 'Corte + Barba',
  icon: '🧔‍♂️',
  durationMin: 45,
  priceCOP: 25000,
  description: 'Corte completo más arreglo de barba',
};

const mockBarber = {
  id: '1',
  name: 'Andrés',
  photoUrl: barber1,
  rating: 4.8,
  reviewCount: 54,
};

const mockClientData = {
  fullName: 'Juan Pérez',
  phoneE164: '+57 300 123 4567',
  email: 'juan@ejemplo.com',
  notes: 'Prefiero corte bajo en los lados',
};

export default function BookingReviewExample() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto">
        <BookingReview
          service={mockService}
          barber={mockBarber}
          date={new Date()}
          time="10:30"
          clientData={mockClientData}
        />
      </div>
    </div>
  );
}
