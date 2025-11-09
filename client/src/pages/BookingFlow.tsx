import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useBookingStore } from '@/lib/store';
import BookingProgress from '@/components/BookingProgress';
import ServiceSelection from '@/components/ServiceSelection';
import BarberSelection from '@/components/BarberSelection';
import DateTimeSelection from '@/components/DateTimeSelection';
import ClientForm from '@/components/ClientForm';
import BookingReview from '@/components/BookingReview';
import BookingConfirmation from '@/components/BookingConfirmation';
import barber1 from '@assets/stock_images/professional_male_ba_17aca5e8.jpg';
import barber2 from '@assets/stock_images/professional_male_ba_7286d797.jpg';
import barber3 from '@assets/stock_images/professional_male_ba_f37dd0c0.jpg';

const mockServices = [
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

const mockBarbers = [
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

const mockSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export default function BookingFlow() {
  const {
    currentStep,
    selectedService,
    selectedBarber,
    selectedDate,
    selectedTime,
    clientData,
    setService,
    setBarber,
    setDate,
    setTime,
    setClientData,
    goBack,
    goNext,
    reset,
  } = useBookingStore();

  const handleClientFormSubmit = (data: any) => {
    const phoneE164 = `${data.countryCode} ${data.phone}`;
    setClientData({
      fullName: data.fullName,
      phoneE164,
      email: data.email,
      notes: data.notes || '',
    });
    goNext();
  };

  const handleConfirmBooking = () => {
    console.log('Booking confirmed!', {
      service: selectedService,
      barber: selectedBarber,
      date: selectedDate,
      time: selectedTime,
      clientData,
    });
    goNext();
  };

  const handleDownloadICS = () => {
    console.log('Downloading ICS file...');
    alert('En la versión completa, esto descargará un archivo .ics para agregar a tu calendario');
  };

  const canProceedFromStep1 = selectedService && selectedBarber;
  const canProceedFromStep2 = selectedDate && selectedTime;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <BookingProgress currentStep={currentStep} />
        
        <div className="mt-8">
          {currentStep > 1 && currentStep < 4 && (
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-6"
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
          )}

          {currentStep === 1 && (
            <div className="space-y-8">
              <ServiceSelection
                services={mockServices}
                selectedService={selectedService}
                onSelect={setService}
              />
              {selectedService && (
                <BarberSelection
                  barbers={mockBarbers}
                  selectedBarber={selectedBarber}
                  onSelect={setBarber}
                />
              )}
              {canProceedFromStep1 && (
                <div className="flex justify-end">
                  <Button 
                    size="lg" 
                    onClick={goNext}
                    data-testid="button-next-step1"
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
              <DateTimeSelection
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateSelect={setDate}
                onTimeSelect={setTime}
                availableSlots={selectedDate ? mockSlots : []}
              />
              {canProceedFromStep2 && (
                <div className="flex justify-end">
                  <Button 
                    size="lg" 
                    onClick={goNext}
                    data-testid="button-next-step2"
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && selectedService && selectedBarber && selectedDate && selectedTime && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <ClientForm
                  initialData={{
                    fullName: clientData.fullName,
                    countryCode: '+57',
                    phone: clientData.phoneE164.replace('+57 ', ''),
                    email: clientData.email,
                    notes: clientData.notes,
                  }}
                  onSubmit={handleClientFormSubmit}
                />
              </div>
              <div>
                <BookingReview
                  service={selectedService}
                  barber={selectedBarber}
                  date={selectedDate}
                  time={selectedTime}
                  clientData={clientData}
                />
                {clientData.fullName && clientData.email && (
                  <Button 
                    size="lg" 
                    className="w-full mt-6"
                    onClick={handleConfirmBooking}
                    data-testid="button-confirm-booking"
                  >
                    Confirmar Cita
                  </Button>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && selectedService && selectedBarber && selectedDate && selectedTime && (
            <BookingConfirmation
              service={selectedService}
              barber={selectedBarber}
              date={selectedDate}
              time={selectedTime}
              onNewBooking={reset}
              onRegister={() => console.log('Register clicked')}
              onLogin={() => console.log('Login clicked')}
              onDownloadICS={handleDownloadICS}
            />
          )}
        </div>
      </div>
    </div>
  );
}
